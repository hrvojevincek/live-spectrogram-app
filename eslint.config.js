//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  {
    // Don’t run TypeScript ESLint on these JS config files
    ignores: ['eslint.config.js', 'prettier.config.js'],
  },
  ...tanstackConfig,
]
