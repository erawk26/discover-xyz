import { NextRequest, NextResponse } from 'next/server'
import { completeMagicLinkFlow } from '@/lib/auth/magic-links'
import { auth } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { findOrCreatePayloadUser } from '@/lib/auth/user-sync'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')
    const redirectTo = searchParams.get('redirectTo') || '/admin'

    if (!token) {
      return NextResponse.redirect(
        new URL(`/login?error=Missing+token`, request.url)
      )
    }

    // Complete magic link flow
    const result = await completeMagicLinkFlow({ token })

    if (!result.success) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(result.error || 'Invalid token')}`, request.url)
      )
    }

    // Get Payload instance and sync user
    const payload = await getPayload({ config })
    
    const payloadUser = await findOrCreatePayloadUser(
      {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        emailVerified: true, // Magic link verifies email
      },
      payload
    )

    // Create session with Better Auth
    const sessionResponse = await auth.api.signInEmail({
      body: {
        email: result.user.email,
        password: '', // Magic link doesn't use password
      },
      headers: request.headers,
    })

    // Redirect to dashboard or requested page
    const response = NextResponse.redirect(new URL(redirectTo, request.url))
    
    // Set session cookies if provided
    if (sessionResponse.headers) {
      const setCookie = sessionResponse.headers.get('set-cookie')
      if (setCookie) {
        response.headers.set('set-cookie', setCookie)
      }
    }

    return response
  } catch (error) {
    console.error('Magic link verification error:', error)
    return NextResponse.redirect(
      new URL('/login?error=Verification+failed', request.url)
    )
  }
}