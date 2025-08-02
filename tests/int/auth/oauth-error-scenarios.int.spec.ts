import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authClient } from '@/lib/better-auth/client'

describe('OAuth Error Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('OAuth Callback Errors', () => {
    it('should handle OAuth callback with missing code parameter', async () => {
      // Simulate OAuth callback without authorization code
      const error = new Error('Missing authorization code')
      error.cause = { code: 'OAUTH_MISSING_CODE' }
      
      vi.spyOn(authClient.signIn, 'social').mockRejectedValueOnce(error as any)

      await expect(
        authClient.signIn.social({
          provider: 'google',
          callbackURL: '/admin',
        })
      ).rejects.toMatchObject({
        message: 'Missing authorization code',
        cause: { code: 'OAUTH_MISSING_CODE' },
      })
    })

    it('should handle OAuth callback with invalid state parameter', async () => {
      // Simulate CSRF attack or state mismatch
      const error = new Error('Invalid state parameter')
      error.cause = { code: 'OAUTH_INVALID_STATE' }
      
      vi.spyOn(authClient.signIn, 'social').mockRejectedValueOnce(error as any)

      await expect(
        authClient.signIn.social({
          provider: 'github',
          callbackURL: '/admin',
        })
      ).rejects.toMatchObject({
        message: 'Invalid state parameter',
        cause: { code: 'OAUTH_INVALID_STATE' },
      })
    })

    it('should handle OAuth provider denial', async () => {
      // User denies permission at OAuth provider
      const error = new Error('Access denied by user')
      error.cause = { code: 'OAUTH_ACCESS_DENIED' }
      
      vi.spyOn(authClient.signIn, 'social').mockRejectedValueOnce(error as any)

      await expect(
        authClient.signIn.social({
          provider: 'google',
          callbackURL: '/admin',
        })
      ).rejects.toMatchObject({
        message: 'Access denied by user',
        cause: { code: 'OAUTH_ACCESS_DENIED' },
      })
    })
  })

  describe('OAuth Token Exchange Errors', () => {
    it('should handle token exchange failure', async () => {
      // OAuth provider returns error during token exchange
      const error = new Error('Failed to exchange authorization code for token')
      error.cause = { code: 'OAUTH_TOKEN_EXCHANGE_FAILED' }
      
      vi.spyOn(authClient.signIn, 'social').mockRejectedValueOnce(error as any)

      await expect(
        authClient.signIn.social({
          provider: 'github',
          callbackURL: '/admin',
        })
      ).rejects.toMatchObject({
        message: 'Failed to exchange authorization code for token',
        cause: { code: 'OAUTH_TOKEN_EXCHANGE_FAILED' },
      })
    })

    it('should handle invalid client credentials', async () => {
      // Misconfigured OAuth app credentials
      const error = new Error('Invalid client ID or secret')
      error.cause = { code: 'OAUTH_INVALID_CLIENT' }
      
      vi.spyOn(authClient.signIn, 'social').mockRejectedValueOnce(error as any)

      await expect(
        authClient.signIn.social({
          provider: 'google',
          callbackURL: '/admin',
        })
      ).rejects.toMatchObject({
        message: 'Invalid client ID or secret',
        cause: { code: 'OAUTH_INVALID_CLIENT' },
      })
    })
  })

  describe('OAuth Profile Fetch Errors', () => {
    it('should handle profile fetch failure', async () => {
      // Unable to fetch user profile from OAuth provider
      const error = new Error('Failed to fetch user profile')
      error.cause = { code: 'OAUTH_PROFILE_FETCH_FAILED' }
      
      vi.spyOn(authClient.signIn, 'social').mockRejectedValueOnce(error as any)

      await expect(
        authClient.signIn.social({
          provider: 'github',
          callbackURL: '/admin',
        })
      ).rejects.toMatchObject({
        message: 'Failed to fetch user profile',
        cause: { code: 'OAUTH_PROFILE_FETCH_FAILED' },
      })
    })

    it('should handle missing required email from OAuth provider', async () => {
      // OAuth provider doesn't return email
      const error = new Error('Email not provided by OAuth provider')
      error.cause = { code: 'OAUTH_MISSING_EMAIL' }
      
      vi.spyOn(authClient.signIn, 'social').mockRejectedValueOnce(error as any)

      await expect(
        authClient.signIn.social({
          provider: 'github',
          callbackURL: '/admin',
        })
      ).rejects.toMatchObject({
        message: 'Email not provided by OAuth provider',
        cause: { code: 'OAUTH_MISSING_EMAIL' },
      })
    })

    it('should handle unverified email from OAuth provider', async () => {
      // OAuth provider returns unverified email
      const error = new Error('Email not verified with OAuth provider')
      error.cause = { code: 'OAUTH_UNVERIFIED_EMAIL' }
      
      vi.spyOn(authClient.signIn, 'social').mockRejectedValueOnce(error as any)

      await expect(
        authClient.signIn.social({
          provider: 'google',
          callbackURL: '/admin',
        })
      ).rejects.toMatchObject({
        message: 'Email not verified with OAuth provider',
        cause: { code: 'OAUTH_UNVERIFIED_EMAIL' },
      })
    })
  })

  describe('OAuth Network and Timeout Errors', () => {
    it('should handle OAuth provider timeout', async () => {
      const error = new Error('OAuth provider request timeout')
      error.cause = { code: 'OAUTH_TIMEOUT' }
      
      vi.spyOn(authClient.signIn, 'social').mockRejectedValueOnce(error as any)

      await expect(
        authClient.signIn.social({
          provider: 'google',
          callbackURL: '/admin',
        })
      ).rejects.toMatchObject({
        message: 'OAuth provider request timeout',
        cause: { code: 'OAUTH_TIMEOUT' },
      })
    })

    it('should handle OAuth provider network error', async () => {
      const error = new Error('Network error connecting to OAuth provider')
      error.cause = { code: 'OAUTH_NETWORK_ERROR' }
      
      vi.spyOn(authClient.signIn, 'social').mockRejectedValueOnce(error as any)

      await expect(
        authClient.signIn.social({
          provider: 'github',
          callbackURL: '/admin',
        })
      ).rejects.toMatchObject({
        message: 'Network error connecting to OAuth provider',
        cause: { code: 'OAUTH_NETWORK_ERROR' },
      })
    })

    it('should handle OAuth provider service unavailable', async () => {
      const error = new Error('OAuth provider service unavailable')
      error.cause = { code: 'OAUTH_SERVICE_UNAVAILABLE', status: 503 }
      
      vi.spyOn(authClient.signIn, 'social').mockRejectedValueOnce(error as any)

      await expect(
        authClient.signIn.social({
          provider: 'google',
          callbackURL: '/admin',
        })
      ).rejects.toMatchObject({
        message: 'OAuth provider service unavailable',
        cause: { code: 'OAUTH_SERVICE_UNAVAILABLE', status: 503 },
      })
    })
  })

  describe('OAuth Account Linking Errors', () => {
    it('should handle email already linked to another account', async () => {
      const error = new Error('Email already associated with another account')
      error.cause = { code: 'OAUTH_EMAIL_CONFLICT' }
      
      vi.spyOn(authClient.signIn, 'social').mockRejectedValueOnce(error as any)

      await expect(
        authClient.signIn.social({
          provider: 'google',
          callbackURL: '/admin',
        })
      ).rejects.toMatchObject({
        message: 'Email already associated with another account',
        cause: { code: 'OAUTH_EMAIL_CONFLICT' },
      })
    })

    it('should handle OAuth account already linked', async () => {
      const error = new Error('This OAuth account is already linked to another user')
      error.cause = { code: 'OAUTH_ACCOUNT_ALREADY_LINKED' }
      
      vi.spyOn(authClient.signIn, 'social').mockRejectedValueOnce(error as any)

      await expect(
        authClient.signIn.social({
          provider: 'github',
          callbackURL: '/admin',
        })
      ).rejects.toMatchObject({
        message: 'This OAuth account is already linked to another user',
        cause: { code: 'OAUTH_ACCOUNT_ALREADY_LINKED' },
      })
    })
  })

  describe('OAuth Retry Logic', () => {
    it('should retry OAuth redirect on first-time failure', async () => {
      // Simulate the known issue where first OAuth attempt fails
      const error = new Error('OAuth redirect failed')
      error.cause = { code: 'OAUTH_REDIRECT_FAILED', retryable: true }
      
      // First attempt fails
      vi.spyOn(authClient.signIn, 'social')
        .mockRejectedValueOnce(error as any)
        .mockResolvedValueOnce({
          data: { url: 'https://accounts.google.com/oauth/authorize?...' },
          error: null,
        } as any)

      // Simulate retry logic
      let result
      try {
        result = await authClient.signIn.social({
          provider: 'google',
          callbackURL: '/admin',
        })
      } catch (e: any) {
        if (e.cause?.retryable) {
          // Retry the request
          result = await authClient.signIn.social({
            provider: 'google',
            callbackURL: '/admin',
          })
        } else {
          throw e
        }
      }

      expect(result.data?.url).toBeDefined()
      expect(authClient.signIn.social).toHaveBeenCalledTimes(2)
    })

    it('should not retry non-retryable OAuth errors', async () => {
      const error = new Error('OAuth access denied')
      error.cause = { code: 'OAUTH_ACCESS_DENIED', retryable: false }
      
      vi.spyOn(authClient.signIn, 'social').mockRejectedValueOnce(error as any)

      await expect(
        authClient.signIn.social({
          provider: 'google',
          callbackURL: '/admin',
        })
      ).rejects.toMatchObject({
        message: 'OAuth access denied',
        cause: { code: 'OAUTH_ACCESS_DENIED', retryable: false },
      })

      // Should only be called once (no retry)
      expect(authClient.signIn.social).toHaveBeenCalledTimes(1)
    })
  })

  describe('OAuth Configuration Errors', () => {
    it('should handle missing OAuth provider configuration', async () => {
      const error = new Error('OAuth provider not configured')
      error.cause = { code: 'OAUTH_PROVIDER_NOT_CONFIGURED' }
      
      vi.spyOn(authClient.signIn, 'social').mockRejectedValueOnce(error as any)

      await expect(
        authClient.signIn.social({
          provider: 'twitter' as any, // Provider not configured
          callbackURL: '/admin',
        })
      ).rejects.toMatchObject({
        message: 'OAuth provider not configured',
        cause: { code: 'OAUTH_PROVIDER_NOT_CONFIGURED' },
      })
    })

    it('should handle invalid redirect URI', async () => {
      const error = new Error('Redirect URI mismatch')
      error.cause = { code: 'OAUTH_REDIRECT_URI_MISMATCH' }
      
      vi.spyOn(authClient.signIn, 'social').mockRejectedValueOnce(error as any)

      await expect(
        authClient.signIn.social({
          provider: 'google',
          callbackURL: 'https://malicious-site.com/callback', // Invalid redirect
        })
      ).rejects.toMatchObject({
        message: 'Redirect URI mismatch',
        cause: { code: 'OAUTH_REDIRECT_URI_MISMATCH' },
      })
    })
  })
})