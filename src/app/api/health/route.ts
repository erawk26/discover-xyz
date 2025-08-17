import { NextResponse } from 'next/server'

export async function GET() {
  // Basic health check - return environment info for debugging
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      // Check if critical environment variables are present (don't expose values)
      has_database_uri: !!process.env.DATABASE_URI,
      has_payload_secret: !!process.env.PAYLOAD_SECRET,
      has_server_url: !!process.env.NEXT_PUBLIC_SERVER_URL,
    }
  })
}