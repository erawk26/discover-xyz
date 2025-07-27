import type { User } from '@/payload-types'

export const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'Admin123!',
    name: 'Test Admin',
    role: 'admin' as const,
  },
  editor: {
    email: 'editor@test.com', 
    password: 'Editor123!',
    name: 'Test Editor',
    role: 'content-editor' as const,
  },
  viewer: {
    email: 'viewer@test.com',
    password: 'Viewer123!',
    name: 'Test Viewer',
    role: 'authenticated' as const,
  },
} as const

export const testSessions = {
  validSession: {
    token: 'test-session-token-valid',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  },
  expiredSession: {
    token: 'test-session-token-expired',
    expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
} as const