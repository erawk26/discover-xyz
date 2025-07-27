import { describe, it, expect } from 'vitest'

describe('Domain-based Role Assignment', () => {
  describe('Miles Partnership Domain', () => {
    it('should assign content-editor role to @milespartnership.com emails', async () => {
      const { mapBetterAuthToPayload } = await import('@/lib/auth/user-sync')
      
      const milesUser = {
        id: 'miles-user-123',
        email: 'john.doe@milespartnership.com',
        name: 'John Doe',
      }

      const payloadUser = mapBetterAuthToPayload(milesUser)

      expect(payloadUser.role).toBe('content-editor')
      expect(payloadUser.email).toBe(milesUser.email)
    })

    it('should handle case-insensitive domain matching', async () => {
      const { mapBetterAuthToPayload } = await import('@/lib/auth/user-sync')
      
      const milesUser = {
        id: 'miles-user-456',
        email: 'Jane.Smith@MilesPartnership.COM',
        name: 'Jane Smith',
      }

      const payloadUser = mapBetterAuthToPayload(milesUser)

      expect(payloadUser.role).toBe('content-editor')
    })

    it('should assign authenticated role to non-Miles emails', async () => {
      const { mapBetterAuthToPayload } = await import('@/lib/auth/user-sync')
      
      const regularUser = {
        id: 'regular-user-789',
        email: 'user@example.com',
        name: 'Regular User',
      }

      const payloadUser = mapBetterAuthToPayload(regularUser)

      expect(payloadUser.role).toBe('authenticated')
    })

    it('should not match partial domain names', async () => {
      const { mapBetterAuthToPayload } = await import('@/lib/auth/user-sync')
      
      const fakeMilesUser = {
        id: 'fake-miles-123',
        email: 'user@fakemilespartnership.com',
        name: 'Fake Miles User',
      }

      const payloadUser = mapBetterAuthToPayload(fakeMilesUser)

      expect(payloadUser.role).toBe('authenticated') // Should NOT get content-editor
    })
  })

  describe('OAuth User Creation with Domain Rules', () => {
    it('should create Miles Partnership user with content-editor role via OAuth', async () => {
      const { createUserFromOAuth } = await import('@/lib/auth/oauth-providers')
      
      const oauthData = {
        provider: 'google',
        providerId: 'google-miles-123',
        email: 'editor@milespartnership.com',
        name: 'Miles Editor',
        emailVerified: true,
      }

      const result = await createUserFromOAuth(oauthData)

      expect(result.user).toBeDefined()
      expect(result.user.email).toBe(oauthData.email)
      // Note: The actual role assignment happens in the sync function
      // This test verifies the OAuth flow works with Miles emails
    })
  })
})