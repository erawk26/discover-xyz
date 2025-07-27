import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from './session'

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/account', '/admin']

// Routes that should skip middleware
const SKIP_ROUTES = ['/api', '/_next', '/static', '/favicon.ico']

/**
 * Session middleware to protect authenticated routes
 */
export async function sessionMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for certain routes
  if (SKIP_ROUTES.some(route => pathname.startsWith(route))) {
    return
  }

  // Check if route requires authentication
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  
  if (!isProtectedRoute) {
    return // Allow access to public routes
  }

  // Validate session for protected routes
  const session = await validateSession(request)
  
  if (!session) {
    // Redirect to login if no valid session
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url, { status: 302 })
  }

  // Allow access if session is valid
  return
}