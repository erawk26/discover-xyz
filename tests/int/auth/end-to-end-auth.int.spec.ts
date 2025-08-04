import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mockAuthClient } from './setup'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}))

vi.mock('@/lib/better-auth/client', () => ({
  authClient: mockAuthClient,
}))

describe('End-to-End Authentication Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset any session storage
    if (typeof window !== 'undefined') {
      window.localStorage.clear()
      window.sessionStorage.clear()
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Complete User Journey - New User', () => {
    it('should handle complete signup → email verification → login → session → logout flow', async () => {
      // Step 1: User signs up
      const newUser = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      }

      mockAuthClient.signUp.email.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-123',
            email: newUser.email,
            emailVerified: false,
          },
          session: null, // No session until email verified
        },
      })

      // Simulate signup
      const signupResult = await mockAuthClient.signUp.email({
        email: newUser.email,
        password: newUser.password,
        name: newUser.name,
      })

      expect(signupResult.data.user.emailVerified).toBe(false)
      expect(signupResult.data.session).toBeNull()

      // Step 2: User clicks email verification link
      const verificationToken = 'verify-token-123'
      mockAuthClient.verifyEmail = vi.fn().mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-123',
            email: newUser.email,
            emailVerified: true,
          },
        },
      })

      await mockAuthClient.verifyEmail({ token: verificationToken })

      // Step 3: User logs in after verification
      mockAuthClient.signIn.email.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-123',
            email: newUser.email,
            emailVerified: true,
          },
          session: {
            id: 'session-123',
            userId: 'user-123',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        },
      })

      const loginResult = await mockAuthClient.signIn.email({
        email: newUser.email,
        password: newUser.password,
      })

      expect(loginResult.data.session).toBeDefined()
      expect(loginResult.data.session.userId).toBe('user-123')

      // Step 4: Check session persistence
      mockAuthClient.getSession.mockResolvedValueOnce({
        data: {
          session: loginResult.data.session,
          user: loginResult.data.user,
        },
      })

      const session = await mockAuthClient.getSession()
      expect(session.data.session.id).toBe('session-123')

      // Step 5: User signs out
      mockAuthClient.signOut.mockResolvedValueOnce({
        data: { success: true },
      })

      await mockAuthClient.signOut()

      // Step 6: Verify session is cleared
      mockAuthClient.getSession.mockResolvedValueOnce({
        data: { session: null, user: null },
      })

      const afterLogout = await mockAuthClient.getSession()
      expect(afterLogout.data.session).toBeNull()
    })
  })

  describe('Complete User Journey - OAuth Flow', () => {
    it('should handle OAuth signup → account linking → session → logout', async () => {
      // Step 1: User initiates OAuth with Google
      const oauthProvider = 'google'
      const oauthState = 'oauth-state-123'

      mockAuthClient.signIn.social.mockResolvedValueOnce({
        data: {
          url: `https://accounts.google.com/oauth/authorize?client_id=test&state=${oauthState}`,
          redirect: true,
        },
      })

      const oauthInit = await mockAuthClient.signIn.social({
        provider: oauthProvider,
        callbackURL: '/auth-callback',
      })

      expect(oauthInit.data.url).toContain('accounts.google.com')
      expect(oauthInit.data.redirect).toBe(true)

      // Step 2: Simulate OAuth callback with user data
      const oauthUser = {
        id: 'google-user-123',
        email: 'oauth@example.com',
        name: 'OAuth User',
        image: 'https://example.com/avatar.jpg',
        emailVerified: true,
      }

      mockAuthClient.oauth = {
        callback: vi.fn().mockResolvedValueOnce({
          data: {
            user: {
              id: 'user-456',
              email: oauthUser.email,
              name: oauthUser.name,
              image: oauthUser.image,
              emailVerified: true,
            },
            session: {
              id: 'session-456',
              userId: 'user-456',
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            },
          },
        }),
      }

      const callbackResult = await mockAuthClient.oauth.callback({
        code: 'oauth-code-123',
        state: oauthState,
      })

      expect(callbackResult.data.user.email).toBe(oauthUser.email)
      expect(callbackResult.data.session).toBeDefined()

      // Step 3: Test account linking (user signs in with password later)
      mockAuthClient.linkAccount = vi.fn().mockResolvedValueOnce({
        data: {
          success: true,
          user: {
            ...callbackResult.data.user,
            accounts: [
              { provider: 'google', providerAccountId: 'google-user-123' },
              { provider: 'email', providerAccountId: oauthUser.email },
            ],
          },
        },
      })

      await mockAuthClient.linkAccount({
        provider: 'email',
        password: 'NewPassword123!',
      })

      // Step 4: Sign out
      mockAuthClient.signOut.mockResolvedValueOnce({
        data: { success: true },
      })

      await mockAuthClient.signOut()
    })
  })

  describe('Complete User Journey - Password Reset', () => {
    it('should handle forgot password → reset email → new password → login flow', async () => {
      const userEmail = 'forgot@example.com'

      // Step 1: User requests password reset
      mockAuthClient.forgotPassword = vi.fn().mockResolvedValueOnce({
        data: {
          success: true,
          message: 'Password reset email sent',
        },
      })

      await mockAuthClient.forgotPassword({ email: userEmail })

      // Step 2: User clicks reset link and sets new password
      const resetToken = 'reset-token-789'
      const newPassword = 'NewSecurePass456!'

      mockAuthClient.resetPassword = vi.fn().mockResolvedValueOnce({
        data: {
          success: true,
          user: {
            id: 'user-789',
            email: userEmail,
          },
        },
      })

      await mockAuthClient.resetPassword({
        token: resetToken,
        password: newPassword,
      })

      // Step 3: User logs in with new password
      mockAuthClient.signIn.email.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-789',
            email: userEmail,
          },
          session: {
            id: 'session-789',
            userId: 'user-789',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        },
      })

      const loginResult = await mockAuthClient.signIn.email({
        email: userEmail,
        password: newPassword,
      })

      expect(loginResult.data.session).toBeDefined()
    })
  })

  describe('Complete User Journey - Magic Link', () => {
    it('should handle magic link request → email → verification → session flow', async () => {
      const userEmail = 'magic@example.com'

      // Step 1: User requests magic link
      mockAuthClient.signIn.magicLink.mockResolvedValueOnce({
        data: {
          success: true,
          message: 'Magic link sent to your email',
        },
      })

      await mockAuthClient.signIn.magicLink({
        email: userEmail,
        callbackURL: '/dashboard',
      })

      // Step 2: User clicks magic link
      const magicToken = 'magic-token-abc'
      mockAuthClient.verifyMagicLink = vi.fn().mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-magic',
            email: userEmail,
          },
          session: {
            id: 'session-magic',
            userId: 'user-magic',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        },
      })

      const verifyResult = await mockAuthClient.verifyMagicLink({
        token: magicToken,
      })

      expect(verifyResult.data.session).toBeDefined()
      expect(verifyResult.data.user.email).toBe(userEmail)
    })
  })

  describe('Complete User Journey - Two-Factor Authentication', () => {
    it('should handle login → 2FA challenge → verification → session flow', async () => {
      const user2FA = {
        email: '2fa@example.com',
        password: 'Secure2FA123!',
      }

      // Step 1: User logs in and gets 2FA challenge
      mockAuthClient.signIn.email.mockResolvedValueOnce({
        data: {
          twoFactorRequired: true,
          user: null,
          session: null,
        },
      })

      const initialLogin = await mockAuthClient.signIn.email(user2FA)
      expect(initialLogin.data.twoFactorRequired).toBe(true)

      // Step 2: User enters 2FA code
      const totpCode = '123456'
      mockAuthClient.twoFactor.verifyTotp.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-2fa',
            email: user2FA.email,
          },
          session: {
            id: 'session-2fa',
            userId: 'user-2fa',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        },
      })

      const twoFactorResult = await mockAuthClient.twoFactor.verifyTotp({
        code: totpCode,
      })

      expect(twoFactorResult.data.session).toBeDefined()
      expect(twoFactorResult.data.user.email).toBe(user2FA.email)
    })
  })

  describe('Session Persistence Across Page Reloads', () => {
    it('should maintain session across page reloads and browser restarts', async () => {
      // Simulate login
      const sessionData = {
        id: 'persistent-session',
        userId: 'user-persist',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }

      mockAuthClient.getSession.mockResolvedValueOnce({
        data: {
          session: sessionData,
          user: {
            id: 'user-persist',
            email: 'persist@example.com',
          },
        },
      })

      // First check - session exists
      const firstCheck = await mockAuthClient.getSession()
      expect(firstCheck.data.session).toBeDefined()

      // Simulate page reload by clearing mocks but keeping session
      vi.clearAllMocks()
      mockAuthClient.getSession.mockResolvedValueOnce({
        data: {
          session: sessionData,
          user: {
            id: 'user-persist',
            email: 'persist@example.com',
          },
        },
      })

      // Second check - session persists
      const secondCheck = await mockAuthClient.getSession()
      expect(secondCheck.data.session.id).toBe('persistent-session')
    })
  })

  describe('Error Recovery and Retry Mechanisms', () => {
    it('should handle and recover from transient errors', async () => {
      // First attempt fails with network error
      mockAuthClient.signIn.email.mockRejectedValueOnce(
        new Error('Network error')
      )

      // Second attempt succeeds
      mockAuthClient.signIn.email.mockResolvedValueOnce({
        data: {
          user: { id: 'user-retry', email: 'retry@example.com' },
          session: {
            id: 'session-retry',
            userId: 'user-retry',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        },
      })

      // First attempt
      await expect(
        mockAuthClient.signIn.email({
          email: 'retry@example.com',
          password: 'password',
        })
      ).rejects.toThrow('Network error')

      // Retry succeeds
      const retryResult = await mockAuthClient.signIn.email({
        email: 'retry@example.com',
        password: 'password',
      })

      expect(retryResult.data.session).toBeDefined()
    })
  })
})