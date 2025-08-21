import { authClient } from './client'

// Define types based on what authClient.getSession returns
interface SessionData {
  user: {
    id: string
    email: string
    name?: string
  }
  session: {
    id: string
    userId: string
    expiresAt: number
    createdAt: Date
    updatedAt: Date
  }
}

type Session = SessionData['session']

interface RefreshConfig {
  refreshThreshold?: number // Time in seconds before expiry to trigger refresh
  maxRetries?: number
  onRefreshSuccess?: (session: Session) => void
  onRefreshError?: (error: Error) => void
}

const DEFAULT_REFRESH_THRESHOLD = 60 * 60 // 1 hour before expiry
const DEFAULT_MAX_RETRIES = 3

/**
 * Session refresh manager for Better Auth
 * Automatically refreshes sessions before they expire
 */
export class SessionRefreshManager {
  private refreshTimer: NodeJS.Timeout | null = null
  private refreshPromise: Promise<Session | null> | null = null
  private retryCount = 0
  private config: Required<RefreshConfig>

  constructor(config: RefreshConfig = {}) {
    this.config = {
      refreshThreshold: config.refreshThreshold ?? DEFAULT_REFRESH_THRESHOLD,
      maxRetries: config.maxRetries ?? DEFAULT_MAX_RETRIES,
      onRefreshSuccess: config.onRefreshSuccess ?? (() => {}),
      onRefreshError: config.onRefreshError ?? ((error) => console.error('Session refresh failed:', error)),
    }
  }

  /**
   * Start monitoring session and schedule refresh
   */
  async start() {
    this.stop() // Clear any existing timers
    
    try {
      const sessionData = await authClient.getSession()
      if (sessionData && 'session' in sessionData) {
        this.scheduleRefresh((sessionData as any).session)
      }
    } catch (error) {
      console.error('Failed to get initial session:', error)
    }
  }

  /**
   * Stop monitoring session
   */
  stop() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
    this.refreshPromise = null
    this.retryCount = 0
  }

  /**
   * Schedule session refresh based on expiry time
   */
  private scheduleRefresh(session: Session) {
    const now = Date.now() / 1000 // Current time in seconds
    const expiresAt = session.expiresAt
    const timeUntilExpiry = expiresAt - now
    const timeUntilRefresh = Math.max(0, timeUntilExpiry - this.config.refreshThreshold)

    if (timeUntilRefresh > 0) {
      this.refreshTimer = setTimeout(async () => {
        await this.refreshSession()
      }, timeUntilRefresh * 1000)
    } else {
      // Session needs immediate refresh
      this.refreshSession()
    }
  }

  /**
   * Refresh the current session
   */
  async refreshSession(): Promise<Session | null> {
    // Prevent concurrent refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = this.performRefresh()
    const result = await this.refreshPromise
    this.refreshPromise = null
    
    return result
  }

  /**
   * Perform the actual refresh with retry logic
   */
  private async performRefresh(): Promise<Session | null> {
    try {
      // Better Auth automatically refreshes sessions when accessing them
      // if they're older than updateAge
      const sessionData = await authClient.getSession()
      
      if (sessionData && 'session' in sessionData) {
        this.retryCount = 0
        const session = (sessionData as any).session
        this.config.onRefreshSuccess(session)
        this.scheduleRefresh(session) // Schedule next refresh
        return session
      }
      
      return null
    } catch (error) {
      this.retryCount++
      
      if (this.retryCount < this.config.maxRetries) {
        // Exponential backoff: 2^retry seconds
        const delay = Math.pow(2, this.retryCount) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.performRefresh()
      }
      
      this.config.onRefreshError(error as Error)
      this.stop() // Stop trying after max retries
      return null
    }
  }

  /**
   * Manually trigger a session refresh
   */
  async forceRefresh(): Promise<Session | null> {
    this.retryCount = 0
    return this.refreshSession()
  }
}

// Create a singleton instance
export const sessionRefreshManager = new SessionRefreshManager({
  refreshThreshold: 60 * 60, // Refresh 1 hour before expiry
  onRefreshSuccess: (_session) => {
    console.log('Session refreshed successfully')
  },
  onRefreshError: (error) => {
    console.error('Session refresh failed after retries:', error)
  },
})

/**
 * React hook for session refresh
 */
export function useSessionRefresh(config?: RefreshConfig) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const managerRef = useRef<SessionRefreshManager>(new SessionRefreshManager())

  useEffect(() => {
    managerRef.current = new SessionRefreshManager({
      ...config,
      onRefreshSuccess: (session) => {
        setIsRefreshing(false)
        config?.onRefreshSuccess?.(session)
      },
      onRefreshError: (error) => {
        setIsRefreshing(false)
        config?.onRefreshError?.(error)
      },
    })

    managerRef.current.start()

    return () => {
      managerRef.current?.stop()
    }
  }, [])

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    const session = await managerRef.current?.forceRefresh()
    setIsRefreshing(false)
    return session
  }, [])

  return { refresh, isRefreshing }
}

// Add missing imports
import { useState, useEffect, useRef, useCallback } from 'react'