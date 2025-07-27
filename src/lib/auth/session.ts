import { auth } from '@/lib/auth'
import type { NextRequest } from 'next/server'

export interface Session {
  userId: string
  email?: string
  token: string
  expiresAt: Date
}

/**
 * Validate session from request cookies
 */
export async function validateSession(request: NextRequest): Promise<Session | null> {
  try {
    const sessionCookie = request.cookies.get('better-auth.session')
    if (!sessionCookie?.value) {
      return null
    }

    // Use Better Auth's session validation
    const session = await auth.api.getSession({
      headers: request.headers
    })

    if (!session?.session) {
      return null
    }

    return {
      userId: session.user.id,
      email: session.user.email,
      token: sessionCookie.value,
      expiresAt: new Date(session.session.expiresAt)
    }
  } catch (error) {
    return null
  }
}

/**
 * Create a new session for a user
 */
export async function createSession(user: { userId: string; email: string }): Promise<Session> {
  // In real implementation, this would use Better Auth's session creation
  // For now, return a mock session
  return {
    userId: user.userId,
    email: user.email,
    token: `session-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }
}

/**
 * Get cookie options for sessions
 */
export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  }
}