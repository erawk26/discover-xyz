import { NextRequest, NextResponse } from 'next/server'

// Import the jobs Map from the main route (in production, use Redis or database)
// For now, we'll use a simple in-memory store shared across files
declare global {
  var fedSyncJobs: Map<string, {
    id: string
    jobId: string
    status: 'pending' | 'syncing' | 'running' | 'completed' | 'failed'
    phase?: 'initializing' | 'syncing' | 'importing' | 'done'
    progress?: number
    message?: string
    startTime: string
    syncStartTime?: string
    syncEndTime?: string
    syncDuration?: string
    importStartTime?: string
    importDuration?: string
    totalDuration?: string
    endTime?: string
    stats?: {
      categories: { processed: number; imported: number; errors: number }
      events: { processed: number; imported: number; errors: number }
      profiles: { processed: number; imported: number; errors: number }
    }
    error?: string
    logFile?: string
  }> | undefined
}

// Initialize global jobs store if it doesn't exist
if (!global.fedSyncJobs) {
  global.fedSyncJobs = new Map()
}

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get('jobId')
  
  if (!jobId) {
    // Return all jobs
    const allJobs = Array.from(global.fedSyncJobs?.values() || [])
      .map(job => ({
        ...job,
        startTime: job.startTime || new Date().toISOString(),
        endTime: job.endTime
      }))
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 10) // Last 10 jobs
    
    return NextResponse.json({ jobs: allJobs })
  }
  
  const job = global.fedSyncJobs?.get(jobId)
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }
  
  // Convert dates to ISO strings if they're Date objects
  const jobData = {
    ...job,
    startTime: job.startTime || new Date().toISOString(),
    endTime: job.endTime
  }
  
  return NextResponse.json(jobData)
}