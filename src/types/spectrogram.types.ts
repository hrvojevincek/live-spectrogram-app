/**
 * Spectrogram Types
 * Shared type definitions for spectrogram components
 */

import { type ColorScheme } from '@/components/spectrogram/spectrogramConfig'

/**
 * Props for LiveSpectrogram component
 */
export interface LiveSpectrogramProps {
  audioElement?: HTMLAudioElement | null
  micStream?: MediaStream | null
  micAudioContext?: AudioContext | null
  isActive: boolean
  zoom: number
  maxHeight: number
  xsize: number
  ysize: number
  frequencySamples: number
  timeSamples: number
  colorScheme: ColorScheme
}
