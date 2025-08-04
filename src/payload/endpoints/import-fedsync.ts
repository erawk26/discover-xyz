/**
 * Payload Custom Endpoint: Import FedSync
 * Non-blocking implementation using Payload's local API
 */

import { Endpoint } from 'payload'
import { ImportOrchestrator, ImportOptions } from '../../scripts/import-fedsync/importers/import-orchestrator'
import { LogLevel } from 'fedsync-standalone/logger'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'

// Track running imports
const importJobs = new Map<string, {
  status: 'pending' | 'syncing' | 'running' | 'completed' | 'failed'
  phase: 'initializing' | 'syncing' | 'importing' | 'done'
  startTime: Date
  syncStartTime?: Date
  syncEndTime?: Date
  importStartTime?: Date
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
  syncFirst?: boolean  // New parameter to control syncing
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
    
    // Validate and sanitize input
    const dataPath = body.dataPath 
      ? path.resolve(process.cwd(), body.dataPath)
      : path.resolve(process.cwd(), 'data/fedsync')
    
    // Prevent path traversal attacks
    const normalizedPath = path.normalize(dataPath)
    const cwd = process.cwd()
    if (!normalizedPath.startsWith(cwd)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid data path - path traversal detected' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Validate numeric inputs
    const batchSize = Math.min(Math.max(parseInt(String(body.batchSize)) || 50, 1), 1000)
    const concurrency = Math.min(Math.max(parseInt(String(body.concurrency)) || 5, 1), 20)
    
    // Validate boolean inputs
    const skipCategories = Boolean(body.skipCategories)
    const skipEvents = Boolean(body.skipEvents)
    const skipProfiles = Boolean(body.skipProfiles)
    const dryRun = Boolean(body.dryRun)
    // Default syncFirst to true for API calls (false maintains CLI compatibility)
    const syncFirst = body.syncFirst !== false
    
    // Validate log level
    const validLogLevels = ['debug', 'info', 'warn', 'error']
    const logLevel = validLogLevels.includes(body.logLevel || '') 
      ? body.logLevel as 'debug' | 'info' | 'warn' | 'error'
      : 'info'
    
    // Check if data directory exists
    if (!fs.existsSync(normalizedPath)) {
      return new Response(JSON.stringify({ 
        error: `Data directory not found: ${normalizedPath}` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Generate job ID
    const jobId = `import-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    
    // Initialize job status
    importJobs.set(jobId, {
      status: 'pending',
      phase: 'initializing',
      startTime: new Date()
    })

    // Run import asynchronously (non-blocking)
    process.nextTick(async () => {
      const job = importJobs.get(jobId)!
      
      try {
        // Step 1: Sync fresh data if requested
        if (syncFirst) {
          job.status = 'syncing'
          job.phase = 'syncing'
          job.syncStartTime = new Date()
          
          console.log(`[${jobId}] Starting FedSync data synchronization...`)
          
          try {
            // Execute the sync command
            execSync('pnpm run sync', {
              cwd: process.cwd(),
              stdio: 'inherit',  // This will show sync output in console
              encoding: 'utf8'
            })
            
            job.syncEndTime = new Date()
            console.log(`[${jobId}] Sync completed successfully`)
          } catch (syncError: any) {
            throw new Error(`Sync failed: ${syncError.message}`)
          }
        }
        
        // Step 2: Import the data
        job.status = 'running'
        job.phase = 'importing'
        job.importStartTime = new Date()
        
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
        job.phase = 'done'
        job.stats = stats
        job.endTime = new Date()
      } catch (error: any) {
        // Update job status with error
        job.status = 'failed'
        job.phase = 'done'
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
    
    // Calculate durations
    const response: any = {
      jobId,
      ...job,
      logFile: `logs/import-${jobId}.log`
    }
    
    // Add duration calculations
    if (job.syncStartTime && job.syncEndTime) {
      response.syncDuration = Math.round((job.syncEndTime.getTime() - job.syncStartTime.getTime()) / 1000) + 's'
    }
    if (job.importStartTime && job.endTime) {
      response.importDuration = Math.round((job.endTime.getTime() - job.importStartTime.getTime()) / 1000) + 's'
    }
    if (job.startTime && job.endTime) {
      response.totalDuration = Math.round((job.endTime.getTime() - job.startTime.getTime()) / 1000) + 's'
    }
    
    return Response.json(response)
  }
}