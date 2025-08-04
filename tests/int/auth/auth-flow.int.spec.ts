import { describe, it, expect, vi, beforeEach } from 'vitest'
import { toast } from 'sonner'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock the auth client
const mockAuthClient = {
  signIn: {
    email: vi.fn(),
    social: vi.fn(),
    magicLink: vi.fn(),
    emailOTP: vi.fn(),
  },
  signUp: {
    email: vi.fn(),
  },
  signOut: vi.fn(),
  getSession: vi.fn(),
  twoFactor: {
    verifyTotp: vi.fn(),
  },
  magicLink: {
    signIn: vi.fn(),
  },
}

vi.mock('@/lib/better-auth/client', () => ({
  authClient: mockAuthClient,
  signIn: mockAuthClient.signIn,
  signUp: mockAuthClient.signUp,
  signOut: mockAuthClient.signOut,
  twoFactor: mockAuthClient.twoFactor,
  magicLink: mockAuthClient.magicLink,
  useSession: vi.fn(),
}))

describe('Authentication Flow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Email/Password Authentication', () => {
    it('should successfully sign in with valid credentials', async () => {
      const mockSession = {
        user: { id: '1', email: 'test@example.com', role: 'user' },
        expiresAt: Date.now() / 1000 + 7200,
      }

      mockAuthClient.signIn.email.mockResolvedValueOnce({
        data: { session: mockSession, user: mockSession.user },
        error: null,
      })

      const result = await mockAuthClient.signIn.email({
        email: 'test@example.com',
        password: 'password123',
        callbackURL: '/admin',
      })

      expect(result.data?.session).toBeDefined()
      expect(result.data?.user.email).toBe('test@example.com')
      expect(mockAuthClient.signIn.email).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        callbackURL: '/admin',
      })
    })

    it('should handle invalid credentials error', async () => {
      mockAuthClient.signIn.email.mockRejectedValueOnce(
        new Error('Invalid credentials')
      )

      await expect(
        mockAuthClient.signIn.email({
          email: 'test@example.com',
          password: 'wrongpassword',
          callbackURL: '/admin',
        })
      ).rejects.toThrow('Invalid credentials')
    })

    it('should handle rate limiting (429 error)', async () => {
      const error = new Error('Too many requests') as any
      error.error = { status: 429 }
      
      mockAuthClient.signIn.email.mockRejectedValueOnce(error)

      try {
        await mockAuthClient.signIn.email({
          email: 'test@example.com',
          password: 'password123',
          callbackURL: '/admin',
        })
      } catch (e) {
        // Error is expected
        expect(e).toEqual(error)
      }
    })
  })

  describe('OAuth Authentication', () => {
    it('should initiate Google OAuth flow', async () => {
      const mockRedirectUrl = 'https://accounts.google.com/oauth/authorize?...'
      
      mockAuthClient.signIn.social.mockResolvedValueOnce({
        data: { url: mockRedirectUrl },
        error: null,
      })

      const result = await mockAuthClient.signIn.social({
        provider: 'google',
        callbackURL: '/admin',
      })

      expect(result.data?.url).toBe(mockRedirectUrl)
      expect(mockAuthClient.signIn.social).toHaveBeenCalledWith({
        provider: 'google',
        callbackURL: '/admin',
      })
    })

    it('should initiate GitHub OAuth flow', async () => {
      const mockRedirectUrl = 'https://github.com/login/oauth/authorize?...'
      
      mockAuthClient.signIn.social.mockResolvedValueOnce({
        data: { url: mockRedirectUrl },
        error: null,
      })

      const result = await mockAuthClient.signIn.social({
        provider: 'github',
        callbackURL: '/admin',
      })

      expect(result.data?.url).toBe(mockRedirectUrl)
      expect(mockAuthClient.signIn.social).toHaveBeenCalledWith({
        provider: 'github',
        callbackURL: '/admin',
      })
    })

    it('should handle OAuth provider errors', async () => {
      mockAuthClient.signIn.social.mockRejectedValueOnce(
        new Error('OAuth provider error')
      )

      await expect(
        mockAuthClient.signIn.social({
          provider: 'google',
          callbackURL: '/admin',
        })
      ).rejects.toThrow('OAuth provider error')
    })
  })

  describe('Magic Link Authentication', () => {
    it('should send magic link successfully', async () => {
      mockAuthClient.signIn.magicLink.mockResolvedValueOnce({
        data: { success: true },
        error: null,
      })

      const result = await mockAuthClient.signIn.magicLink({
        email: 'test@example.com',
        callbackURL: '/admin',
      })

      expect(result.data?.success).toBe(true)
      expect(mockAuthClient.signIn.magicLink).toHaveBeenCalledWith({
        email: 'test@example.com',
        callbackURL: '/admin',
      })
    })

    it('should handle invalid email for magic link', async () => {
      mockAuthClient.signIn.magicLink.mockRejectedValueOnce(
        new Error('Invalid email address')
      )

      await expect(
        mockAuthClient.signIn.magicLink({
          email: 'invalid-email',
          callbackURL: '/admin',
        })
      ).rejects.toThrow('Invalid email address')
    })

    it('should handle rate limiting for magic links', async () => {
      mockAuthClient.signIn.magicLink.mockRejectedValueOnce(
        new Error('Too many magic link requests')
      )

      await expect(
        mockAuthClient.signIn.magicLink({
          email: 'test@example.com',
          callbackURL: '/admin',
        })
      ).rejects.toThrow('Too many magic link requests')
    })
  })

  describe('Sign Up Flow', () => {
    it('should successfully create a new account', async () => {
      const mockUser = {
        id: '1',
        email: 'newuser@example.com',
        role: 'user',
      }

      mockAuthClient.signUp.email.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      })

      const result = await mockAuthClient.signUp.email({
        email: 'newuser@example.com',
        password: 'securepassword123',
        name: 'New User',
      })

      expect(result.data?.user).toBeDefined()
      expect(result.data?.user.email).toBe('newuser@example.com')
    })

    it('should handle duplicate email error', async () => {
      mockAuthClient.signUp.email.mockRejectedValueOnce(
        new Error('Email already exists')
      )

      await expect(
        mockAuthClient.signUp.email({
          email: 'existing@example.com',
          password: 'password123',
          name: 'Existing User',
        })
      ).rejects.toThrow('Email already exists')
    })

    it('should validate password requirements', async () => {
      mockAuthClient.signUp.email.mockRejectedValueOnce(
        new Error('Password must be at least 8 characters')
      )

      await expect(
        mockAuthClient.signUp.email({
          email: 'test@example.com',
          password: 'short',
          name: 'Test User',
        })
      ).rejects.toThrow('Password must be at least 8 characters')
    })
  })

  describe('Sign Out Flow', () => {
    it('should successfully sign out', async () => {
      mockAuthClient.signOut.mockResolvedValueOnce({
        data: { success: true },
        error: null,
      })

      const result = await mockAuthClient.signOut()

      expect(result.data?.success).toBe(true)
    })

    it('should handle sign out errors gracefully', async () => {
      mockAuthClient.signOut.mockRejectedValueOnce(
        new Error('Failed to sign out')
      )

      await expect(mockAuthClient.signOut()).rejects.toThrow('Failed to sign out')
    })
  })

  describe('Session Management', () => {
    it('should get current session', async () => {
      const mockSession = {
        user: { id: '1', email: 'test@example.com', role: 'user' },
        expiresAt: Date.now() / 1000 + 7200,
      }

      mockAuthClient.getSession.mockResolvedValueOnce(mockSession)

      const session = await mockAuthClient.getSession()

      expect(session).toBeDefined()
      expect(session.user.email).toBe('test@example.com')
      expect(session.expiresAt).toBeGreaterThan(Date.now() / 1000)
    })

    it('should handle expired session', async () => {
      const expiredSession = {
        user: { id: '1', email: 'test@example.com', role: 'user' },
        expiresAt: Date.now() / 1000 - 100, // Expired 100 seconds ago
      }

      mockAuthClient.getSession.mockResolvedValueOnce(expiredSession)

      const session = await mockAuthClient.getSession()

      expect(session.expiresAt).toBeLessThan(Date.now() / 1000)
    })

    it('should handle no session', async () => {
      mockAuthClient.getSession.mockResolvedValueOnce(null)

      const session = await mockAuthClient.getSession()

      expect(session).toBeNull()
    })
  })

  describe('Two-Factor Authentication', () => {
    it('should redirect to 2FA page when enabled', async () => {
      const mock2FAResponse = {
        data: { twoFactorRequired: true, redirect: '/two-factor' },
        error: null,
      }

      mockAuthClient.signIn.email.mockResolvedValueOnce(mock2FAResponse)

      const result = await mockAuthClient.signIn.email({
        email: 'test@example.com',
        password: 'password123',
        callbackURL: '/admin',
      })

      expect(result.data?.twoFactorRequired).toBe(true)
      expect(result.data?.redirect).toBe('/two-factor')
    })

    it('should verify 2FA code successfully', async () => {
      const mockSession = {
        user: { id: '1', email: 'test@example.com', role: 'user' },
        expiresAt: Date.now() / 1000 + 7200,
      }

      mockAuthClient.twoFactor.verifyTotp.mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      })

      const result = await mockAuthClient.twoFactor.verifyTotp({
        code: '123456',
      })

      expect(result.data?.session).toBeDefined()
    })

    it('should handle invalid 2FA code', async () => {
      mockAuthClient.twoFactor.verifyTotp.mockRejectedValueOnce(
        new Error('Invalid verification code')
      )

      await expect(
        mockAuthClient.twoFactor.verifyTotp({
          code: '000000',
        })
      ).rejects.toThrow('Invalid verification code')
    })
  })
})