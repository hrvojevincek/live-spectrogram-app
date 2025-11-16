/**
 * Spectrogram Audio Helpers
 * Functions for managing Web Audio API setup and audio context
 */

import { ANALYSER_CONFIG } from './spectrogramConfig'
import { calculateFFTSize } from './spectrogramHelpers'

export interface AudioContextState {
  audioContext: AudioContext
  analyser: AnalyserNode
  source: MediaElementAudioSourceNode
  bufferLength: number
}

/**
 * Create a new AudioContext and AnalyserNode
 */
export function createAudioContext(fftSize: number): {
  audioContext: AudioContext
  analyser: AnalyserNode
} {
  const audioContext = new AudioContext()
  const analyser = audioContext.createAnalyser()
  analyser.fftSize = fftSize
  analyser.smoothingTimeConstant = ANALYSER_CONFIG.SMOOTHING_TIME_CONSTANT

  return { audioContext, analyser }
}

/**
 * Create MediaElementSource from audio element
 * Handles the "already connected" error gracefully
 */
export function createMediaElementSource(
  audioContext: AudioContext,
  audioElement: HTMLAudioElement,
): MediaElementAudioSourceNode {
  try {
    const source = audioContext.createMediaElementSource(audioElement)
    return source
  } catch (error: any) {
    if (error.message && error.message.includes('already connected')) {
      throw new Error(
        'Audio element already connected to a MediaElementSource. Cannot create new source.',
      )
    }
    throw error
  }
}

/**
 * Connect audio nodes: source → analyser → destination
 */
export function connectAudioNodes(
  source: MediaElementAudioSourceNode,
  analyser: AnalyserNode,
  audioContext: AudioContext,
): void {
  source.connect(analyser)
  analyser.connect(audioContext.destination)
}

/**
 * Setup complete audio pipeline
 */
export function setupAudioPipeline(
  audioElement: HTMLAudioElement,
  frequencySamples: number,
): AudioContextState {
  const fftSize = calculateFFTSize(frequencySamples)
  const { audioContext, analyser } = createAudioContext(fftSize)
  const source = createMediaElementSource(audioContext, audioElement)
  connectAudioNodes(source, analyser, audioContext)

  return {
    audioContext,
    analyser,
    source,
    bufferLength: analyser.frequencyBinCount,
  }
}

/**
 * Cleanup audio resources
 */
export function cleanupAudio(
  source: MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null,
  audioContext: AudioContext | null,
): void {
  if (source) {
    try {
      source.disconnect()
    } catch (e) {
      // Ignore disconnect errors
    }
  }

  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close().catch(() => {
      // Ignore close errors
    })
  }
}
