import { NextResponse } from 'next/server'
import { getBetterAuthSession, syncBetterAuthToPayload } from '@/lib/better-auth/payload-sync'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  try {
    // Get Better Auth session
    const session = await getBetterAuthSession()
    
    if (!session?.user) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }

    // Sync with Payload
    const payloadUser = await syncBetterAuthToPayload(session.user)

    // Create Payload session cookie
    const payloadToken = Buffer.from(JSON.stringify({
      id: payloadUser.id,
      email: payloadUser.email,
      collection: 'users'
    })).toString('base64')

    const cookieStore = await cookies()
    cookieStore.set('payload-token', payloadToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    // Redirect to admin
    return NextResponse.redirect(new URL('/admin', request.url))
  } catch (error) {
    console.error('Error syncing session:', error)
    return NextResponse.redirect(new URL('/sign-in?error=sync_failed', request.url))
  }
}