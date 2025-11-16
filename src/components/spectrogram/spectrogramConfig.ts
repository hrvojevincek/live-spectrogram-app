/**
 * Spectrogram Configuration - Single Source of Truth
 * All constants and default values for the spectrogram visualization
 */

// Camera settings (from blog post: https://calebgannon.com/2021/01/09/spectrogram-with-three-js-and-glsl-shaders/)
export const CAMERA_CONFIG = {
  FOV: 27, // Field of view in degrees
  NEAR: 1, // Near clipping plane
  FAR: 1000, // Far clipping plane
  DEFAULT_Z_POSITION: 64, // Default camera Z position (blog post default)
} as const

// Renderer settings
export const RENDERER_CONFIG = {
  DEFAULT_WIDTH: 950,
  DEFAULT_HEIGHT: 800,
  ANTIALIAS: true,
} as const

// Analyser settings
export const ANALYSER_CONFIG = {
  SMOOTHING_TIME_CONSTANT: 0.5,
  FFT_MULTIPLIER: 4, // FFT size = 4 * frequencySamples
  MIN_FFT_SIZE: 256, // 2^8
  MAX_FFT_SIZE: 16384, // 2^14
} as const

// Geometry settings
export const GEOMETRY_CONFIG = {
  LOGARITHMIC_BASE: Math.E, // Natural logarithm base for frequency scaling
} as const

// Color scheme values (mapped to shader uniform)
export const COLOR_SCHEME_VALUES = {
  'green-red': 0,
  'purple-yellow': 1,
  'blue-cyan': 2,
  purple: 3, // Blog post style
  'red-yellow': 4, // Fire gradient
  'blue-magenta': 5,
  rainbow: 6, // HSV rainbow
  grayscale: 7,
  'orange-red': 8,
  'cyan-blue': 9,
  'yellow-green': 10,
} as const

export type ColorScheme = keyof typeof COLOR_SCHEME_VALUES

// Validation ranges
export const VALIDATION_RANGES = {
  xsize: { min: 1, max: 200 },
  ysize: { min: 1, max: 100 },
  frequencySamples: { min: 64, max: 512, step: 64 },
  timeSamples: { min: 200, max: 1200, step: 100 },
  zoom: { min: 20, max: 150 },
  maxHeight: { min: 1, max: 30, step: 0.5 },
} as const
