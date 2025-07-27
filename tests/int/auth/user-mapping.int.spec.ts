import { describe, it, expect } from 'vitest'
import type { User as PayloadUser } from '@/payload-types'

describe('User Model Mapping', () => {
  describe('Better Auth to Payload Mapping', () => {
    it('should map Better Auth user to Payload user format', async () => {
      const { mapBetterAuthToPayload } = await import('@/lib/auth/user-sync')
      
      const betterAuthUser = {
        id: 'ba-user-123',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
        image: 'https://example.com/avatar.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const payloadUser = mapBetterAuthToPayload(betterAuthUser)

      expect(payloadUser.email).toBe(betterAuthUser.email)
      expect(payloadUser.name).toBe(betterAuthUser.name)
      expect(payloadUser.betterAuthId).toBe(betterAuthUser.id)
      expect(payloadUser.role).toBe('authenticated')
    })

    it('should handle missing optional fields', async () => {
      const { mapBetterAuthToPayload } = await import('@/lib/auth/user-sync')
      
      const minimalUser = {
        id: 'ba-user-456',
        email: 'minimal@example.com'
      }

      const payloadUser = mapBetterAuthToPayload(minimalUser)

      expect(payloadUser.email).toBe(minimalUser.email)
      expect(payloadUser.name).toBe('minimal') // Should extract from email
      expect(payloadUser.betterAuthId).toBe(minimalUser.id)
    })
  })

  describe('Payload to Better Auth Mapping', () => {
    it('should map Payload user to Better Auth format', async () => {
      const { mapPayloadToBetterAuth } = await import('@/lib/auth/user-sync')
      
      const payloadUser = {
        id: 'payload-123',
        email: 'payload@example.com',
        name: 'Payload User',
        betterAuthId: 'ba-user-789',
        role: 'admin' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as PayloadUser

      const betterAuthUser = mapPayloadToBetterAuth(payloadUser)

      expect(betterAuthUser.id).toBe(payloadUser.betterAuthId)
      expect(betterAuthUser.email).toBe(payloadUser.email)
      expect(betterAuthUser.name).toBe(payloadUser.name)
    })
  })

  describe('Role Mapping', () => {
    it('should map Payload roles to Better Auth roles', async () => {
      const { mapPayloadRoleToBetterAuth } = await import('@/lib/auth/user-sync')
      
      expect(mapPayloadRoleToBetterAuth('admin')).toBe('admin')
      expect(mapPayloadRoleToBetterAuth('content-editor')).toBe('editor')
      expect(mapPayloadRoleToBetterAuth('authenticated')).toBe('user')
    })

    it('should map Better Auth roles to Payload roles', async () => {
      const { mapBetterAuthRoleToPayload } = await import('@/lib/auth/user-sync')
      
      expect(mapBetterAuthRoleToPayload('admin')).toBe('admin')
      expect(mapBetterAuthRoleToPayload('editor')).toBe('content-editor')
      expect(mapBetterAuthRoleToPayload('user')).toBe('authenticated')
    })
  })
})