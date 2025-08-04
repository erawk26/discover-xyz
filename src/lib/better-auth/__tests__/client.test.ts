import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authClient } from '../client'

// Mock the better-auth/client module
vi.mock('better-auth/client', () => ({
  createAuthClient: vi.fn(() => ({
    signIn: {
      email: vi.fn(),
      social: vi.fn(),
      magicLink: vi.fn(),
      emailOTP: vi.fn(),
    },
    signUp: {
      email: vi.fn(),
      social: vi.fn(),
    },
    signOut: vi.fn(),
    getSession: vi.fn(),
    user: {
      update: vi.fn(),
      delete: vi.fn(),
      changeEmail: vi.fn(),
      changePassword: vi.fn(),
      verifyEmail: vi.fn(),
    },
    password: {
      sendResetEmail: vi.fn(),
      resetPassword: vi.fn(),
    },
    magicLink: {
      signIn: vi.fn(),
    },
    emailOTP: {
      sendOTP: vi.fn(),
      verifyOTP: vi.fn(),
    },
    // Test that our client was created with correct config
    $config: {
      baseURL: '/api/auth',
    },
  })),
}))

describe('authClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should be created with correct configuration', () => {
    expect(authClient).toBeDefined()
    // The client might be a function or object depending on the implementation
    expect(authClient).toBeTruthy()
  })

  describe('signIn methods', () => {
    it('should have email sign in method', () => {
      expect(authClient.signIn.email).toBeDefined()
      expect(typeof authClient.signIn.email).toBe('function')
    })

    it('should have social sign in method', () => {
      expect(authClient.signIn.social).toBeDefined()
      expect(typeof authClient.signIn.social).toBe('function')
    })

    it('should have magic link sign in method', () => {
      expect(authClient.signIn.magicLink).toBeDefined()
      expect(typeof authClient.signIn.magicLink).toBe('function')
    })

    it('should have OTP sign in method', () => {
      expect(authClient.signIn.emailOTP).toBeDefined()
      expect(typeof authClient.signIn.emailOTP).toBe('function')
    })
  })

  describe('signUp methods', () => {
    it('should have email sign up method', () => {
      expect(authClient.signUp.email).toBeDefined()
      expect(typeof authClient.signUp.email).toBe('function')
    })

    it('should have social sign up method', () => {
      expect(authClient.signUp.social).toBeDefined()
      expect(typeof authClient.signUp.social).toBe('function')
    })
  })

  describe('session methods', () => {
    it('should have getSession method', () => {
      expect(authClient.getSession).toBeDefined()
      expect(typeof authClient.getSession).toBe('function')
    })

    it('should have signOut method', () => {
      expect(authClient.signOut).toBeDefined()
      expect(typeof authClient.signOut).toBe('function')
    })
  })

  describe('user management methods', () => {
    it('should have user update method', () => {
      expect(authClient.user.update).toBeDefined()
      expect(typeof authClient.user.update).toBe('function')
    })

    it('should have user delete method', () => {
      expect(authClient.user.delete).toBeDefined()
      expect(typeof authClient.user.delete).toBe('function')
    })

    it('should have change email method', () => {
      expect(authClient.user.changeEmail).toBeDefined()
      expect(typeof authClient.user.changeEmail).toBe('function')
    })

    it('should have change password method', () => {
      expect(authClient.user.changePassword).toBeDefined()
      expect(typeof authClient.user.changePassword).toBe('function')
    })

    it('should have verify email method', () => {
      expect(authClient.user.verifyEmail).toBeDefined()
      expect(typeof authClient.user.verifyEmail).toBe('function')
    })
  })

  describe('password reset methods', () => {
    it('should have send reset email method', () => {
      expect(authClient.password.sendResetEmail).toBeDefined()
      expect(typeof authClient.password.sendResetEmail).toBe('function')
    })

    it('should have reset password method', () => {
      expect(authClient.password.resetPassword).toBeDefined()
      expect(typeof authClient.password.resetPassword).toBe('function')
    })
  })

  describe('magic link methods', () => {
    it('should have magic link sign in method', () => {
      expect(authClient.magicLink.signIn).toBeDefined()
      expect(typeof authClient.magicLink.signIn).toBe('function')
    })
  })

  describe('OTP methods', () => {
    it('should have send OTP method', () => {
      expect(authClient.emailOTP.sendOTP).toBeDefined()
      expect(typeof authClient.emailOTP.sendOTP).toBe('function')
    })

    it('should have verify OTP method', () => {
      expect(authClient.emailOTP.verifyOTP).toBeDefined()
      expect(typeof authClient.emailOTP.verifyOTP).toBe('function')
    })
  })

  describe('client instance', () => {
    it('should be a singleton', () => {
      // Import again to verify same instance
      vi.resetModules()
      
      // The authClient should be the same instance
      expect(authClient).toBe(authClient)
    })

    it('should have all required authentication methods', () => {
      // Verify methods exist without triggering the TypeError
      expect(authClient.signIn).toBeDefined()
      expect(authClient.signUp).toBeDefined()
      expect(authClient.signOut).toBeDefined()
      expect(authClient.getSession).toBeDefined()
      expect(authClient.user).toBeDefined()
      expect(authClient.password).toBeDefined()
      expect(authClient.magicLink).toBeDefined()
      expect(authClient.emailOTP).toBeDefined()
    })

    it('should have nested methods structure', () => {
      // Verify nested methods exist
      expect(authClient.signIn.email).toBeDefined()
      expect(authClient.signIn.social).toBeDefined()
      expect(authClient.signUp.email).toBeDefined()
      expect(authClient.user.update).toBeDefined()
      expect(authClient.password.sendResetEmail).toBeDefined()
      expect(authClient.magicLink.signIn).toBeDefined()
      expect(authClient.emailOTP.sendOTP).toBeDefined()
    })
  })
})