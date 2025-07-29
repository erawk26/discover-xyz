/**
 * Payload Custom Endpoint: Import FedSync
 * Non-blocking implementation using Payload's local API
 */

import { Endpoint } from 'payload'
import { ImportOrchestrator, ImportOptions } from '../../scripts/import-fedsync/importers/import-orchestrator'
import { LogLevel } from 'fedsync-standalone/logger'
import path from 'path'

// Track running imports
const importJobs = new Map<string, {
  status: 'pending' | 'running' | 'completed' | 'failed'
  startTime: Date
  endTime?: Date
  stats?: any
  error?: string
}>()

interface ImportRequestBody {
  dataPath?: string
  batchSize?: number
  concurrency?: number
  skipCategories?: boolean
  skipEvents?: boolean
  skipProfiles?: boolean
  dryRun?: boolean
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
}

export const importFedSyncEndpoint: Endpoint = {
  path: '/import-fedsync',
  method: 'post',
  handler: async (req) => {
    // Security check - require authentication for non-local requests
    const host = req.headers.get('host') || ''
    const isLocalRequest = host.includes('localhost') || host.includes('127.0.0.1')
    
    // Allow local requests without authentication (for scripts)
    // Require authentication for all other requests
    if (!isLocalRequest && !req.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    // Parse JSON body if needed
    let body: ImportRequestBody = {}
    if (req.body && typeof req.body === 'object' && !(req.body instanceof ReadableStream)) {
      body = req.body as ImportRequestBody
    } else if (req.body instanceof ReadableStream) {
      // Handle streaming body
      const reader = req.body.getReader()
      const chunks: Uint8Array[] = []
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
      }
      
      const bodyText = new TextDecoder().decode(Buffer.concat(chunks))
      try {
        body = JSON.parse(bodyText)
      } catch (e) {
        body = {}
      }
    }
    
    const {
      dataPath = path.resolve(process.cwd(), 'data/fedsync'),
      batchSize = 50,
      concurrency = 5,
      skipCategories = false,
      skipEvents = false,
      skipProfiles = false,
      dryRun = false,
      logLevel = 'info'
    } = body

    // Generate job ID
    const jobId = `import-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    
    // Initialize job status
    importJobs.set(jobId, {
      status: 'pending',
      startTime: new Date()
    })

    // Run import asynchronously (non-blocking)
    process.nextTick(async () => {
      const job = importJobs.get(jobId)!
      job.status = 'running'
      
      try {
        const importOptions: ImportOptions = {
          batchSize,
          concurrency,
          dryRun,
          skipCategories,
          skipEvents,
          skipProfiles,
          logLevel: logLevel === 'debug' ? LogLevel.DEBUG :
                   logLevel === 'warn' ? LogLevel.WARN :
                   logLevel === 'error' ? LogLevel.ERROR : LogLevel.INFO,
          logFile: `logs/import-${jobId}.log`  // Create unique log file for each import
        }

        const orchestrator = new ImportOrchestrator(importOptions)
        await orchestrator.initialize()
        const stats = await orchestrator.runImport(dataPath, importOptions)
        await orchestrator.cleanup()

        // Update job status
        job.status = 'completed'
        job.stats = stats
        job.endTime = new Date()
      } catch (error: any) {
        // Update job status with error
        job.status = 'failed'
        job.error = error.message
        job.endTime = new Date()
      }
    })

    // Return immediately
    return Response.json({
      success: true,
      jobId,
      message: 'Import job started',
      checkStatus: `/api/import-fedsync/status?jobId=${jobId}`,
      logFile: `logs/import-${jobId}.log`
    })
  }
}

// Status check endpoint
export const importFedSyncStatusEndpoint: Endpoint = {
  path: '/import-fedsync/status',
  method: 'get',
  handler: async (req) => {
    // Security check - require authentication for non-local requests
    const host = req.headers.get('host') || ''
    const isLocalRequest = host.includes('localhost') || host.includes('127.0.0.1')
    
    // Allow local requests without authentication (for scripts)
    // Require authentication for all other requests
    if (!isLocalRequest && !req.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    const url = new URL(req.url || '', `http://${req.headers.get('host') || 'localhost'}`)
    const jobId = url.searchParams.get('jobId')
    
    if (!jobId) {
      // Return all jobs
      const jobs = Array.from(importJobs.entries()).map(([id, data]) => ({
        jobId: id,
        ...data
      }))
      return Response.json({ jobs })
    }
    
    const job = importJobs.get(jobId)
    if (!job) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    return Response.json({
      jobId,
      ...job,
      logFile: `logs/import-${jobId}.log`
    })
  }
}