import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

/**
 * Create a Payload session for OAuth users
 * This endpoint is called after successful OAuth authentication
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }
    
    const payload = await getPayload({ config })
    
    // Find the user by email
    const users = await payload.find({
      collection: 'users',
      where: {
        email: { equals: email },
      },
      limit: 1,
    })
    
    if (users.docs.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    const user = users.docs[0]
    
    // Create a known temporary password for OAuth login
    const tempPassword = `oauth_${user.id}_${Date.now()}`
    
    // Update user with temporary password
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        password: tempPassword,
      },
    })
    
    // Now login with the temporary password
    const loginResult = await payload.login({
      collection: 'users',
      data: {
        email: user.email,
        password: tempPassword,
      },
      req: {
        payload,
        headers: request.headers,
      } as any,
    })
    
    console.log('OAuth session created:', {
      email: user.email,
      role: user.role,
      hasToken: !!loginResult.token,
    })
    
    // Return the login result
    const response = NextResponse.json({
      user: loginResult.user,
      token: loginResult.token,
      exp: loginResult.exp,
    })
    
    // Set the payload-token cookie
    response.cookies.set('payload-token', loginResult.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    
    return response
  } catch (error) {
    console.error('OAuth session error:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}