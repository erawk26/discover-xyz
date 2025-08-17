import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Basic health check - return environment info for debugging
    const response = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        // Check if critical environment variables are present (don't expose values)
        has_database_uri: !!process.env.DATABASE_URI,
        has_payload_secret: !!process.env.PAYLOAD_SECRET,
        has_better_auth_secret: !!process.env.BETTER_AUTH_SECRET,
        has_server_url: !!process.env.NEXT_PUBLIC_SERVER_URL,
        // Show first few chars of DATABASE_URI to verify format (not the password)
        database_uri_prefix: process.env.DATABASE_URI ? 
          process.env.DATABASE_URI.substring(0, 20) + '...' : 'NOT SET',
      },
      missing: []
    }
    
    // List missing critical variables
    if (!process.env.DATABASE_URI) response.missing.push('DATABASE_URI')
    if (!process.env.PAYLOAD_SECRET) response.missing.push('PAYLOAD_SECRET')
    if (!process.env.BETTER_AUTH_SECRET) response.missing.push('BETTER_AUTH_SECRET')
    
    if (response.missing.length > 0) {
      response.status = 'unhealthy'
    }
    
    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}