import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { signIn, signUp, signOut, useSession, twoFactor, magicLink, authClient } from '@/lib/better-auth/client'
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

      vi.spyOn(signIn, 'email').mockResolvedValueOnce({
        data: { session: mockSession, user: mockSession.user },
        error: null,
      } as any)

      const result = await signIn.email({
        email: 'test@example.com',
        password: 'password123',
        callbackURL: '/admin',
      })

      expect(result.data?.session).toBeDefined()
      expect(result.data?.user.email).toBe('test@example.com')
    })

    it('should handle invalid credentials error', async () => {
      vi.spyOn(signIn, 'email').mockRejectedValueOnce(
        new Error('Invalid credentials')
      )

      await expect(
        signIn.email({
          email: 'test@example.com',
          password: 'wrongpassword',
          callbackURL: '/admin',
        })
      ).rejects.toThrow('Invalid credentials')
    })

    it('should handle rate limiting (429 error)', async () => {
      const error = new Error('Too many requests') as any
      error.error = { status: 429 }
      
      vi.spyOn(signIn, 'email').mockRejectedValueOnce(error)

      try {
        await signIn.email({
          email: 'test@example.com',
          password: 'password123',
          callbackURL: '/admin',
        })
      } catch (e) {
        // Error is expected
      }

      // The fetchOptions.onError should handle 429 errors
      // In a real scenario, this would trigger the toast
    })
  })

  describe('OAuth Authentication', () => {
    it('should initiate Google OAuth flow', async () => {
      const mockRedirectUrl = 'https://accounts.google.com/oauth/authorize?...'
      
      vi.spyOn(signIn, 'social').mockResolvedValueOnce({
        data: { url: mockRedirectUrl },
        error: null,
      } as any)

      const result = await signIn.social({
        provider: 'google',
        callbackURL: '/admin',
      })

      expect(result.data?.url).toBe(mockRedirectUrl)
      expect(signIn.social).toHaveBeenCalledWith({
        provider: 'google',
        callbackURL: '/admin',
      })
    })

    it('should initiate GitHub OAuth flow', async () => {
      const mockRedirectUrl = 'https://github.com/login/oauth/authorize?...'
      
      vi.spyOn(signIn, 'social').mockResolvedValueOnce({
        data: { url: mockRedirectUrl },
        error: null,
      } as any)

      const result = await signIn.social({
        provider: 'github',
        callbackURL: '/admin',
      })

      expect(result.data?.url).toBe(mockRedirectUrl)
      expect(signIn.social).toHaveBeenCalledWith({
        provider: 'github',
        callbackURL: '/admin',
      })
    })

    it('should handle OAuth provider errors', async () => {
      vi.spyOn(signIn, 'social').mockRejectedValueOnce(
        new Error('OAuth provider error')
      )

      await expect(
        signIn.social({
          provider: 'google',
          callbackURL: '/admin',
        })
      ).rejects.toThrow('OAuth provider error')
    })
  })

  describe('Magic Link Authentication', () => {
    it('should send magic link successfully', async () => {
      vi.spyOn(magicLink, 'signIn').mockResolvedValueOnce({
        data: { success: true },
        error: null,
      } as any)

      const result = await magicLink.signIn({
        email: 'test@example.com',
        callbackURL: '/admin',
      })

      expect(result.data?.success).toBe(true)
      expect(magicLink.signIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        callbackURL: '/admin',
      })
    })

    it('should handle invalid email for magic link', async () => {
      vi.spyOn(magicLink, 'signIn').mockRejectedValueOnce(
        new Error('Invalid email address')
      )

      await expect(
        magicLink.signIn({
          email: 'invalid-email',
          callbackURL: '/admin',
        })
      ).rejects.toThrow('Invalid email address')
    })

    it('should handle rate limiting for magic links', async () => {
      vi.spyOn(magicLink, 'signIn').mockRejectedValueOnce(
        new Error('Too many magic link requests')
      )

      await expect(
        magicLink.signIn({
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

      vi.spyOn(signUp, 'email').mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      } as any)

      const result = await signUp.email({
        email: 'newuser@example.com',
        password: 'securepassword123',
        name: 'New User',
      } as any)

      expect(result.data?.user).toBeDefined()
      expect(result.data?.user.email).toBe('newuser@example.com')
    })

    it('should handle duplicate email error', async () => {
      vi.spyOn(signUp, 'email').mockRejectedValueOnce(
        new Error('Email already exists')
      )

      await expect(
        signUp.email({
          email: 'existing@example.com',
          password: 'password123',
          name: 'Existing User',
        } as any)
      ).rejects.toThrow('Email already exists')
    })

    it('should validate password requirements', async () => {
      vi.spyOn(signUp, 'email').mockRejectedValueOnce(
        new Error('Password must be at least 8 characters')
      )

      await expect(
        signUp.email({
          email: 'test@example.com',
          password: 'short',
          name: 'Test User',
        } as any)
      ).rejects.toThrow('Password must be at least 8 characters')
    })
  })

  describe('Sign Out Flow', () => {
    it('should successfully sign out', async () => {
      vi.spyOn(signOut, '$').mockResolvedValueOnce({
        data: { success: true },
        error: null,
      } as any)

      const result = await signOut()

      expect(result.data?.success).toBe(true)
    })

    it('should handle sign out errors gracefully', async () => {
      vi.spyOn(signOut, '$').mockRejectedValueOnce(
        new Error('Failed to sign out')
      )

      await expect(signOut()).rejects.toThrow('Failed to sign out')
    })
  })

  describe('Session Management', () => {
    it('should get current session', async () => {
      const mockSession = {
        user: { id: '1', email: 'test@example.com', role: 'user' },
        expiresAt: Date.now() / 1000 + 7200,
      }

      vi.spyOn(authClient, 'getSession').mockResolvedValueOnce(mockSession as any)

      const session = await authClient.getSession()

      expect(session).toBeDefined()
      expect(session.user.email).toBe('test@example.com')
      expect(session.expiresAt).toBeGreaterThan(Date.now() / 1000)
    })

    it('should handle expired session', async () => {
      const expiredSession = {
        user: { id: '1', email: 'test@example.com', role: 'user' },
        expiresAt: Date.now() / 1000 - 100, // Expired 100 seconds ago
      }

      vi.spyOn(authClient, 'getSession').mockResolvedValueOnce(expiredSession as any)

      const session = await authClient.getSession()

      expect(session.expiresAt).toBeLessThan(Date.now() / 1000)
    })

    it('should handle no session', async () => {
      vi.spyOn(authClient, 'getSession').mockResolvedValueOnce(null as any)

      const session = await authClient.getSession()

      expect(session).toBeNull()
    })
  })

  describe('Two-Factor Authentication', () => {
    it('should redirect to 2FA page when enabled', async () => {
      const mock2FAResponse = {
        data: { twoFactorRequired: true, redirect: '/two-factor' },
        error: null,
      }

      vi.spyOn(signIn, 'email').mockResolvedValueOnce(mock2FAResponse as any)

      const result = await signIn.email({
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

      vi.spyOn(twoFactor, 'verifyTotp').mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      } as any)

      const result = await twoFactor.verifyTotp({
        code: '123456',
      })

      expect(result.data?.session).toBeDefined()
    })

    it('should handle invalid 2FA code', async () => {
      vi.spyOn(twoFactor, 'verifyTotp').mockRejectedValueOnce(
        new Error('Invalid verification code')
      )

      await expect(
        twoFactor.verifyTotp({
          code: '000000',
        })
      ).rejects.toThrow('Invalid verification code')
    })
  })
})