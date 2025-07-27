import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { User as PayloadUser } from '@/payload-types'
import type { Payload } from 'payload'

// Mock Payload instance
const mockPayload = {
  create: vi.fn(),
  find: vi.fn(),
  update: vi.fn(),
  findByID: vi.fn(),
} as unknown as Payload

describe('User Synchronization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('syncBetterAuthToPayload', () => {
    it('should create new Payload user if Better Auth user does not exist', async () => {
      const { syncBetterAuthToPayload } = await import('@/lib/auth/user-sync')
      
      const betterAuthUser = {
        id: 'ba-user-new',
        email: 'new@example.com',
        name: 'New User',
        emailVerified: true,
      }

      // Mock that user doesn't exist
      mockPayload.find = vi.fn().mockResolvedValue({
        docs: [],
        totalDocs: 0,
      })

      mockPayload.create = vi.fn().mockResolvedValue({
        id: 'payload-new',
        email: betterAuthUser.email,
        name: betterAuthUser.name,
        betterAuthId: betterAuthUser.id,
        role: 'authenticated',
      })

      const result = await syncBetterAuthToPayload(betterAuthUser, mockPayload)

      expect(mockPayload.find).toHaveBeenCalledWith({
        collection: 'users',
        where: {
          betterAuthId: {
            equals: betterAuthUser.id,
          },
        },
      })

      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'users',
        data: {
          email: betterAuthUser.email,
          name: betterAuthUser.name,
          betterAuthId: betterAuthUser.id,
          role: 'authenticated',
        },
      })

      expect(result).toMatchObject({
        email: betterAuthUser.email,
        name: betterAuthUser.name,
        betterAuthId: betterAuthUser.id,
      })
    })

    it('should update existing Payload user if Better Auth user exists', async () => {
      const { syncBetterAuthToPayload } = await import('@/lib/auth/user-sync')
      
      const betterAuthUser = {
        id: 'ba-user-existing',
        email: 'updated@example.com',
        name: 'Updated User',
      }

      const existingPayloadUser = {
        id: 'payload-existing',
        email: 'old@example.com',
        name: 'Old User',
        betterAuthId: betterAuthUser.id,
        role: 'authenticated',
      }

      // Mock that user exists
      mockPayload.find = vi.fn().mockResolvedValue({
        docs: [existingPayloadUser],
        totalDocs: 1,
      })

      mockPayload.update = vi.fn().mockResolvedValue({
        ...existingPayloadUser,
        email: betterAuthUser.email,
        name: betterAuthUser.name,
      })

      const result = await syncBetterAuthToPayload(betterAuthUser, mockPayload)

      expect(mockPayload.update).toHaveBeenCalledWith({
        collection: 'users',
        id: existingPayloadUser.id,
        data: {
          email: betterAuthUser.email,
          name: betterAuthUser.name,
        },
      })

      expect(result).toMatchObject({
        email: betterAuthUser.email,
        name: betterAuthUser.name,
      })
    })
  })

  describe('syncPayloadToBetterAuth', () => {
    it('should sync Payload user to Better Auth', async () => {
      const { syncPayloadToBetterAuth } = await import('@/lib/auth/user-sync')
      const { auth } = await import('@/lib/auth')
      
      const payloadUser = {
        id: 'payload-123',
        email: 'payload@example.com',
        name: 'Payload User',
        betterAuthId: 'ba-user-123',
        role: 'admin' as const,
      } as PayloadUser

      // Mock Better Auth user update
      const mockUpdateUser = vi.fn().mockResolvedValue({
        id: payloadUser.betterAuthId,
        email: payloadUser.email,
        name: payloadUser.name,
      })

      // TODO: We'll need to mock auth.api.updateUser when Better Auth adapter is properly set up
      // For now, just test the mapping
      const result = await syncPayloadToBetterAuth(payloadUser, auth)

      expect(result).toBeDefined()
      // We'll add more assertions once Better Auth adapter is set up
    })
  })

  describe('findOrCreatePayloadUser', () => {
    it('should find existing user by email if no betterAuthId', async () => {
      const { findOrCreatePayloadUser } = await import('@/lib/auth/user-sync')
      
      const betterAuthUser = {
        id: 'ba-user-email',
        email: 'existing@example.com',
        name: 'Existing User',
      }

      const existingUser = {
        id: 'payload-existing',
        email: betterAuthUser.email,
        name: 'Old Name',
        role: 'authenticated',
      }

      // First call - no user with betterAuthId
      mockPayload.find = vi.fn()
        .mockResolvedValueOnce({
          docs: [],
          totalDocs: 0,
        })
        // Second call - find by email
        .mockResolvedValueOnce({
          docs: [existingUser],
          totalDocs: 1,
        })

      mockPayload.update = vi.fn().mockResolvedValue({
        ...existingUser,
        betterAuthId: betterAuthUser.id,
        name: betterAuthUser.name,
      })

      const result = await findOrCreatePayloadUser(betterAuthUser, mockPayload)

      // Should update user with betterAuthId
      expect(mockPayload.update).toHaveBeenCalledWith({
        collection: 'users',
        id: existingUser.id,
        data: expect.objectContaining({
          betterAuthId: betterAuthUser.id,
        }),
      })

      expect(result).toMatchObject({
        betterAuthId: betterAuthUser.id,
      })
    })
  })
})