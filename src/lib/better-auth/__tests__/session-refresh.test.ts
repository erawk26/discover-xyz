import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SessionRefreshManager } from '../session-refresh'
import { authClient } from '../client'

// Mock the auth client
vi.mock('../client', () => ({
  authClient: {
    getSession: vi.fn(),
  },
}))

describe('SessionRefreshManager', () => {
  let manager: SessionRefreshManager
  let mockSession: any

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    
    // Mock session that expires in 2 hours
    const now = Date.now() / 1000
    mockSession = {
      user: { id: '1', email: 'test@example.com' },
      expiresAt: now + 7200, // 2 hours from now
    }
  })

  afterEach(() => {
    manager?.stop()
    vi.useRealTimers()
  })

  it('should schedule refresh before session expires', async () => {
    const onRefreshSuccess = vi.fn()
    manager = new SessionRefreshManager({
      refreshThreshold: 3600, // 1 hour before expiry
      onRefreshSuccess,
    })

    vi.mocked(authClient.getSession).mockResolvedValue(mockSession)
    
    await manager.start()

    // Should schedule refresh in 1 hour (2 hours expiry - 1 hour threshold)
    expect(vi.getTimerCount()).toBe(1)
    
    // Fast forward to just before refresh time
    vi.advanceTimersByTime(3599 * 1000)
    expect(onRefreshSuccess).not.toHaveBeenCalled()
    
    // Fast forward to refresh time
    vi.advanceTimersByTime(1001)
    await vi.runAllTimersAsync()
    
    expect(authClient.getSession).toHaveBeenCalledTimes(2) // Initial + refresh
    expect(onRefreshSuccess).toHaveBeenCalledWith(mockSession)
  })

  it('should handle refresh errors with retry', async () => {
    const onRefreshError = vi.fn()
    manager = new SessionRefreshManager({
      refreshThreshold: 3600,
      maxRetries: 3,
      onRefreshError,
    })

    // First call succeeds (initial session)
    vi.mocked(authClient.getSession)
      .mockResolvedValueOnce(mockSession)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockSession) // Succeeds on 3rd retry

    await manager.start()
    
    // Trigger refresh
    vi.advanceTimersByTime(3600 * 1000)
    await vi.runAllTimersAsync()
    
    // Should retry with exponential backoff
    expect(authClient.getSession).toHaveBeenCalledTimes(4) // Initial + 3 attempts
    expect(onRefreshError).not.toHaveBeenCalled() // Should not call error handler if retry succeeds
  })

  it('should prevent concurrent refresh attempts', async () => {
    manager = new SessionRefreshManager({
      refreshThreshold: 3600,
    })

    vi.mocked(authClient.getSession).mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
      return mockSession
    })

    await manager.start()
    
    // Try to refresh multiple times concurrently
    const promises = [
      manager.forceRefresh(),
      manager.forceRefresh(),
      manager.forceRefresh(),
    ]
    
    await Promise.all(promises)
    
    // Should only make 2 calls (initial + 1 refresh)
    expect(authClient.getSession).toHaveBeenCalledTimes(2)
  })

  it('should handle immediate refresh for expired sessions', async () => {
    const expiredSession = {
      ...mockSession,
      expiresAt: Date.now() / 1000 - 100, // Expired 100 seconds ago
    }
    
    const onRefreshSuccess = vi.fn()
    manager = new SessionRefreshManager({
      refreshThreshold: 3600,
      onRefreshSuccess,
    })

    vi.mocked(authClient.getSession)
      .mockResolvedValueOnce(expiredSession)
      .mockResolvedValueOnce(mockSession) // Fresh session after refresh
    
    await manager.start()
    
    // Should trigger immediate refresh
    await vi.runAllTimersAsync()
    
    expect(authClient.getSession).toHaveBeenCalledTimes(2)
    expect(onRefreshSuccess).toHaveBeenCalledWith(mockSession)
  })

  it('should stop trying after max retries', async () => {
    const onRefreshError = vi.fn()
    manager = new SessionRefreshManager({
      refreshThreshold: 3600,
      maxRetries: 2,
      onRefreshError,
    })

    vi.mocked(authClient.getSession)
      .mockResolvedValueOnce(mockSession)
      .mockRejectedValue(new Error('Persistent error'))

    await manager.start()
    
    // Trigger refresh
    vi.advanceTimersByTime(3600 * 1000)
    await vi.runAllTimersAsync()
    
    // Initial + 2 retries = 3 total calls
    expect(authClient.getSession).toHaveBeenCalledTimes(3)
    expect(onRefreshError).toHaveBeenCalledWith(new Error('Persistent error'))
  })
})