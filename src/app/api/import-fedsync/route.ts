import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getPayload } from 'payload'
import config from '@payload-config'
import { execSync } from 'child_process'
import { ImportOrchestrator } from '@/scripts/import-fedsync/importers/import-orchestrator'

// Declare and use global jobs store
declare global {
  var fedSyncJobs:
    | Map<
        string,
        {
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
        }
      >
    | undefined
}

// Initialize global jobs store if it doesn't exist
if (!global.fedSyncJobs) {
  global.fedSyncJobs = new Map()
}

export async function POST(req: NextRequest) {
  try {
    // Get the payload instance to check auth
    const payload = await getPayload({ config })

    // Check if user is authenticated (you might want to check for admin role)
    const { user } = await payload.auth({ headers: req.headers })
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse options from request
    const options = await req.json()
    const jobId = randomUUID()

    // Create job entry
    global.fedSyncJobs!.set(jobId, {
      id: jobId,
      jobId: jobId,
      status: 'pending',
      phase: 'initializing',
      startTime: new Date().toISOString(),
      message: 'Import job queued',
    })

    // Start the import process in the background using setImmediate for true async
    setImmediate(async () => {
      const job = global.fedSyncJobs!.get(jobId)!
      job.status = 'running'
      job.phase = 'syncing'
      job.message = 'Starting FedSync import...'

      try {
        // First run sync if requested
        if (options.syncFirst) {
          job.status = 'syncing'
          job.phase = 'syncing'
          job.message = 'Syncing fresh data from FedSync API...'
          job.syncStartTime = new Date().toISOString()

          try {
            // Run fedsync sync command
            execSync('pnpm sync', {
              encoding: 'utf8',
              stdio: 'pipe',
            })
          } catch (syncError) {
            console.log('Sync warning:', syncError)
            // Continue even if sync has warnings
          }

          job.syncEndTime = new Date().toISOString()
          job.syncDuration = calculateDuration(job.syncStartTime, job.syncEndTime)
        }

        // Now run the import using the orchestrator directly
        job.status = 'running'
        job.phase = 'importing'
        job.message = 'Running import...'
        job.importStartTime = new Date().toISOString()

        // Create and run the import orchestrator with options
        const orchestrator = new ImportOrchestrator({
          skipCategories: options.skipCategories || false,
          skipEvents: options.skipEvents || false,
          skipProfiles: options.skipProfiles || false,
          dryRun: options.dryRun || false,
          batchSize: options.batchSize || 50,
          concurrency: options.concurrency || 5,
          logFile: `/tmp/fedsync-import-${jobId}.log`,
        })

        // Initialize Payload connection
        await orchestrator.initialize()

        // Run the import with the data path
        const dataPath = process.env.FEDSYNC_DATA_PATH || 'data/fedsync'
        const results = await orchestrator.runImport(dataPath, {
          skipCategories: options.skipCategories || false,
          skipEvents: options.skipEvents || false,
          skipProfiles: options.skipProfiles || false,
          dryRun: options.dryRun || false,
          batchSize: options.batchSize || 50,
          concurrency: options.concurrency || 5,
        })

        const importEndTime = new Date().toISOString()
        job.importDuration = calculateDuration(job.importStartTime, importEndTime)

        // Mark as completed
        job.status = 'completed'
        job.phase = 'done'
        job.progress = 100
        job.message = 'Import completed successfully'
        job.endTime = importEndTime
        job.totalDuration = calculateDuration(job.startTime, job.endTime)

        // Add real stats from the import results (runImport returns ImportStats)
        job.stats = {
          categories: results.categories,
          events: results.events,
          profiles: results.profiles,
        }

        // Add log file path if it was created
        job.logFile = `/tmp/fedsync-import-${jobId}.log`
      } catch (error) {
        job.status = 'failed'
        job.error = error instanceof Error ? error.message : 'Import failed'
        job.endTime = new Date().toISOString()
        job.totalDuration = calculateDuration(job.startTime, job.endTime)
      }
    })

    return NextResponse.json({
      jobId,
      message: 'Import job started',
      status: 'pending',
    })
  } catch (error) {
    console.error('Failed to start import:', error)
    return NextResponse.json({ error: 'Failed to start import' }, { status: 500 })
  }
}

// GET endpoint to check job status (simple version, full version in status/route.ts)
export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get('jobId')

  if (!jobId) {
    // Return all jobs
    const allJobs = Array.from(global.fedSyncJobs?.values() || [])
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 10) // Last 10 jobs

    return NextResponse.json({ jobs: allJobs })
  }

  const job = global.fedSyncJobs?.get(jobId)
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  return NextResponse.json(job)
}

// Helper function to calculate duration
function calculateDuration(start: string, end: string): string {
  const duration = new Date(end).getTime() - new Date(start).getTime()
  const seconds = Math.floor(duration / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}
