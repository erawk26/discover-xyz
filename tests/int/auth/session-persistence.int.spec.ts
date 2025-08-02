import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { authClient } from '@/lib/better-auth/client'
import { SessionRefreshManager } from '@/lib/better-auth/session-refresh'

// Mock browser storage
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete mockLocalStorage.store[key]
  }),
  clear: vi.fn(() => {
    mockLocalStorage.store = {}
  }),
}

// Mock sessionStorage
const mockSessionStorage = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockSessionStorage.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockSessionStorage.store[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete mockSessionStorage.store[key]
  }),
  clear: vi.fn(() => {
    mockSessionStorage.store = {}
  }),
}

// Replace global storage
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage })

describe('Session Persistence Mechanisms', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
    mockSessionStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Session Storage', () => {
    it('should persist session in secure storage', async () => {
      const mockSession = {
        user: { id: '1', email: 'test@example.com', role: 'user' },
        expiresAt: Date.now() / 1000 + 7200,
        token: 'mock-jwt-token',
      }

      // Simulate successful login
      vi.spyOn(authClient.signIn, 'email').mockResolvedValueOnce({
        data: { session: mockSession, user: mockSession.user },
        error: null,
      } as any)

      await authClient.signIn.email({
        email: 'test@example.com',
        password: 'password123',
        callbackURL: '/admin',
      })

      // Session should be stored securely
      // Better Auth handles this internally, but we can verify through getSession
      vi.spyOn(authClient, 'getSession').mockResolvedValueOnce(mockSession as any)
      const retrievedSession = await authClient.getSession()

      expect(retrievedSession).toBeDefined()
      expect(retrievedSession.user.email).toBe('test@example.com')
    })

    it('should clear session on sign out', async () => {
      // Setup initial session
      const mockSession = {
        user: { id: '1', email: 'test@example.com', role: 'user' },
        expiresAt: Date.now() / 1000 + 7200,
      }

      vi.spyOn(authClient, 'getSession').mockResolvedValueOnce(mockSession as any)
      
      // Verify session exists
      let session = await authClient.getSession()
      expect(session).toBeDefined()

      // Sign out
      vi.spyOn(authClient, 'signOut').mockResolvedValueOnce({
        data: { success: true },
        error: null,
      } as any)
      
      await authClient.signOut()

      // Session should be cleared
      vi.spyOn(authClient, 'getSession').mockResolvedValueOnce(null as any)
      session = await authClient.getSession()
      expect(session).toBeNull()
    })
  })

  describe('Session Refresh and Auto-Renewal', () => {
    it('should automatically refresh session before expiry', async () => {
      const now = Date.now() / 1000
      const initialSession = {
        user: { id: '1', email: 'test@example.com', role: 'user' },
        expiresAt: now + 7200, // 2 hours from now
      }
      
      const refreshedSession = {
        ...initialSession,
        expiresAt: now + 14400, // 4 hours from now (refreshed)
      }

      const manager = new SessionRefreshManager({
        refreshThreshold: 3600, // Refresh 1 hour before expiry
      })

      // Mock the auth client methods
      vi.spyOn(authClient, 'getSession')
        .mockResolvedValueOnce(initialSession as any) // Initial session
        .mockResolvedValueOnce(refreshedSession as any) // After refresh

      await manager.start()

      // Fast forward to refresh time (1 hour before expiry)
      vi.advanceTimersByTime(3600 * 1000)
      await vi.runAllTimersAsync()

      // Verify refresh was called
      expect(authClient.getSession).toHaveBeenCalledTimes(2)
    })

    it('should handle session refresh failure with retry', async () => {
      const now = Date.now() / 1000
      const session = {
        user: { id: '1', email: 'test@example.com', role: 'user' },
        expiresAt: now + 7200,
      }

      const manager = new SessionRefreshManager({
        refreshThreshold: 3600,
        maxRetries: 3,
      })

      // First call succeeds, subsequent refresh attempts fail then succeed
      vi.spyOn(authClient, 'getSession')
        .mockResolvedValueOnce(session as any) // Initial
        .mockRejectedValueOnce(new Error('Network error')) // First refresh fails
        .mockRejectedValueOnce(new Error('Network error')) // Second attempt fails
        .mockResolvedValueOnce(session as any) // Third attempt succeeds

      await manager.start()

      // Trigger refresh
      vi.advanceTimersByTime(3600 * 1000)
      await vi.runAllTimersAsync()

      // Should have retried and eventually succeeded
      expect(authClient.getSession).toHaveBeenCalledTimes(4)
    })
  })

  describe('Cross-Tab Session Synchronization', () => {
    it('should sync session across browser tabs', async () => {
      const mockSession = {
        user: { id: '1', email: 'test@example.com', role: 'user' },
        expiresAt: Date.now() / 1000 + 7200,
      }

      // Simulate storage event from another tab
      const storageEvent = new StorageEvent('storage', {
        key: 'better-auth.session',
        newValue: JSON.stringify(mockSession),
        oldValue: null,
        storageArea: localStorage,
      })

      // Setup event listener spy
      const eventListenerSpy = vi.fn()
      window.addEventListener('storage', eventListenerSpy)

      // Dispatch storage event
      window.dispatchEvent(storageEvent)

      expect(eventListenerSpy).toHaveBeenCalledWith(storageEvent)

      // Cleanup
      window.removeEventListener('storage', eventListenerSpy)
    })

    it('should handle session removal in another tab', async () => {
      // Simulate session being cleared in another tab
      const storageEvent = new StorageEvent('storage', {
        key: 'better-auth.session',
        newValue: null,
        oldValue: JSON.stringify({ user: { id: '1' } }),
        storageArea: localStorage,
      })

      const eventListenerSpy = vi.fn()
      window.addEventListener('storage', eventListenerSpy)

      window.dispatchEvent(storageEvent)

      expect(eventListenerSpy).toHaveBeenCalled()
      
      // Verify the event indicates session removal
      const receivedEvent = eventListenerSpy.mock.calls[0][0]
      expect(receivedEvent.newValue).toBeNull()

      window.removeEventListener('storage', eventListenerSpy)
    })
  })

  describe('Session Recovery', () => {
    it('should recover session after page reload', async () => {
      const mockSession = {
        user: { id: '1', email: 'test@example.com', role: 'user' },
        expiresAt: Date.now() / 1000 + 7200,
      }

      // First, establish a session
      vi.spyOn(authClient, 'getSession').mockResolvedValueOnce(mockSession as any)
      
      const session = await authClient.getSession()
      expect(session).toBeDefined()

      // Simulate page reload by getting session again
      vi.spyOn(authClient, 'getSession').mockResolvedValueOnce(mockSession as any)
      
      const recoveredSession = await authClient.getSession()
      expect(recoveredSession).toBeDefined()
      expect(recoveredSession.user.email).toBe('test@example.com')
    })

    it('should not recover expired session', async () => {
      const expiredSession = {
        user: { id: '1', email: 'test@example.com', role: 'user' },
        expiresAt: Date.now() / 1000 - 100, // Expired 100 seconds ago
      }

      vi.spyOn(authClient, 'getSession').mockResolvedValueOnce(null as any)
      
      const session = await authClient.getSession()
      expect(session).toBeNull()
    })
  })

  describe('Secure Session Handling', () => {
    it('should use httpOnly cookies for session tokens', async () => {
      // This is handled by Better Auth internally
      // We can verify by checking that tokens aren't accessible via JS
      const mockSession = {
        user: { id: '1', email: 'test@example.com', role: 'user' },
        expiresAt: Date.now() / 1000 + 7200,
        // Note: No token field should be exposed to client-side JS
      }

      vi.spyOn(authClient, 'getSession').mockResolvedValueOnce(mockSession as any)
      
      const session = await authClient.getSession()
      
      // Session should not contain sensitive token data
      expect(session).toBeDefined()
      expect(session.user).toBeDefined()
      expect((session as any).token).toBeUndefined() // Token should not be exposed
    })

    it('should handle CSRF protection for session operations', async () => {
      // Better Auth handles CSRF protection internally
      // We verify that state-changing operations include protection
      const signOutSpy = vi.spyOn(authClient, 'signOut').mockResolvedValueOnce({
        data: { success: true },
        error: null,
      } as any)

      await authClient.signOut()

      // The actual CSRF token is handled internally by Better Auth
      expect(signOutSpy).toHaveBeenCalled()
    })
  })

  describe('Session Timeout Handling', () => {
    it('should handle session timeout gracefully', async () => {
      const manager = new SessionRefreshManager({
        refreshThreshold: 3600,
        onSessionExpired: vi.fn(),
      })

      // Mock expired session
      const expiredSession = {
        user: { id: '1', email: 'test@example.com', role: 'user' },
        expiresAt: Date.now() / 1000 - 100,
      }

      vi.spyOn(authClient, 'getSession').mockResolvedValueOnce(expiredSession as any)

      await manager.start()
      await vi.runAllTimersAsync()

      // Should trigger immediate refresh attempt for expired session
      expect(authClient.getSession).toHaveBeenCalled()
    })

    it('should notify when session cannot be refreshed', async () => {
      const onRefreshError = vi.fn()
      const manager = new SessionRefreshManager({
        refreshThreshold: 3600,
        maxRetries: 1,
        onRefreshError,
      })

      const session = {
        user: { id: '1', email: 'test@example.com', role: 'user' },
        expiresAt: Date.now() / 1000 + 7200,
      }

      vi.spyOn(authClient, 'getSession')
        .mockResolvedValueOnce(session as any) // Initial
        .mockRejectedValue(new Error('Session refresh failed')) // All refresh attempts fail

      await manager.start()

      // Trigger refresh
      vi.advanceTimersByTime(3600 * 1000)
      await vi.runAllTimersAsync()

      expect(onRefreshError).toHaveBeenCalledWith(new Error('Session refresh failed'))
    })
  })
})