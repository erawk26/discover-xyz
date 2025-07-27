import { NextRequest, NextResponse } from 'next/server'
import { handleOAuthCallback } from '@/lib/auth/oauth-providers'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params
    const searchParams = request.nextUrl.searchParams
    
    // Handle OAuth callback
    const result = await handleOAuthCallback(provider, {
      code: searchParams.get('code') || undefined,
      state: searchParams.get('state') || undefined,
      error: searchParams.get('error') || undefined,
      error_description: searchParams.get('error_description') || undefined,
      request,
    })

    if (!result.success) {
      // Redirect to login with error
      const url = new URL('/login', request.url)
      url.searchParams.set('error', result.error || 'OAuth failed')
      return NextResponse.redirect(url)
    }

    // Create or update user in Better Auth
    const { user: oauthUser } = result
    
    // Get Payload instance
    const payload = await getPayload({ config })
    
    // Determine role based on email domain
    const isMilesPartnership = oauthUser.email.toLowerCase().endsWith('@milespartnership.com')
    const role = isMilesPartnership ? 'content-editor' : 'authenticated'
    
    // Find or create Payload user
    const existingUsers = await payload.find({
      collection: 'users',
      where: {
        or: [
          { email: { equals: oauthUser.email } },
          { oauth_id: { equals: `${oauthUser.provider}-${oauthUser.providerId}` } },
        ],
      },
      limit: 1,
    })
    
    let payloadUser
    if (existingUsers.docs.length > 0) {
      // Update existing user
      payloadUser = await payload.update({
        collection: 'users',
        id: existingUsers.docs[0].id,
        data: {
          name: oauthUser.name || existingUsers.docs[0].name,
          oauth_provider: oauthUser.provider,
          oauth_id: `${oauthUser.provider}-${oauthUser.providerId}`,
        },
      })
    } else {
      // Create new user with a secure password
      const crypto = await import('crypto')
      const tempPassword = crypto.randomBytes(32).toString('hex')
      
      payloadUser = await payload.create({
        collection: 'users',
        data: {
          email: oauthUser.email,
          name: oauthUser.name,
          password: tempPassword, // Store the password for login
          role,
          oauth_provider: oauthUser.provider,
          oauth_id: `${oauthUser.provider}-${oauthUser.providerId}`,
        },
      })
    }
    
    // Create a Payload session for the OAuth user
    const sessionResponse = await fetch(`${request.nextUrl.origin}/api/auth/oauth-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: payloadUser.email,
      }),
    })
    
    if (!sessionResponse.ok) {
      const error = await sessionResponse.text()
      console.error('Session creation failed:', error)
      throw new Error('Failed to create session')
    }
    
    const sessionData = await sessionResponse.json()
    
    console.log('OAuth session created:', {
      email: sessionData.user.email,
      role: sessionData.user.role,
      hasToken: !!sessionData.token,
    })
    
    // Get the set-cookie header from the session response
    const setCookieHeader = sessionResponse.headers.get('set-cookie')
    
    const response = NextResponse.redirect(new URL('/admin', request.url))
    
    // Forward the cookie from the session response
    if (setCookieHeader) {
      response.headers.set('set-cookie', setCookieHeader)
    } else {
      // Fallback: manually set the token cookie
      response.cookies.set('payload-token', sessionData.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }
    
    console.log('OAuth user authenticated:', {
      email: payloadUser.email,
      role: payloadUser.role,
      provider: oauthUser.provider,
    })
    
    return response
  } catch (error) {
    console.error('OAuth callback error:', error)
    
    const url = new URL('/login', request.url)
    url.searchParams.set('error', 'OAuth callback failed')
    return NextResponse.redirect(url)
  }
}