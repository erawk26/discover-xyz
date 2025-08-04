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

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    manager?.stop()
    vi.useRealTimers()
  })

  describe('constructor', () => {
    it('should use default config values', () => {
      manager = new SessionRefreshManager()
      const config = (manager as any).config
      
      expect(config.refreshThreshold).toBe(3600) // 1 hour
      expect(config.maxRetries).toBe(3)
      expect(config.onRefreshSuccess).toBeDefined()
      expect(config.onRefreshError).toBeDefined()
    })

    it('should accept custom config values', () => {
      const onSuccess = vi.fn()
      const onError = vi.fn()
      
      manager = new SessionRefreshManager({
        refreshThreshold: 1800,
        maxRetries: 5,
        onRefreshSuccess: onSuccess,
        onRefreshError: onError,
      })
      
      const config = (manager as any).config
      expect(config.refreshThreshold).toBe(1800)
      expect(config.maxRetries).toBe(5)
      expect(config.onRefreshSuccess).toBe(onSuccess)
      expect(config.onRefreshError).toBe(onError)
    })
  })

  describe('start', () => {
    it('should fetch initial session and schedule refresh', async () => {
      const mockSession = {
        user: { id: '1', email: 'test@example.com' },
        expiresAt: Date.now() / 1000 + 7200, // 2 hours
      }
      
      vi.mocked(authClient.getSession).mockResolvedValueOnce(mockSession)
      
      manager = new SessionRefreshManager()
      await manager.start()
      
      expect(authClient.getSession).toHaveBeenCalledTimes(1)
    })

    it('should handle no session on start', async () => {
      vi.mocked(authClient.getSession).mockResolvedValueOnce(null)
      
      manager = new SessionRefreshManager()
      await manager.start()
      
      expect(authClient.getSession).toHaveBeenCalledTimes(1)
      // Should not crash and not schedule refresh
    })

    it('should handle error fetching initial session', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(authClient.getSession).mockRejectedValueOnce(new Error('Network error'))
      
      manager = new SessionRefreshManager()
      await manager.start()
      
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to get initial session:',
        expect.any(Error)
      )
      
      consoleError.mockRestore()
    })

    it('should clear existing timer when starting', async () => {
      const mockSession = {
        user: { id: '1', email: 'test@example.com' },
        expiresAt: Date.now() / 1000 + 7200,
      }
      
      vi.mocked(authClient.getSession).mockResolvedValue(mockSession)
      
      manager = new SessionRefreshManager()
      await manager.start()
      
      // Start again should clear previous timer
      await manager.start()
      
      expect(authClient.getSession).toHaveBeenCalledTimes(2)
    })
  })

  describe('stop', () => {
    it('should clear timer and reset state', async () => {
      const mockSession = {
        user: { id: '1', email: 'test@example.com' },
        expiresAt: Date.now() / 1000 + 7200,
      }
      
      vi.mocked(authClient.getSession).mockResolvedValue(mockSession)
      
      manager = new SessionRefreshManager()
      await manager.start()
      
      manager.stop()
      
      expect((manager as any).refreshTimer).toBeNull()
      expect((manager as any).refreshPromise).toBeNull()
      expect((manager as any).retryCount).toBe(0)
    })

    it('should be safe to call multiple times', () => {
      manager = new SessionRefreshManager()
      
      // Should not throw
      manager.stop()
      manager.stop()
      manager.stop()
    })
  })

  describe('scheduleRefresh', () => {
    it('should schedule refresh before expiry', async () => {
      const now = Date.now() / 1000
      const mockSession = {
        user: { id: '1', email: 'test@example.com' },
        expiresAt: now + 7200, // 2 hours
      }
      
      vi.mocked(authClient.getSession)
        .mockResolvedValueOnce(mockSession)
        .mockResolvedValueOnce({ ...mockSession, expiresAt: now + 14400 }) // 4 hours
        .mockResolvedValueOnce({ ...mockSession, expiresAt: now + 14400 }) // For scheduling after refresh
      
      manager = new SessionRefreshManager({ refreshThreshold: 3600 }) // 1 hour
      await manager.start()
      
      // Fast forward to refresh time (1 hour before expiry)
      vi.advanceTimersByTime(3600 * 1000)
      await vi.runAllTimersAsync()
      
      // Initial + refresh + scheduling after refresh = 3
      expect(authClient.getSession).toHaveBeenCalledTimes(3)
    })

    it('should trigger immediate refresh for soon-to-expire session', async () => {
      const mockSession = {
        user: { id: '1', email: 'test@example.com' },
        expiresAt: Date.now() / 1000 + 1800, // 30 minutes
      }
      
      vi.mocked(authClient.getSession)
        .mockResolvedValueOnce(mockSession)
        .mockResolvedValueOnce({ ...mockSession, expiresAt: Date.now() / 1000 + 7200 })
        .mockResolvedValueOnce({ ...mockSession, expiresAt: Date.now() / 1000 + 7200 })
      
      manager = new SessionRefreshManager({ refreshThreshold: 3600 }) // 1 hour
      await manager.start()
      
      // Should trigger immediate refresh
      await vi.runAllTimersAsync()
      
      // Initial + immediate refresh + scheduling after refresh = 3
      expect(authClient.getSession).toHaveBeenCalledTimes(3)
    })

    it('should trigger immediate refresh for expired session', async () => {
      const mockSession = {
        user: { id: '1', email: 'test@example.com' },
        expiresAt: Date.now() / 1000 - 100, // Already expired
      }
      
      vi.mocked(authClient.getSession)
        .mockResolvedValueOnce(mockSession)
        .mockResolvedValueOnce({ ...mockSession, expiresAt: Date.now() / 1000 + 7200 })
        .mockResolvedValueOnce({ ...mockSession, expiresAt: Date.now() / 1000 + 7200 })
      
      manager = new SessionRefreshManager()
      await manager.start()
      
      // Should trigger immediate refresh
      await vi.runAllTimersAsync()
      
      // Initial + immediate refresh + scheduling after refresh = 3
      expect(authClient.getSession).toHaveBeenCalledTimes(3)
    })
  })

  describe('refreshSession', () => {
    it('should prevent concurrent refresh attempts', async () => {
      let resolveSession: (value: any) => void
      vi.mocked(authClient.getSession).mockImplementation(() => {
        return new Promise(resolve => {
          resolveSession = resolve
        })
      })
      
      manager = new SessionRefreshManager()
      
      // Start multiple refresh attempts
      const promise1 = manager.refreshSession()
      const promise2 = manager.refreshSession()
      const promise3 = manager.refreshSession()
      
      // Should only call getSession once
      expect(authClient.getSession).toHaveBeenCalledTimes(1)
      
      // Resolve the session
      const mockSession = {
        user: { id: '1', email: 'test@example.com' },
        expiresAt: Date.now() / 1000 + 7200,
      }
      resolveSession!(mockSession)
      
      const results = await Promise.all([promise1, promise2, promise3])
      
      // All promises should resolve to the same session
      expect(results[0]).toBe(mockSession)
      expect(results[1]).toBe(mockSession)
      expect(results[2]).toBe(mockSession)
    })

    it('should call success callback on successful refresh', async () => {
      const onSuccess = vi.fn()
      const mockSession = {
        user: { id: '1', email: 'test@example.com' },
        expiresAt: Date.now() / 1000 + 7200,
      }
      
      vi.mocked(authClient.getSession).mockResolvedValueOnce(mockSession)
      
      manager = new SessionRefreshManager({ onRefreshSuccess: onSuccess })
      const result = await manager.refreshSession()
      
      expect(result).toBe(mockSession)
      expect(onSuccess).toHaveBeenCalledWith(mockSession)
    })

    it('should return null for missing session', async () => {
      vi.mocked(authClient.getSession).mockResolvedValueOnce(null)
      
      manager = new SessionRefreshManager()
      const result = await manager.refreshSession()
      
      expect(result).toBeNull()
    })
  })

  describe('retry logic', () => {
    it('should retry with exponential backoff', async () => {
      const mockSession = {
        user: { id: '1', email: 'test@example.com' },
        expiresAt: Date.now() / 1000 + 7200,
      }
      
      vi.mocked(authClient.getSession)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockSession)
        .mockResolvedValueOnce(mockSession) // For scheduling after success
      
      manager = new SessionRefreshManager({ maxRetries: 3 })
      const refreshPromise = manager.refreshSession()
      
      // First retry after 2 seconds
      vi.advanceTimersByTime(2000)
      await vi.runAllTimersAsync()
      
      // Second retry after 4 seconds
      vi.advanceTimersByTime(4000)
      await vi.runAllTimersAsync()
      
      const result = await refreshPromise
      
      expect(result).toBe(mockSession)
      expect(authClient.getSession).toHaveBeenCalledTimes(4) // Initial fail + 2 retries + scheduling
    })

    it('should stop after max retries and call error callback', async () => {
      const onError = vi.fn()
      const error = new Error('Persistent error')
      
      vi.mocked(authClient.getSession).mockRejectedValue(error)
      
      manager = new SessionRefreshManager({ 
        maxRetries: 2,
        onRefreshError: onError 
      })
      
      const refreshPromise = manager.refreshSession()
      
      // First retry
      vi.advanceTimersByTime(2000)
      await vi.runAllTimersAsync()
      
      // This actually only does one retry after the initial failure
      const result = await refreshPromise
      
      expect(result).toBeNull()
      expect(onError).toHaveBeenCalledWith(error)
      expect(authClient.getSession).toHaveBeenCalledTimes(2) // Initial + 1 retry (max is 2 but that includes the initial attempt)
    })

    it('should reset retry count on success', async () => {
      const mockSession = {
        user: { id: '1', email: 'test@example.com' },
        expiresAt: Date.now() / 1000 + 7200,
      }
      
      vi.mocked(authClient.getSession)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockSession)
        .mockResolvedValueOnce(mockSession) // For scheduling
      
      manager = new SessionRefreshManager()
      
      // First refresh with retry
      const refreshPromise = manager.refreshSession()
      
      // Wait for retry
      vi.advanceTimersByTime(2000)
      await vi.runAllTimersAsync()
      
      const result1 = await refreshPromise
      
      expect(result1).toBe(mockSession)
      expect((manager as any).retryCount).toBe(0) // Reset after success
    })
  })

  describe('forceRefresh', () => {
    it('should reset retry count and refresh immediately', async () => {
      const mockSession = {
        user: { id: '1', email: 'test@example.com' },
        expiresAt: Date.now() / 1000 + 7200,
      }
      
      vi.mocked(authClient.getSession)
        .mockResolvedValueOnce(mockSession)
        .mockResolvedValueOnce(mockSession) // For scheduling
      
      manager = new SessionRefreshManager()
      ;(manager as any).retryCount = 5 // Simulate previous retries
      
      const result = await manager.forceRefresh()
      
      expect(result).toEqual(mockSession)
      expect((manager as any).retryCount).toBe(0)
    })
  })

  describe('edge cases', () => {
    it('should handle session refresh scheduling after refresh', async () => {
      const now = Date.now() / 1000
      const mockSession = {
        user: { id: '1', email: 'test@example.com' },
        expiresAt: now + 7200, // 2 hours
      }
      
      const refreshedSession = {
        ...mockSession,
        expiresAt: now + 14400, // 4 hours
      }
      
      vi.mocked(authClient.getSession)
        .mockResolvedValueOnce(mockSession)
        .mockResolvedValueOnce(refreshedSession)
      
      manager = new SessionRefreshManager()
      await manager.refreshSession()
      
      // Should schedule next refresh based on new expiry
      expect((manager as any).refreshTimer).toBeDefined()
    })

    it('should handle rapid start/stop cycles', async () => {
      const mockSession = {
        user: { id: '1', email: 'test@example.com' },
        expiresAt: Date.now() / 1000 + 7200,
      }
      
      vi.mocked(authClient.getSession).mockResolvedValue(mockSession)
      
      manager = new SessionRefreshManager()
      
      // Rapid start/stop cycles
      for (let i = 0; i < 10; i++) {
        await manager.start()
        manager.stop()
      }
      
      // Should not leak timers or cause errors
      expect((manager as any).refreshTimer).toBeNull()
    })
  })
})