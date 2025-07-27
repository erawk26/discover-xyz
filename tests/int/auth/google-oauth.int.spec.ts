import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { User as PayloadUser } from '@/payload-types'

// Mock Next.js request/response
const mockRequest = {
  headers: new Headers(),
  cookies: {
    get: vi.fn(),
    set: vi.fn(),
  },
  nextUrl: {
    searchParams: new URLSearchParams(),
  },
} as any

const mockResponse = {
  cookies: {
    set: vi.fn(),
  },
  redirect: vi.fn(),
} as any

describe('Google OAuth Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.BETTER_AUTH_URL = 'http://localhost:3000'
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id'
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret'
  })

  describe('OAuth Configuration', () => {
    it('should have Google provider configured', async () => {
      const { getOAuthProviders } = await import('@/lib/auth/oauth-providers')
      
      const providers = getOAuthProviders()
      const googleProvider = providers.find(p => p.id === 'google')
      
      expect(googleProvider).toBeDefined()
      expect(googleProvider?.id).toBe('google')
      expect(googleProvider?.name).toBe('Google')
    })

    it('should validate Google OAuth environment variables', async () => {
      const { validateOAuthConfig } = await import('@/lib/auth/oauth-providers')
      
      const config = validateOAuthConfig('google')
      
      expect(config.isValid).toBe(true)
      expect(config.clientId).toBe('test-google-client-id')
      expect(config.clientSecret).toBe('test-google-client-secret')
    })

    it('should handle missing environment variables', async () => {
      delete process.env.GOOGLE_CLIENT_ID
      
      const { validateOAuthConfig } = await import('@/lib/auth/oauth-providers')
      
      const config = validateOAuthConfig('google')
      
      expect(config.isValid).toBe(false)
      expect(config.error).toContain('Missing Google OAuth')
    })
  })

  describe('OAuth Flow', () => {
    it('should initiate Google OAuth flow', async () => {
      const { initiateOAuthFlow } = await import('@/lib/auth/oauth-providers')
      
      const result = await initiateOAuthFlow('google', {
        redirectTo: '/dashboard',
        request: mockRequest,
      })
      
      expect(result.url).toContain('accounts.google.com/o/oauth2/v2/auth')
      expect(result.url).toContain('client_id=test-google-client-id')
      expect(result.url).toContain('scope=email+profile')
      expect(result.state).toBeDefined()
    })

    it('should handle OAuth callback with valid code', async () => {
      const { handleOAuthCallback } = await import('@/lib/auth/oauth-providers')
      
      // For now, test with mock implementation in oauth-providers.ts

      const result = await handleOAuthCallback('google', {
        code: 'mock-auth-code',
        state: 'mock-state',
        request: mockRequest,
      })

      expect(result.success).toBe(true)
      expect(result.user).toMatchObject({
        email: 'user@gmail.com',
        name: 'Test User',
        provider: 'google',
        providerId: 'google-123',
      })
    })

    it('should handle OAuth callback errors', async () => {
      const { handleOAuthCallback } = await import('@/lib/auth/oauth-providers')
      
      const result = await handleOAuthCallback('google', {
        error: 'access_denied',
        error_description: 'User denied access',
        request: mockRequest,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('access_denied')
    })
  })

  describe('User Creation from OAuth', () => {
    it('should create new user from Google OAuth data', async () => {
      const { createUserFromOAuth } = await import('@/lib/auth/oauth-providers')
      
      const oauthData = {
        provider: 'google',
        providerId: 'google-123',
        email: 'newuser@gmail.com',
        name: 'New Google User',
        emailVerified: true,
        image: 'https://example.com/photo.jpg',
      }

      const result = await createUserFromOAuth(oauthData)

      expect(result.user).toBeDefined()
      expect(result.user.email).toBe(oauthData.email)
      expect(result.user.name).toBe(oauthData.name)
      expect(result.user.emailVerified).toBe(true)
      expect(result.isNewUser).toBe(true)
    })

    it('should link OAuth account to existing user with same email', async () => {
      const { createUserFromOAuth } = await import('@/lib/auth/oauth-providers')
      
      // Mock existing user
      const existingUser = {
        id: 'existing-user-id',
        email: 'existing@gmail.com',
        name: 'Existing User',
      }

      const oauthData = {
        provider: 'google',
        providerId: 'google-456',
        email: existingUser.email, // Same email
        name: 'Google Name',
        emailVerified: true,
      }

      // For now, test with mock implementation in oauth-providers.ts

      const result = await createUserFromOAuth(oauthData)

      expect(result.user.id).toBe(existingUser.id)
      expect(result.isNewUser).toBe(false)
      expect(result.linkedAccount).toBe(true)
    })
  })

  describe('Role Assignment', () => {
    it('should assign default role to new OAuth users', async () => {
      const { createUserFromOAuth } = await import('@/lib/auth/oauth-providers')
      
      const oauthData = {
        provider: 'google',
        providerId: 'google-789',
        email: 'newuser@gmail.com',
        name: 'New User',
      }

      const result = await createUserFromOAuth(oauthData)

      expect(result.user.role).toBe('authenticated')
    })

    it('should preserve existing role when linking OAuth account', async () => {
      const { createUserFromOAuth } = await import('@/lib/auth/oauth-providers')
      
      // Mock existing admin user
      const existingAdmin = {
        id: 'admin-id',
        email: 'admin@gmail.com',
        name: 'Admin User',
        role: 'admin',
      }

      const oauthData = {
        provider: 'google',
        providerId: 'google-admin',
        email: existingAdmin.email,
        name: 'Google Admin',
      }

      // For now, test with mock implementation in oauth-providers.ts

      const result = await createUserFromOAuth(oauthData)

      expect(result.user.role).toBe('admin') // Role preserved
    })
  })

  describe('Session Creation', () => {
    it('should create session after successful OAuth login', async () => {
      const { handleOAuthLogin } = await import('@/lib/auth/oauth-providers')
      
      const user = {
        id: 'user-123',
        email: 'user@gmail.com',
        name: 'OAuth User',
      }

      const result = await handleOAuthLogin(user, {
        request: mockRequest,
        response: mockResponse,
      })

      expect(result.session).toBeDefined()
      expect(result.session.userId).toBe(user.id)
    })
  })
})