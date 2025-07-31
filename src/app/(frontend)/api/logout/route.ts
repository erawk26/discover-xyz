import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/better-auth'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    // Clear Better Auth session
    await auth.api.signOut({
      headers: req.headers,
    })

    // Clear Payload session cookies
    const cookieStore = await cookies()
    cookieStore.delete('payload-token')
    
    // Clear any other auth-related cookies
    const authCookies = ['better-auth.session', 'better-auth.session_data', 'payload-token']
    authCookies.forEach(cookieName => {
      cookieStore.delete(cookieName)
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Logout error:', error)
    // Even if there's an error, we should clear cookies
    const cookieStore = await cookies()
    cookieStore.delete('payload-token')
    cookieStore.delete('better-auth.session')
    cookieStore.delete('better-auth.session_data')
    
    return NextResponse.json({ success: true }, { status: 200 })
  }
}

export async function GET(req: NextRequest) {
  // Handle GET requests (like from /admin/logout)
  try {
    // Clear Better Auth session
    await auth.api.signOut({
      headers: req.headers,
    })

    // Clear Payload session cookies
    const cookieStore = await cookies()
    cookieStore.delete('payload-token')
    
    // Clear any other auth-related cookies
    const authCookies = ['better-auth.session', 'better-auth.session_data', 'payload-token']
    authCookies.forEach(cookieName => {
      cookieStore.delete(cookieName)
    })

    // Redirect to login page
    return NextResponse.redirect(new URL('/admin/login', req.url))
  } catch (error) {
    console.error('Logout error:', error)
    // Even if there's an error, we should clear cookies and redirect
    const cookieStore = await cookies()
    cookieStore.delete('payload-token')
    cookieStore.delete('better-auth.session')
    cookieStore.delete('better-auth.session_data')
    
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }
}