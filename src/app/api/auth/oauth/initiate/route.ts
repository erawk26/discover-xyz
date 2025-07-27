import { NextRequest, NextResponse } from 'next/server'
import { initiateOAuthFlow } from '@/lib/auth/oauth-providers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider, redirectTo } = body

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      )
    }

    const result = await initiateOAuthFlow(provider, {
      redirectTo: redirectTo || '/admin',
      request,
    })

    return NextResponse.json({
      success: true,
      url: result.url,
      state: result.state,
    })
  } catch (error) {
    console.error('OAuth initiation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'OAuth initiation failed' },
      { status: 500 }
    )
  }
}