import 'vitest'

interface CustomMatchers<R = unknown> {
  toBeInTheDocument(): R
  toBeVisible(): R
  toBeDisabled(): R
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}