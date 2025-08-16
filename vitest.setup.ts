// Any setup scripts you might need go here

// Load .env files
import 'dotenv/config'
import { expect, vi } from 'vitest'

// Mock payload-auth to avoid ES module import issues
vi.mock('payload-auth/better-auth', () => ({
  betterAuthPlugin: vi.fn(() => ({
    name: 'better-auth-plugin',
    init: vi.fn(),
  })),
}))

// Set test environment
// process.env.NODE_ENV = 'test' // Already set by vitest

// Configure test database
if (!process.env.TEST_DATABASE_URI) {
  // Use a separate test database
  const baseUri = process.env.DATABASE_URI || 'mongodb://127.0.0.1/discover-xyz'
  process.env.TEST_DATABASE_URI = baseUri.replace(/\/[^/]+$/, '/discover-xyz-test')
}

// Mock window.matchMedia for theme provider tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => {
    const isDarkQuery = query.includes('prefers-color-scheme: dark')
    return {
      matches: isDarkQuery ? false : false, // Default to light mode
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }
  }),
})

// Add custom DOM matchers
expect.extend({
  toBeInTheDocument(received) {
    const pass = received && received.ownerDocument && received.ownerDocument.contains(received)
    return {
      message: () => `expected element ${pass ? 'not ' : ''}to be in the document`,
      pass,
    }
  },
  toBeVisible(received) {
    const pass = received && received.offsetParent !== null
    return {
      message: () => `expected element ${pass ? 'not ' : ''}to be visible`,
      pass,
    }
  },
  toBeDisabled(received) {
    const pass = received && received.disabled === true
    return {
      message: () => `expected element ${pass ? 'not ' : ''}to be disabled`,
      pass,
    }
  },
})
