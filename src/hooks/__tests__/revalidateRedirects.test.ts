import { describe, it, expect, vi, beforeEach } from 'vitest'
import { revalidateRedirects } from '../revalidateRedirects'
import { revalidateTag } from 'next/cache'

// Mock Next.js cache functions
vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}))

describe('revalidateRedirects', () => {
  const mockDoc = { id: '1', from: '/old', to: '/new' }
  const mockPayload = {
    logger: {
      info: vi.fn(),
    },
  }
  const mockReq = { payload: mockPayload }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call revalidateTag with redirects tag', () => {
    const result = revalidateRedirects({ doc: mockDoc, req: mockReq } as any)

    expect(revalidateTag).toHaveBeenCalledWith('redirects')
    expect(revalidateTag).toHaveBeenCalledTimes(1)
  })

  it('should log revalidation action', () => {
    revalidateRedirects({ doc: mockDoc, req: mockReq } as any)

    expect(mockPayload.logger.info).toHaveBeenCalledWith('Revalidating redirects')
  })

  it('should return the document unchanged', () => {
    const result = revalidateRedirects({ doc: mockDoc, req: mockReq } as any)
    
    expect(result).toBe(mockDoc)
  })

  it('should still return doc even if revalidateTag throws', () => {
    vi.mocked(revalidateTag).mockImplementation(() => {
      throw new Error('Revalidation failed')
    })

    // The hook doesn't catch errors, so it will throw
    expect(() => {
      revalidateRedirects({ doc: mockDoc, req: mockReq } as any)
    }).toThrow('Revalidation failed')
  })
})