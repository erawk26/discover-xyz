import { NextResponse } from 'next/server'
import { Pool } from 'pg'

export async function GET() {
  const checks = {
    service: 'healthy',
    database: 'unknown',
    timestamp: new Date().toISOString(),
  }

  try {
    // Check database connectivity if DATABASE_URI is set
    if (process.env.DATABASE_URI) {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URI,
        max: 1,
        connectionTimeoutMillis: 5000,
      })
      
      try {
        const result = await pool.query('SELECT NOW()')
        if (result.rows.length > 0) {
          checks.database = 'healthy'
        }
      } catch (dbError) {
        console.error('Database health check failed:', dbError)
        checks.database = 'unhealthy'
      } finally {
        await pool.end()
      }
    } else {
      checks.database = 'not_configured'
    }

    // If database is required and unhealthy, return 503
    if (checks.database === 'unhealthy') {
      return NextResponse.json(
        { 
          status: 'degraded',
          ...checks,
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { 
        status: 'healthy',
        ...checks,
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        ...checks,
      },
      { status: 503 }
    )
  }
}

// Support HEAD requests for lighter health checks
export async function HEAD() {
  return new Response(null, { status: 200 })
}