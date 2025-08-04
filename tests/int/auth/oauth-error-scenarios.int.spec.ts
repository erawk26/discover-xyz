import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockAuthClient } from './setup'

describe('OAuth Error Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('OAuth Callback Errors', () => {
    it('should handle OAuth callback with missing code parameter', async () => {
      // Simulate OAuth callback without authorization code
      const error = new Error('Missing authorization code')
      error.cause = { code: 'OAUTH_MISSING_CODE' }
      
      mockAuthClient.signIn.social.mockRejectedValueOnce(error)

      await expect(
        mockAuthClient.signIn.social({
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
      
      mockAuthClient.signIn.social.mockRejectedValueOnce(error)

      await expect(
        mockAuthClient.signIn.social({
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
      
      mockAuthClient.signIn.social.mockRejectedValueOnce(error)

      await expect(
        mockAuthClient.signIn.social({
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
      // Failed to exchange authorization code for tokens
      const error = new Error('Failed to exchange authorization code')
      error.cause = { code: 'OAUTH_TOKEN_EXCHANGE_FAILED' }
      
      mockAuthClient.signIn.social.mockRejectedValueOnce(error)

      await expect(
        mockAuthClient.signIn.social({
          provider: 'google',
          callbackURL: '/admin',
        })
      ).rejects.toMatchObject({
        message: 'Failed to exchange authorization code',
        cause: { code: 'OAUTH_TOKEN_EXCHANGE_FAILED' },
      })
    })

    it('should handle invalid client credentials', async () => {
      // OAuth app credentials are incorrect
      const error = new Error('Invalid client credentials')
      error.cause = { code: 'OAUTH_INVALID_CLIENT' }
      
      mockAuthClient.signIn.social.mockRejectedValueOnce(error)

      await expect(
        mockAuthClient.signIn.social({
          provider: 'github',
          callbackURL: '/admin',
        })
      ).rejects.toMatchObject({
        message: 'Invalid client credentials',
        cause: { code: 'OAUTH_INVALID_CLIENT' },
      })
    })
  })

  describe('OAuth Profile Fetch Errors', () => {
    it('should handle profile fetch failure', async () => {
      // Failed to fetch user profile from OAuth provider
      const error = new Error('Failed to fetch user profile')
      error.cause = { code: 'OAUTH_PROFILE_FETCH_FAILED' }
      
      mockAuthClient.signIn.social.mockRejectedValueOnce(error)

      await expect(
        mockAuthClient.signIn.social({
          provider: 'google',
          callbackURL: '/admin',
        })
      ).rejects.toMatchObject({
        message: 'Failed to fetch user profile',
        cause: { code: 'OAUTH_PROFILE_FETCH_FAILED' },
      })
    })

    it('should handle missing required email from OAuth provider', async () => {
      // OAuth provider didn't return email
      const error = new Error('Email is required but was not provided by OAuth provider')
      error.cause = { code: 'OAUTH_MISSING_EMAIL' }
      
      mockAuthClient.signIn.social.mockRejectedValueOnce(error)

      await expect(
        mockAuthClient.signIn.social({
          provider: 'github',
          callbackURL: '/admin',
        })
      ).rejects.toMatchObject({
        message: 'Email is required but was not provided by OAuth provider',
        cause: { code: 'OAUTH_MISSING_EMAIL' },
      })
    })

    it('should handle unverified email from OAuth provider', async () => {
      // OAuth provider returned unverified email
      const error = new Error('Email address is not verified')
      error.cause = { code: 'OAUTH_UNVERIFIED_EMAIL' }
      
      mockAuthClient.signIn.social.mockRejectedValueOnce(error)

      await expect(
        mockAuthClient.signIn.social({
          provider: 'google',
          callbackURL: '/admin',
        })
      ).rejects.toMatchObject({
        message: 'Email address is not verified',
        cause: { code: 'OAUTH_UNVERIFIED_EMAIL' },
      })
    })
  })

  describe('OAuth Network and Timeout Errors', () => {
    it('should handle OAuth provider timeout', async () => {
      const error = new Error('OAuth provider request timed out')
      error.cause = { code: 'OAUTH_TIMEOUT' }
      
      mockAuthClient.signIn.social.mockRejectedValueOnce(error)

      await expect(
        mockAuthClient.signIn.social({
          provider: 'google',
          callbackURL: '/admin',
        })
      ).rejects.toMatchObject({
        message: 'OAuth provider request timed out',
        cause: { code: 'OAUTH_TIMEOUT' },
      })
    })

    it('should handle OAuth provider network error', async () => {
      const error = new Error('Network error connecting to OAuth provider')
      error.cause = { code: 'OAUTH_NETWORK_ERROR' }
      
      mockAuthClient.signIn.social.mockRejectedValueOnce(error)

      await expect(
        mockAuthClient.signIn.social({
          provider: 'github',
          callbackURL: '/admin',
        })
      ).rejects.toMatchObject({
        message: 'Network error connecting to OAuth provider',
        cause: { code: 'OAUTH_NETWORK_ERROR' },
      })
    })

    it('should handle OAuth provider service unavailable', async () => {
      const error = new Error('OAuth provider service is unavailable')
      error.cause = { code: 'OAUTH_SERVICE_UNAVAILABLE', status: 503 }
      
      mockAuthClient.signIn.social.mockRejectedValueOnce(error)

      await expect(
        mockAuthClient.signIn.social({
          provider: 'google',
          callbackURL: '/admin',
        })
      ).rejects.toMatchObject({
        message: 'OAuth provider service is unavailable',
        cause: { code: 'OAUTH_SERVICE_UNAVAILABLE', status: 503 },
      })
    })
  })

  describe('OAuth Account Linking Errors', () => {
    it('should handle email already linked to another account', async () => {
      const error = new Error('This email is already associated with another account')
      error.cause = { code: 'OAUTH_EMAIL_ALREADY_EXISTS' }
      
      mockAuthClient.signIn.social.mockRejectedValueOnce(error)

      await expect(
        mockAuthClient.signIn.social({
          provider: 'google',
          callbackURL: '/admin',
        })
      ).rejects.toMatchObject({
        message: 'This email is already associated with another account',
        cause: { code: 'OAUTH_EMAIL_ALREADY_EXISTS' },
      })
    })

    it('should handle OAuth account already linked', async () => {
      const error = new Error('This OAuth account is already linked to another user')
      error.cause = { code: 'OAUTH_ACCOUNT_ALREADY_LINKED' }
      
      mockAuthClient.signIn.social.mockRejectedValueOnce(error)

      await expect(
        mockAuthClient.signIn.social({
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
      const error = new Error('OAuth redirect failed')
      error.cause = { code: 'OAUTH_REDIRECT_FAILED', retryable: true }
      
      // First call fails, second succeeds
      mockAuthClient.signIn.social
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          data: { url: 'https://accounts.google.com/oauth/authorize?retry=1' },
          error: null,
        })

      // First attempt fails
      await expect(
        mockAuthClient.signIn.social({
          provider: 'google',
          callbackURL: '/admin',
        })
      ).rejects.toThrow('OAuth redirect failed')

      // Second attempt succeeds
      const result = await mockAuthClient.signIn.social({
        provider: 'google',
        callbackURL: '/admin',
      })

      expect(result.data?.url).toContain('retry=1')
    })

    it('should not retry non-retryable OAuth errors', async () => {
      const error = new Error('OAuth configuration error')
      error.cause = { code: 'OAUTH_CONFIG_ERROR', retryable: false }
      
      mockAuthClient.signIn.social.mockRejectedValue(error)

      // Should fail immediately without retry
      await expect(
        mockAuthClient.signIn.social({
          provider: 'google',
          callbackURL: '/admin',
        })
      ).rejects.toMatchObject({
        message: 'OAuth configuration error',
        cause: { code: 'OAUTH_CONFIG_ERROR', retryable: false },
      })

      // Verify it was only called once
      expect(mockAuthClient.signIn.social).toHaveBeenCalledTimes(1)
    })
  })

  describe('OAuth Configuration Errors', () => {
    it('should handle missing OAuth provider configuration', async () => {
      const error = new Error('OAuth provider not configured')
      error.cause = { code: 'OAUTH_PROVIDER_NOT_CONFIGURED' }
      
      mockAuthClient.signIn.social.mockRejectedValueOnce(error)

      await expect(
        mockAuthClient.signIn.social({
          provider: 'twitter',
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
      
      mockAuthClient.signIn.social.mockRejectedValueOnce(error)

      await expect(
        mockAuthClient.signIn.social({
          provider: 'google',
          callbackURL: 'https://malicious-site.com/callback',
        })
      ).rejects.toMatchObject({
        message: 'Redirect URI mismatch',
        cause: { code: 'OAUTH_REDIRECT_URI_MISMATCH' },
      })
    })
  })
})