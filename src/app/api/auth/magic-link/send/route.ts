import { NextRequest, NextResponse } from 'next/server'
import { initiateMagicLinkFlow } from '@/lib/auth/magic-links'

// Mock email service for testing
const mockEmailService = {
  sendEmail: async (params: any) => {
    console.log('Sending magic link email:', params.to)
    // In production, use real email service (SendGrid, Resend, etc.)
    return { success: true }
  },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, redirectTo } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    const result = await initiateMagicLinkFlow({
      email,
      redirectTo,
      emailService: mockEmailService,
      baseUrl: process.env.BETTER_AUTH_URL || 'http://localhost:3026',
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send magic link' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    })
  } catch (error) {
    console.error('Magic link error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}