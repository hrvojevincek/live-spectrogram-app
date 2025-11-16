/**
 * Spectrogram Helper Functions
 * Utility functions for spectrogram calculations and operations
 */

import {
  ANALYSER_CONFIG,
  COLOR_SCHEME_VALUES,
  type ColorScheme,
} from './spectrogramConfig'

/**
 * Calculate the nearest power of 2 for FFT size
 * FFT size must be a power of 2 for Web Audio API
 */
export function getNearestPowerOf2(value: number): number {
  if (value <= 0) return ANALYSER_CONFIG.MIN_FFT_SIZE
  const power = Math.round(Math.log2(value))
  return Math.pow(
    2,
    Math.max(
      Math.log2(ANALYSER_CONFIG.MIN_FFT_SIZE),
      Math.min(Math.log2(ANALYSER_CONFIG.MAX_FFT_SIZE), power),
    ),
  )
}

/**
 * Calculate FFT size from frequency samples
 */
export function calculateFFTSize(frequencySamples: number): number {
  return getNearestPowerOf2(ANALYSER_CONFIG.FFT_MULTIPLIER * frequencySamples)
}

/**
 * Calculate total number of vertices for the mesh
 */
export function calculateVertexCount(
  frequencySamples: number,
  timeSamples: number,
): number {
  return (frequencySamples + 1) * (timeSamples + 1)
}

/**
 * Validate spectrogram parameters
 */
export function validateParameters(params: {
  xsize: number
  ysize: number
  frequencySamples: number
  timeSamples: number
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (params.xsize <= 0) {
    errors.push('xsize must be greater than 0')
  }
  if (params.ysize <= 0) {
    errors.push('ysize must be greater than 0')
  }
  if (params.frequencySamples <= 0) {
    errors.push('frequencySamples must be greater than 0')
  }
  if (params.timeSamples <= 0) {
    errors.push('timeSamples must be greater than 0')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Generate logarithmic Y position for frequency axis
 * Uses natural logarithm for perceptual frequency scaling
 */
export function calculateLogarithmicY(
  segmentIndex: number,
  totalSegments: number,
  ysize: number,
): number {
  const ypow_max = Math.log(ysize)
  const yhalfSize = ysize / 2
  const powr = ((totalSegments - segmentIndex) / totalSegments) * ypow_max
  return -Math.pow(Math.E, powr) + yhalfSize + 1
}

/**
 * Convert color scheme string to shader uniform value
 */
export function getColorSchemeValue(colorScheme: ColorScheme): number {
  return COLOR_SCHEME_VALUES[colorScheme] ?? COLOR_SCHEME_VALUES.purple
}
