import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UserRole } from '@/access/roles'
import type { User as PayloadUser } from '@/payload-types'
import type { Payload } from 'payload'

// Mock Payload instance
const mockPayload = {
  create: vi.fn(),
  find: vi.fn(),
  update: vi.fn(),
  findByID: vi.fn(),
} as unknown as Payload

describe('Role Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Role Mapping', () => {
    it('should correctly map all Payload roles to Better Auth roles', async () => {
      const { mapPayloadRoleToBetterAuth } = await import('@/lib/auth/user-sync')
      
      expect(mapPayloadRoleToBetterAuth(UserRole.ADMIN)).toBe('admin')
      expect(mapPayloadRoleToBetterAuth(UserRole.SITE_BUILDER)).toBe('editor')
      expect(mapPayloadRoleToBetterAuth(UserRole.CONTENT_EDITOR)).toBe('editor')
      expect(mapPayloadRoleToBetterAuth(UserRole.AUTHENTICATED)).toBe('user')
    })

    it('should correctly map Better Auth roles to Payload roles', async () => {
      const { mapBetterAuthRoleToPayload } = await import('@/lib/auth/user-sync')
      
      expect(mapBetterAuthRoleToPayload('admin')).toBe('admin')
      expect(mapBetterAuthRoleToPayload('editor')).toBe('content-editor')
      expect(mapBetterAuthRoleToPayload('user')).toBe('authenticated')
    })

    it('should handle unknown roles with defaults', async () => {
      const { mapPayloadRoleToBetterAuth, mapBetterAuthRoleToPayload } = await import('@/lib/auth/user-sync')
      
      expect(mapPayloadRoleToBetterAuth('unknown')).toBe('user')
      expect(mapBetterAuthRoleToPayload('unknown')).toBe('authenticated')
    })
  })

  describe('Role Synchronization', () => {
    it('should sync user role from Better Auth to Payload', async () => {
      const { syncUserRole } = await import('@/lib/auth/user-sync')
      
      const betterAuthUser = {
        id: 'ba-user-123',
        email: 'admin@example.com',
        role: 'admin',
      }

      const payloadUser = {
        id: 'payload-123',
        email: 'admin@example.com',
        betterAuthId: 'ba-user-123',
        role: 'authenticated' as const,
      } as PayloadUser

      mockPayload.update = vi.fn().mockResolvedValue({
        ...payloadUser,
        role: 'admin',
      })

      const result = await syncUserRole(betterAuthUser, payloadUser, mockPayload)

      expect(mockPayload.update).toHaveBeenCalledWith({
        collection: 'users',
        id: payloadUser.id,
        data: {
          role: 'admin',
        },
      })

      expect(result.role).toBe('admin')
    })

    it('should not update role if already synchronized', async () => {
      const { syncUserRole } = await import('@/lib/auth/user-sync')
      
      const betterAuthUser = {
        id: 'ba-user-123',
        email: 'admin@example.com',
        role: 'admin',
      }

      const payloadUser = {
        id: 'payload-123',
        email: 'admin@example.com',
        betterAuthId: 'ba-user-123',
        role: 'admin' as const,
      } as PayloadUser

      const result = await syncUserRole(betterAuthUser, payloadUser, mockPayload)

      expect(mockPayload.update).not.toHaveBeenCalled()
      expect(result.role).toBe('admin')
    })
  })

  describe('Permission Preservation', () => {
    it('should preserve Payload admin permissions when syncing', async () => {
      const { preserveAdminPermissions } = await import('@/lib/auth/user-sync')
      
      const payloadAdmin = {
        id: 'payload-admin',
        email: 'admin@example.com',
        role: 'admin' as const,
      } as PayloadUser

      const betterAuthUser = {
        id: 'ba-user-123',
        email: 'admin@example.com',
        role: 'user', // Lower role in Better Auth
      }

      const result = await preserveAdminPermissions(payloadAdmin, betterAuthUser)

      // Admin role should be preserved
      expect(result.role).toBe('admin')
    })

    it('should allow role elevation for non-admin users', async () => {
      const { preserveAdminPermissions } = await import('@/lib/auth/user-sync')
      
      const payloadUser = {
        id: 'payload-user',
        email: 'user@example.com',
        role: 'authenticated' as const,
      } as PayloadUser

      const betterAuthUser = {
        id: 'ba-user-123',
        email: 'user@example.com',
        role: 'editor',
      }

      const result = await preserveAdminPermissions(payloadUser, betterAuthUser)

      // Non-admin role can be elevated
      expect(result.role).toBe('editor')
    })
  })

  describe('Batch Role Sync', () => {
    it('should sync roles for multiple users efficiently', async () => {
      const { batchSyncRoles } = await import('@/lib/auth/user-sync')
      
      const users = [
        { betterAuthId: 'ba-1', role: 'admin' },
        { betterAuthId: 'ba-2', role: 'editor' },
        { betterAuthId: 'ba-3', role: 'user' },
      ]

      mockPayload.find = vi.fn().mockResolvedValue({
        docs: [
          { id: 'p-1', betterAuthId: 'ba-1', role: 'authenticated' },
          { id: 'p-2', betterAuthId: 'ba-2', role: 'authenticated' },
          { id: 'p-3', betterAuthId: 'ba-3', role: 'authenticated' },
        ],
      })

      mockPayload.update = vi.fn().mockImplementation((args) => {
        return Promise.resolve({ ...args.data, id: args.id })
      })

      const results = await batchSyncRoles(users, mockPayload)

      expect(results).toHaveLength(3)
      // Only 2 updates needed - 'user' maps to 'authenticated' which is already the current role
      expect(mockPayload.update).toHaveBeenCalledTimes(2)
      
      // Verify admin update
      expect(mockPayload.update).toHaveBeenCalledWith({
        collection: 'users',
        id: 'p-1',
        data: { role: 'admin' },
      })
      
      // Verify editor update
      expect(mockPayload.update).toHaveBeenCalledWith({
        collection: 'users',
        id: 'p-2',
        data: { role: 'content-editor' },
      })
    })
  })
})