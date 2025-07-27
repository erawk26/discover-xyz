import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getBetterAuthSession } from '@/lib/better-auth/payload-sync'
import { getPayload } from 'payload'
import config from '@/payload.config'
import jwt from 'jsonwebtoken'

export async function GET() {
  try {
    // Get Better Auth session
    const session = await getBetterAuthSession()
    
    console.log('OAuth Success - Better Auth session:', session)
    
    if (!session?.user) {
      console.log('OAuth Success - No session found')
      return NextResponse.redirect(new URL('/sign-in', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3026'))
    }

    const payload = await getPayload({ config })
    
    // Check if user exists in Payload
    const existingUsers = await payload.find({
      collection: 'users',
      where: {
        email: { equals: session.user.email }
      },
      limit: 1
    })
    
    let payloadUser
    
    if (existingUsers.docs.length > 0) {
      // Update existing user
      payloadUser = existingUsers.docs[0]
    } else {
      // Check if this is the first user
      const userCount = await payload.count({
        collection: 'users'
      })
      
      // Create new user
      const crypto = await import('crypto')
      const tempPassword = crypto.randomBytes(32).toString('hex')
      
      payloadUser = await payload.create({
        collection: 'users',
        data: {
          email: session.user.email,
          name: session.user.name || session.user.email.split('@')[0],
          password: tempPassword,
          role: userCount.totalDocs === 0 ? 'admin' : session.user.role || 'authenticated',
        }
      })
    }
    
    console.log('OAuth Success - Payload user:', payloadUser.id, payloadUser.email)
    
    // Generate Payload JWT token - matching Payload's format exactly
    const token = jwt.sign(
      {
        id: payloadUser.id,
        email: payloadUser.email,
        collection: 'users',
        tokenVersion: payloadUser._verificationToken || 1,
      },
      process.env.PAYLOAD_SECRET!,
      {
        expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
      }
    )
    
    // Set Payload cookie - matching Payload's cookie settings
    const cookieStore = await cookies()
    cookieStore.set('payload-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax', // Capital 'L' to match Payload
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      domain: undefined,
    })
    
    return NextResponse.redirect(new URL('/admin', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3026'))
  } catch (error) {
    console.error('OAuth success error:', error)
    return NextResponse.redirect(new URL('/sign-in?error=oauth_failed', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3026'))
  }
}