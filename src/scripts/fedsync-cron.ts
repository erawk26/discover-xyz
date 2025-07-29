#!/usr/bin/env node

/**
 * FedSync Cron Job
 * 
 * Automated sync and import of FedSync data
 * Can be run via cron, GitHub Actions, or other schedulers
 */

import 'dotenv/config'
import { spawn } from 'child_process'
import { Logger, LogLevel } from 'fedsync-standalone/logger'

// Initialize logger
const logger = new Logger('FedSyncCron', LogLevel.INFO)

// Execute command with proper error handling
function executeCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    logger.info(`Executing: ${command} ${args.join(' ')}`)
    
    const child = spawn(command, args, {
      stdio: 'pipe',
      shell: true
    })
    
    child.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(Boolean)
      lines.forEach((line: string) => logger.info(`  ${line}`))
    })
    
    child.stderr.on('data', (data) => {
      const lines = data.toString().split('\n').filter(Boolean)
      lines.forEach((line: string) => logger.error(`  ${line}`))
    })
    
    child.on('close', (code) => {
      if (code === 0) {
        logger.info(`✓ Command completed successfully`)
        resolve()
      } else {
        const error = `Command failed with exit code ${code}`
        logger.error(error)
        reject(new Error(error))
      }
    })
    
    child.on('error', (error) => {
      logger.error(`Failed to execute command: ${error.message}`)
      reject(error)
    })
  })
}

// Main cron job
async function runFedSyncCron() {
  logger.info('=== Starting FedSync Cron Job ===')
  
  try {
    // Step 1: Sync data from API
    logger.info('Step 1: Syncing data from FedSync API...')
    await executeCommand('pnpm', ['sync'])
    
    // Optional: Add delay between sync and import
    const delaySeconds = parseInt(process.env.FEDSYNC_CRON_DELAY || '5')
    if (delaySeconds > 0) {
      logger.info(`Waiting ${delaySeconds} seconds before import...`)
      await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000))
    }
    
    // Step 2: Import data to Payload CMS
    logger.info('Step 2: Importing data to Payload CMS...')
    await executeCommand('pnpm', ['import'])
    
    logger.info('=== FedSync Cron Job Completed Successfully ===')
    
    // Send success notification if webhook configured
    if (process.env.FEDSYNC_WEBHOOK_SUCCESS) {
      await sendWebhook(process.env.FEDSYNC_WEBHOOK_SUCCESS, {
        status: 'success',
        message: 'FedSync cron job completed successfully',
        timestamp: new Date().toISOString()
      })
    }
    
    process.exit(0)
  } catch (error) {
    logger.error('=== FedSync Cron Job Failed ===')
    logger.error(`Error: ${error instanceof Error ? error.message : String(error)}`)
    
    // Send failure notification if webhook configured
    if (process.env.FEDSYNC_WEBHOOK_FAILURE) {
      await sendWebhook(process.env.FEDSYNC_WEBHOOK_FAILURE, {
        status: 'failure',
        message: `FedSync cron job failed: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      })
    }
    
    process.exit(1)
  }
}

// Send webhook notification
async function sendWebhook(url: string, data: any) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      logger.error(`Webhook notification failed: ${response.statusText}`)
    }
  } catch (error) {
    logger.error(`Failed to send webhook: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Run the cron job
runFedSyncCron().catch((error) => {
  console.error('Unexpected error:', error)
  process.exit(1)
})