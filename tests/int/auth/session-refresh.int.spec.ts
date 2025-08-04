import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mockAuthClient } from './setup'
import { SessionRefreshManager } from '@/lib/better-auth/session-refresh'

describe('SessionRefreshManager', () => {
  let manager: SessionRefreshManager
  let mockSession: any

  beforeEach(() => {
    // Clear all mocks
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

    // Setup mock to return session then refreshed session
    const refreshedSession = {
      ...mockSession,
      expiresAt: Date.now() / 1000 + 7200, // New 2 hour expiry
    }
    
    mockAuthClient.getSession
      .mockResolvedValueOnce(mockSession)
      .mockResolvedValueOnce(refreshedSession)
    
    await manager.start()

    // Fast forward to trigger refresh
    vi.advanceTimersByTime(3600 * 1000) // 1 hour
    
    // Wait for async operations
    await vi.runAllTimersAsync()
    
    expect(mockAuthClient.getSession).toHaveBeenCalledTimes(2)
    expect(onRefreshSuccess).toHaveBeenCalledWith(refreshedSession)
  })

  it('should handle refresh errors with retry', async () => {
    const onRefreshError = vi.fn()
    manager = new SessionRefreshManager({
      maxRetries: 3,
      onRefreshError,
    })

    // Mock sequence: initial session, error, then success
    const refreshedSession = {
      ...mockSession,
      expiresAt: Date.now() / 1000 + 7200,
    }
    
    mockAuthClient.getSession
      .mockResolvedValueOnce(mockSession)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(refreshedSession)

    await manager.start()

    // Trigger refresh
    vi.advanceTimersByTime(3600 * 1000)
    await vi.runAllTimersAsync()

    // Should retry after error with default delay
    vi.advanceTimersByTime(5000) // Default retry delay
    await vi.runAllTimersAsync()

    expect(mockAuthClient.getSession).toHaveBeenCalledTimes(3)
  })

  it('should prevent concurrent refresh attempts', async () => {
    manager = new SessionRefreshManager()

    let resolveRefresh: (value: any) => void
    mockAuthClient.getSession.mockImplementation(() => {
      return new Promise(resolve => {
        resolveRefresh = resolve
      })
    })

    // Start multiple refresh attempts
    const promise1 = manager.refreshSession()
    const promise2 = manager.refreshSession()
    const promise3 = manager.refreshSession()

    // Should only call getSession once
    expect(mockAuthClient.getSession).toHaveBeenCalledTimes(1)

    // Resolve the refresh
    resolveRefresh!({ ...mockSession, expiresAt: Date.now() / 1000 + 7200 })

    await Promise.all([promise1, promise2, promise3])

    // Still should only have called once
    expect(mockAuthClient.getSession).toHaveBeenCalledTimes(1)
  })

  it('should handle immediate refresh for expired sessions', async () => {
    const expiredSession = {
      ...mockSession,
      expiresAt: Date.now() / 1000 - 100, // Already expired
    }

    const newSession = {
      ...mockSession,
      expiresAt: Date.now() / 1000 + 7200,
    }

    mockAuthClient.getSession
      .mockResolvedValueOnce(expiredSession)
      .mockResolvedValueOnce(newSession)

    manager = new SessionRefreshManager()
    await manager.start()

    // For expired session, start() will call getSession and immediately
    // schedule a refresh, which might execute synchronously
    await vi.runAllTimersAsync()

    // Should have called getSession for start + immediate refresh
    expect(mockAuthClient.getSession).toHaveBeenCalledTimes(2)
  })

  it('should stop trying after max retries', async () => {
    const onMaxRetriesReached = vi.fn()
    const onRefreshError = vi.fn()
    
    manager = new SessionRefreshManager({
      maxRetries: 2,
      onRefreshError,
    })

    // Mock the max retries callback
    ;(manager as any).onMaxRetriesReached = onMaxRetriesReached

    mockAuthClient.getSession
      .mockResolvedValueOnce(mockSession)
      .mockRejectedValue(new Error('Persistent error'))

    await manager.start()

    // Trigger refresh
    vi.advanceTimersByTime(3600 * 1000)
    await vi.runAllTimersAsync()

    // Try retries with default retry delay
    // First retry
    vi.advanceTimersByTime(5000)
    await vi.runAllTimersAsync()
    
    // Second retry (should be last since maxRetries is 2)
    vi.advanceTimersByTime(5000)
    await vi.runAllTimersAsync()

    // Initial (1) + refresh attempt that fails (1) + one retry before hitting max = 3 total
    // The manager only does 2 retries after the initial failure
    expect(mockAuthClient.getSession).toHaveBeenCalledTimes(3)
    
    // Third retry would exceed maxRetries, so it stops
    vi.advanceTimersByTime(5000)
    await vi.runAllTimersAsync()
    
    // Should still be 3 - no more retries
    expect(mockAuthClient.getSession).toHaveBeenCalledTimes(3)
    
    // Should have called error handler for refresh + retries = 3 times
    expect(onRefreshError).toHaveBeenCalledTimes(3)
  })
})