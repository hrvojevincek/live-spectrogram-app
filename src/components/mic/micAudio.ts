/**
 * Microphone Audio Helpers
 * Functions for managing microphone audio context and stream
 */

import { MIC_CONFIG, MIC_ERROR_MESSAGES } from './micConfig'
import { ANALYSER_CONFIG } from '../spectrogram/spectrogramConfig'
import { calculateFFTSize } from '../spectrogram/spectrogramHelpers'

export interface MicAudioState {
  stream: MediaStream
  audioContext: AudioContext
}

export interface MicAudioPipeline {
  audioContext: AudioContext
  analyser: AnalyserNode
  source: MediaStreamAudioSourceNode
  bufferLength: number
}

/**
 * Request microphone access and create audio context
 */
export async function requestMicrophoneAccess(): Promise<MicAudioState> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: MIC_CONFIG.echoCancellation },
  })

  const AudioContextClass =
    window.AudioContext || (window as any).webkitAudioContext
  const audioContext = new AudioContextClass()

  // Resume audio context if suspended (required after user interaction)
  if (audioContext.state === 'suspended') {
    await audioContext.resume()
  }

  return { stream, audioContext }
}

/**
 * Stop microphone stream and close audio context
 */
export async function stopMicrophone(
  stream: MediaStream | null,
  audioContext: AudioContext | null,
): Promise<void> {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop())
  }

  if (audioContext && audioContext.state !== 'closed') {
    try {
      await audioContext.close()
    } catch (e) {
      // Ignore close errors
    }
  }
}

/**
 * Verify microphone stream has active audio tracks
 */
export function hasActiveAudioTracks(stream: MediaStream): boolean {
  const activeTracks = stream
    .getAudioTracks()
    .filter((track) => track.readyState === 'live')
  return activeTracks.length > 0
}

/**
 * Check if audio context is valid (not closed)
 */
export function isAudioContextValid(
  audioContext: AudioContext | null,
): boolean {
  if (!audioContext) return false
  return (audioContext.state as string) !== 'closed'
}

/**
 * Ensure audio context is running (resume if suspended)
 */
export async function ensureAudioContextRunning(
  audioContext: AudioContext,
): Promise<boolean> {
  if (audioContext.state === 'suspended') {
    try {
      await audioContext.resume()
      return true
    } catch (err) {
      console.error('Failed to resume audio context:', err)
      return false
    }
  }
  return true
}

/**
 * Create microphone audio pipeline (analyser + source)
 */
export function createMicAudioPipeline(
  stream: MediaStream,
  audioContext: AudioContext,
  frequencySamples: number,
): MicAudioPipeline {
  // Verify stream is active
  if (!hasActiveAudioTracks(stream)) {
    throw new Error('No active audio tracks in microphone stream')
  }

  // Verify context is valid
  if (!isAudioContextValid(audioContext)) {
    throw new Error('Audio context is closed')
  }

  // Create analyser
  const fftSize = calculateFFTSize(frequencySamples)
  const analyser = audioContext.createAnalyser()
  analyser.fftSize = fftSize
  analyser.smoothingTimeConstant = ANALYSER_CONFIG.SMOOTHING_TIME_CONSTANT

  // Create MediaStreamAudioSourceNode
  const source = audioContext.createMediaStreamSource(stream)
  source.connect(analyser)
  // Don't connect analyser to destination (as per blog post) to avoid feedback

  return {
    audioContext,
    analyser,
    source,
    bufferLength: analyser.frequencyBinCount,
  }
}

/**
 * Get user-friendly error message from microphone error
 */
export function getMicrophoneErrorMessage(error: any): string {
  if (!error) return MIC_ERROR_MESSAGES.GENERIC

  const errorName = error.name || ''
  const errorMessage = error.message || ''

  if (
    errorName === 'NotAllowedError' ||
    errorName === 'PermissionDeniedError'
  ) {
    return MIC_ERROR_MESSAGES.PERMISSION_DENIED
  }
  if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
    return MIC_ERROR_MESSAGES.NOT_FOUND
  }
  if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
    return MIC_ERROR_MESSAGES.NOT_READABLE
  }

  return errorMessage || MIC_ERROR_MESSAGES.GENERIC
}
