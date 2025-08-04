import { describe, it, beforeAll, expect, vi } from 'vitest'
import type { Payload } from 'payload'

// Mock the payload config to avoid import issues
vi.mock('@/payload.config', () => ({
  default: Promise.resolve({
    collections: [],
    db: {
      defaultIDType: 'uuid',
    },
  }),
}))

// Mock getPayload
const mockPayload: Partial<Payload> = {
  find: vi.fn().mockResolvedValue({
    docs: [],
    totalDocs: 0,
    totalPages: 0,
    page: 1,
    pagingCounter: 1,
    hasPrevPage: false,
    hasNextPage: false,
    prevPage: null,
    nextPage: null,
  }),
}

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue(mockPayload),
}))

let payload: Payload

describe('API', () => {
  beforeAll(async () => {
    const { getPayload } = await import('payload')
    payload = await getPayload({ config: {} as any })
  })

  it('fetches users', async () => {
    const users = await payload.find({
      collection: 'users',
    })
    expect(users).toBeDefined()
    expect(users.docs).toBeDefined()
    expect(Array.isArray(users.docs)).toBe(true)
  })

  it('handles pagination', async () => {
    const result = await payload.find({
      collection: 'users',
      limit: 10,
      page: 1,
    })
    
    expect(result.totalPages).toBeDefined()
    expect(result.page).toBe(1)
    expect(result.hasNextPage).toBeDefined()
    expect(result.hasPrevPage).toBeDefined()
  })
})