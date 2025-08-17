// Minimal health check with no imports that could cause initialization
export async function GET() {
  return new Response(JSON.stringify({
    status: 'pong',
    timestamp: new Date().toISOString(),
    env: {
      has_db: !!process.env.DATABASE_URI,
      has_secret: !!process.env.PAYLOAD_SECRET,
      port: process.env.PORT || 'not set'
    }
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}