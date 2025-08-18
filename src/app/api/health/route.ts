import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Simple health check without database dependency
    // Railway just needs a 200 response to know the service is up
    return NextResponse.json(
      { 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'payload-cms',
        environment: process.env.NODE_ENV || 'production'
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}

// Support HEAD requests for lighter health checks
export async function HEAD() {
  return new Response(null, { status: 200 })
}