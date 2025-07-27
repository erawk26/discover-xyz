import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Payload } from 'payload'
import { getPayload } from 'payload'
import config from '@/payload.config'

// Mock Payload instance
const mockPayload = {
  create: vi.fn(),
  find: vi.fn(),
  update: vi.fn(),
  findByID: vi.fn(),
} as unknown as Payload

describe('OAuth User Creation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('User Creation from OAuth', () => {
    it('should create new Payload user from OAuth data', async () => {
      const { createUserFromOAuth } = await import('@/lib/auth/oauth-providers')
      const { findOrCreatePayloadUser } = await import('@/lib/auth/user-sync')
      
      const oauthData = {
        provider: 'google',
        providerId: 'google-new-123',
        email: 'newuser@gmail.com',
        name: 'New OAuth User',
        emailVerified: true,
        image: 'https://example.com/avatar.jpg',
      }

      // Mock no existing user
      mockPayload.find = vi.fn().mockResolvedValue({
        docs: [],
        totalDocs: 0,
      })

      // Mock user creation
      mockPayload.create = vi.fn().mockResolvedValue({
        id: 'payload-new-123',
        email: oauthData.email,
        name: oauthData.name,
        betterAuthId: oauthData.providerId,
        role: 'authenticated',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      const result = await findOrCreatePayloadUser(
        {
          id: oauthData.providerId,
          email: oauthData.email,
          name: oauthData.name,
          emailVerified: oauthData.emailVerified,
          image: oauthData.image,
        },
        mockPayload
      )

      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'users',
        data: expect.objectContaining({
          email: oauthData.email,
          name: oauthData.name,
          betterAuthId: oauthData.providerId,
          role: 'authenticated',
        }),
      })

      expect(result).toMatchObject({
        email: oauthData.email,
        name: oauthData.name,
        betterAuthId: oauthData.providerId,
        role: 'authenticated',
      })
    })

    it('should link OAuth to existing user with same email', async () => {
      const { findOrCreatePayloadUser } = await import('@/lib/auth/user-sync')
      
      const existingUser = {
        id: 'existing-123',
        email: 'existing@gmail.com',
        name: 'Existing User',
        role: 'content-editor',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      }

      const oauthData = {
        id: 'google-existing-456',
        email: existingUser.email,
        name: 'Google Name',
        emailVerified: true,
      }

      // Mock finding user by email (no betterAuthId yet)
      mockPayload.find = vi.fn()
        .mockResolvedValueOnce({ docs: [], totalDocs: 0 }) // No user with betterAuthId
        .mockResolvedValueOnce({ docs: [existingUser], totalDocs: 1 }) // Found by email

      // Mock updating user with betterAuthId
      mockPayload.update = vi.fn().mockResolvedValue({
        ...existingUser,
        betterAuthId: oauthData.id,
        name: oauthData.name,
      })

      const result = await findOrCreatePayloadUser(oauthData, mockPayload)

      expect(mockPayload.update).toHaveBeenCalledWith({
        collection: 'users',
        id: existingUser.id,
        data: {
          betterAuthId: oauthData.id,
          name: oauthData.name,
        },
      })

      expect(result.betterAuthId).toBe(oauthData.id)
      expect(result.role).toBe(existingUser.role) // Role preserved
    })
  })

  describe('OAuth Role Assignment', () => {
    it('should assign authenticated role to new OAuth users', async () => {
      const { findOrCreatePayloadUser } = await import('@/lib/auth/user-sync')
      
      const oauthData = {
        id: 'google-auth-789',
        email: 'newauth@gmail.com',
        name: 'New Auth User',
      }

      mockPayload.find = vi.fn().mockResolvedValue({
        docs: [],
        totalDocs: 0,
      })

      mockPayload.create = vi.fn().mockResolvedValue({
        id: 'payload-auth-789',
        email: oauthData.email,
        name: oauthData.name,
        betterAuthId: oauthData.id,
        role: 'authenticated',
      })

      const result = await findOrCreatePayloadUser(oauthData, mockPayload)

      expect(result.role).toBe('authenticated')
    })

    it('should preserve admin role when OAuth user is admin', async () => {
      const { findOrCreatePayloadUser } = await import('@/lib/auth/user-sync')
      
      const adminUser = {
        id: 'admin-123',
        email: 'admin@company.com',
        name: 'Admin User',
        role: 'admin',
        betterAuthId: null,
      }

      const oauthData = {
        id: 'google-admin-123',
        email: adminUser.email,
        name: 'Google Admin',
      }

      mockPayload.find = vi.fn()
        .mockResolvedValueOnce({ docs: [], totalDocs: 0 })
        .mockResolvedValueOnce({ docs: [adminUser], totalDocs: 1 })

      mockPayload.update = vi.fn().mockResolvedValue({
        ...adminUser,
        betterAuthId: oauthData.id,
        name: oauthData.name, // Keep original name or update to OAuth name
      })

      const result = await findOrCreatePayloadUser(oauthData, mockPayload)

      expect(result.role).toBe('admin') // Admin role preserved
      expect(mockPayload.update).toHaveBeenCalledWith({
        collection: 'users',
        id: adminUser.id,
        data: {
          betterAuthId: oauthData.id,
          name: oauthData.name,
        },
      })
    })

    it('should handle first-time OAuth signup', async () => {
      const { findOrCreatePayloadUser } = await import('@/lib/auth/user-sync')
      
      const newUserData = {
        id: 'github-first-123',
        email: 'firsttime@github.com',
        name: 'First Time User',
        emailVerified: true,
      }

      // Simulate no existing users
      mockPayload.find = vi.fn().mockResolvedValue({
        docs: [],
        totalDocs: 0,
      })

      mockPayload.create = vi.fn().mockResolvedValue({
        id: 'payload-first-123',
        ...newUserData,
        betterAuthId: newUserData.id,
        role: 'authenticated',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      const result = await findOrCreatePayloadUser(newUserData, mockPayload)

      expect(mockPayload.create).toHaveBeenCalled()
      expect(result.email).toBe(newUserData.email)
      expect(result.role).toBe('authenticated')
    })
  })
})