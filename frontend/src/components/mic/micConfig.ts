/**
 * Microphone Configuration
 * Settings for microphone audio input
 */

// Microphone stream constraints
export const MIC_CONFIG = {
  echoCancellation: false, // Match blog post - disable echo cancellation
} as const

// Error messages
export const MIC_ERROR_MESSAGES = {
  PERMISSION_DENIED:
    'Microphone permission denied. Please allow microphone access.',
  NOT_FOUND: 'No microphone found. Please connect a microphone.',
  NOT_READABLE:
    'Microphone is not readable. It may be in use by another application.',
  GENERIC:
    'Failed to access microphone. Please check your microphone permissions.',
} as const
