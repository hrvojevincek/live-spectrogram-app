'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import {
  calculateFFTSize,
  validateParameters,
  getColorSchemeValue,
} from './spectrogram/spectrogramHelpers'
import {
  setupAudioPipeline,
  cleanupAudio,
} from './spectrogram/spectrogramAudio'
import {
  createThreeScene,
  cleanupThreeScene,
  updateCameraOnResize,
  updateRendererOnResize,
} from './spectrogram/spectrogramThree'
import {
  createMicAudioPipeline,
  isAudioContextValid,
  ensureAudioContextRunning,
} from './mic'
import {
  updateSpectrogramData,
  updateMeshDisplacement,
} from './spectrogram/spectrogramAnimation'
import { type LiveSpectrogramProps } from '@/types'

export function LiveSpectrogram({
  audioElement,
  micStream,
  micAudioContext,
  isActive,
  zoom,
  maxHeight,
  xsize,
  ysize,
  frequencySamples,
  timeSamples,
  colorScheme,
}: LiveSpectrogramProps) {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<
    MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null
  >(null)
  const connectedAudioElementRef = useRef<HTMLAudioElement | null>(null)
  const connectedMicStreamRef = useRef<MediaStream | null>(null)

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const meshRef = useRef<THREE.Mesh | null>(null)
  const heightsRef = useRef<Uint8Array | null>(null)
  const dataRef = useRef<Uint8Array | null>(null)
  const resizeHandlerRef = useRef<(() => void) | null>(null)
  const nVerticesRef = useRef<number>(0)

  // Calculate FFT size (single source of truth)
  const FFT_SIZE = calculateFFTSize(frequencySamples)

  /**
   * Cleanup all resources
   */
  const cleanup = () => {
    // Stop animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    // Remove resize handler
    if (resizeHandlerRef.current) {
      window.removeEventListener('resize', resizeHandlerRef.current)
      resizeHandlerRef.current = null
    }

    // Cleanup audio
    // For mic: only disconnect source, don't close context (it's managed by RadioPlayer)
    if (connectedMicStreamRef.current) {
      // Mic context - just disconnect source, don't close context
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect()
        } catch (e) {
          // Ignore disconnect errors
        }
      }
      sourceRef.current = null
      connectedMicStreamRef.current = null
    } else {
      // Radio context - full cleanup including closing context
      cleanupAudio(sourceRef.current, audioContextRef.current)
      sourceRef.current = null
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {
          // Ignore close errors
        })
      }
      audioContextRef.current = null
    }
    analyserRef.current = null
    connectedAudioElementRef.current = null

    // Cleanup Three.js
    cleanupThreeScene(
      rendererRef.current,
      meshRef.current,
      sceneRef.current,
      containerRef.current,
    )
    sceneRef.current = null
    cameraRef.current = null
    rendererRef.current = null
    meshRef.current = null
    heightsRef.current = null
    dataRef.current = null
  }

  /**
   * Initialize or reuse audio context
   */
  const initializeAudio = async (): Promise<{
    audioContext: AudioContext
    analyser: AnalyserNode
    source: MediaElementAudioSourceNode | MediaStreamAudioSourceNode
  } | null> => {
    // Handle mic input
    if (micStream && micAudioContext) {
      // Check if context is valid
      if (!isAudioContextValid(micAudioContext)) {
        return null
      }

      const isSameMicStream = connectedMicStreamRef.current === micStream

      // Reuse existing audio context if same stream and still valid
      if (
        isSameMicStream &&
        audioContextRef.current &&
        isAudioContextValid(audioContextRef.current) &&
        sourceRef.current &&
        analyserRef.current
      ) {
        // Update analyser FFT size if changed
        if (analyserRef.current.fftSize !== FFT_SIZE) {
          analyserRef.current.fftSize = FFT_SIZE
        }

        return {
          audioContext: audioContextRef.current,
          analyser: analyserRef.current,
          source: sourceRef.current,
        }
      }

      // Cleanup old audio context if different
      if (
        audioContextRef.current &&
        audioContextRef.current !== micAudioContext
      ) {
        cleanupAudio(sourceRef.current, audioContextRef.current)
      }

      // Use the provided mic audio context
      audioContextRef.current = micAudioContext

      // Ensure audio context is running
      const resumed = await ensureAudioContextRunning(micAudioContext)
      if (!resumed || !isAudioContextValid(micAudioContext)) {
        return null
      }

      // Create mic audio pipeline
      try {
        const pipeline = createMicAudioPipeline(
          micStream,
          micAudioContext,
          frequencySamples,
        )

        analyserRef.current = pipeline.analyser
        sourceRef.current = pipeline.source
        connectedMicStreamRef.current = micStream
        connectedAudioElementRef.current = null

        return {
          audioContext: pipeline.audioContext,
          analyser: pipeline.analyser,
          source: pipeline.source,
        }
      } catch (error) {
        console.error('Error creating mic audio pipeline:', error)
        return null
      }
    }

    // Handle radio input (audioElement)
    if (!audioElement) return null

    const isSameAudioElement = connectedAudioElementRef.current === audioElement

    // Reuse existing audio context if same element and still valid
    if (
      isSameAudioElement &&
      audioContextRef.current &&
      isAudioContextValid(audioContextRef.current) &&
      sourceRef.current &&
      analyserRef.current
    ) {
      // Update analyser FFT size if changed
      if (analyserRef.current.fftSize !== FFT_SIZE) {
        analyserRef.current.fftSize = FFT_SIZE
      }

      return {
        audioContext: audioContextRef.current,
        analyser: analyserRef.current,
        source: sourceRef.current,
      }
    }

    // Can't re-initialize if element was already connected
    if (isSameAudioElement) {
      return null
    }

    // Cleanup old audio context
    cleanupAudio(sourceRef.current, audioContextRef.current)

    // Create new audio pipeline
    try {
      const audioState = setupAudioPipeline(audioElement, frequencySamples)
      audioContextRef.current = audioState.audioContext
      analyserRef.current = audioState.analyser
      sourceRef.current = audioState.source
      connectedAudioElementRef.current = audioElement
      connectedMicStreamRef.current = null

      return audioState
    } catch (error: any) {
      if (error.message && error.message.includes('already connected')) {
        connectedAudioElementRef.current = audioElement
      } else {
        console.error('Error setting up audio pipeline:', error)
      }
      return null
    }
  }

  /**
   * Initialize Three.js scene
   */
  const initializeThree = () => {
    const container = containerRef.current
    if (!container) return

    // Validate parameters
    const validation = validateParameters({
      xsize,
      ysize,
      frequencySamples,
      timeSamples,
    })

    if (!validation.valid) {
      return
    }

    // Cleanup existing Three.js scene
    cleanupThreeScene(
      rendererRef.current,
      meshRef.current,
      sceneRef.current,
      container,
    )

    // Create new Three.js scene
    const threeState = createThreeScene({
      container,
      zoom,
      maxHeight,
      colorScheme,
      geometryParams: {
        timeSamples,
        frequencySamples,
        xsize,
        ysize,
      },
    })

    // Store refs
    sceneRef.current = threeState.scene
    cameraRef.current = threeState.camera
    rendererRef.current = threeState.renderer
    meshRef.current = threeState.mesh
    heightsRef.current = threeState.geometryData.heights
    nVerticesRef.current = threeState.geometryData.nVertices

    // Initialize data array
    dataRef.current = new Uint8Array(frequencySamples)

    // Setup resize handler
    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return
      updateCameraOnResize(cameraRef.current, container)
      updateRendererOnResize(rendererRef.current, container)
    }
    resizeHandlerRef.current = handleResize
    window.addEventListener('resize', handleResize)
  }

  /**
   * Start animation loop
   */
  const startAnimation = () => {
    if (
      !analyserRef.current ||
      !sceneRef.current ||
      !cameraRef.current ||
      !rendererRef.current ||
      !meshRef.current ||
      !dataRef.current ||
      !heightsRef.current
    ) {
      return
    }

    const animate = () => {
      if (
        !analyserRef.current ||
        !sceneRef.current ||
        !cameraRef.current ||
        !rendererRef.current ||
        !meshRef.current ||
        !dataRef.current ||
        !heightsRef.current
      ) {
        return
      }

      // Update spectrogram data
      updateSpectrogramData(
        analyserRef.current,
        dataRef.current,
        heightsRef.current,
        frequencySamples,
        nVerticesRef.current,
      )

      // Update mesh displacement
      updateMeshDisplacement(meshRef.current, heightsRef.current)

      // Render
      rendererRef.current.render(sceneRef.current, cameraRef.current)

      // Continue animation
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }

  /**
   * Main initialization effect
   */
  useEffect(() => {
    if (!isActive || (!audioElement && !micStream)) {
      cleanup()
      return
    }

    // Initialize audio (async for mic context resume)
    const init = async () => {
      // Ensure mic audio context is resumed if needed
      if (micAudioContext && micAudioContext.state === 'suspended') {
        try {
          await micAudioContext.resume()
        } catch (err) {
          console.error('Failed to resume mic audio context:', err)
        }
      }

      // Initialize audio
      const audioState = await initializeAudio()
      if (!audioState) {
        return
      }

      // Initialize Three.js
      initializeThree()

      // Start animation
      startAnimation()
    }

    init()

    // Cleanup on unmount
    return cleanup
  }, [
    isActive,
    audioElement,
    micStream,
    micAudioContext,
    frequencySamples,
    timeSamples,
    xsize,
    ysize,
    FFT_SIZE,
  ])

  /**
   * Update camera zoom in real-time
   */
  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.position.z = zoom
    }
  }, [zoom])

  /**
   * Update material uniforms in real-time
   */
  useEffect(() => {
    if (meshRef.current?.material instanceof THREE.ShaderMaterial) {
      const material = meshRef.current.material
      material.uniforms.maxHeight.value = maxHeight
      material.uniforms.colorScheme.value = getColorSchemeValue(colorScheme)
    }
  }, [maxHeight, colorScheme])

  if (!isActive) {
    return null
  }

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <div className="mb-2 flex-shrink-0">
        <p className="text-gray-400 text-xs">
          Live 3D Spectrogram - Frequency (front: low, back: high) vs Time (left
          to right)
        </p>
      </div>

      <div
        ref={containerRef}
        className="w-full flex-1 min-h-0 rounded-lg border border-slate-600 bg-black"
      />
    </div>
  )
}
