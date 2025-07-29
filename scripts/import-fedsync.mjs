#!/usr/bin/env node

/**
 * FedSync import script
 * Runs fedsync sync first (by default), then imports to Payload CMS
 */

import http from 'http'
import { URL } from 'url'
import { spawn } from 'child_process'
import { Logger, LogLevel } from 'fedsync-standalone/logger'

// Initialize logger
const logger = new Logger({
  level: process.argv.includes('--debug') ? LogLevel.DEBUG : LogLevel.INFO,
  colors: true,
  timestamp: true
})

// Parse command line arguments
const args = process.argv.slice(2)
const options = {
  dataPath: 'data/fedsync',
  batchSize: 50,
  concurrency: 5,
  skipCategories: false,
  skipEvents: false,
  skipProfiles: false,
  dryRun: false,
  logLevel: 'info',
  importOnly: false  // New option to skip fedsync
}

// Simple argument parsing
for (let i = 0; i < args.length; i++) {
  const arg = args[i]
  if (arg === '--dry-run') options.dryRun = true
  else if (arg === '--import-only') options.importOnly = true
  else if (arg === '--skip-categories') options.skipCategories = true
  else if (arg === '--skip-events') options.skipEvents = true
  else if (arg === '--skip-profiles') options.skipProfiles = true
  else if (arg === '--batch-size' && args[i + 1]) {
    options.batchSize = parseInt(args[++i])
  }
  else if (arg === '--concurrency' && args[i + 1]) {
    options.concurrency = parseInt(args[++i])
  }
  else if (arg === '--log-level' && args[i + 1]) {
    options.logLevel = args[++i]
  }
  else if (arg === '--help' || arg === '-h') {
    logger.info('FedSync Import Script\n')
    logger.info('Usage: pnpm import [options] [data-path]\n')
    logger.info('Options:')
    logger.info('  --import-only        Skip fedsync sync, only import existing data')
    logger.info('  --dry-run            Preview import without making changes')
    logger.info('  --skip-categories    Skip category import')
    logger.info('  --skip-events        Skip event import')
    logger.info('  --skip-profiles      Skip profile import')
    logger.info('  --batch-size <n>     Batch size for imports (default: 50)')
    logger.info('  --concurrency <n>    Number of concurrent operations (default: 5)')
    logger.info('  --log-level <level>  Log level: debug, info, warn, error (default: info)')
    logger.info('  --wait               Wait for import to complete')
    logger.info('  --help, -h           Show this help message\n')
    logger.info('Examples:')
    logger.info('  pnpm import                       # Sync + import everything')
    logger.info('  pnpm import --import-only         # Import only, skip sync')
    logger.info('  pnpm import --dry-run             # Preview what would be imported')
    logger.info('  pnpm import --wait                # Wait for completion')
    process.exit(0)
  }
  else if (!arg.startsWith('--')) {
    options.dataPath = arg
  }
}

// Function to run fedsync
async function runFedSync() {
  return new Promise((resolve, reject) => {
    logger.info('🔄 Running fedsync --all to sync data...')
    
    const fedsync = spawn('fedsync', ['--all'], {
      stdio: 'inherit',  // Inherit stdio to show fedsync output
      shell: true
    })
    
    fedsync.on('close', (code) => {
      if (code === 0) {
        logger.info('✅ FedSync completed successfully')
        resolve()
      } else {
        logger.error(`❌ FedSync failed with exit code ${code}`)
        reject(new Error(`FedSync failed with exit code ${code}`))
      }
    })
    
    fedsync.on('error', (err) => {
      logger.error('❌ Failed to run fedsync:', err.message)
      reject(err)
    })
  })
}

// Main execution
async function main() {
  try {
    // Run fedsync first unless --import-only is specified
    if (!options.importOnly) {
      await runFedSync()
      logger.info('')  // Empty line for separation
    } else {
      logger.info('⏩ Skipping fedsync sync (--import-only specified)')
    }
    
    // Now run the import
    await runImport()
  } catch (error) {
    logger.error('❌ Process failed:', error.message)
    process.exit(1)
  }
}

// Function to run import (moved existing code here)
async function runImport() {

  const payload = JSON.stringify({
    dataPath: options.dataPath,
    batchSize: options.batchSize,
    concurrency: options.concurrency,
    skipCategories: options.skipCategories,
    skipEvents: options.skipEvents,
    skipProfiles: options.skipProfiles,
    dryRun: options.dryRun,
    logLevel: options.logLevel
  })

  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || `http://localhost:${process.env.PORT || '3026'}`
  const url = new URL(`${baseUrl}/api/import-fedsync`)
  const requestOptions = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  }

  logger.info('🚀 Starting Payload CMS import...')
  logger.info('📁 Data path:', options.dataPath)
  logger.debug('⚙️  Options:', JSON.stringify(options))

  const req = http.request(requestOptions, (res) => {
    let data = ''
    
    res.on('data', (chunk) => {
      data += chunk
    })
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data)
        if (response.success) {
          logger.info('✅ Import job started successfully!')
          logger.info('🆔 Job ID:', response.jobId)
          logger.info('📊 Check status:', `${baseUrl}${response.checkStatus}`)
          
          // Optional: Poll for status
          if (args.includes('--wait')) {
            logger.info('⏳ Waiting for import to complete...')
            pollStatus(response.jobId)
          }
        } else {
          logger.error('❌ Failed to start import:', response.error)
          process.exit(1)
        }
      } catch (error) {
        logger.error('❌ Failed to parse response:', error.message)
        logger.error('Response:', data)
        process.exit(1)
      }
    })
  })

  req.on('error', (error) => {
    logger.error('❌ Request failed:', error.message)
    logger.error('💡 Make sure Payload CMS is running on', baseUrl)
    process.exit(1)
  })

  req.write(payload)
  req.end()
}

// Function to poll status
function pollStatus(jobId) {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || `http://localhost:${process.env.PORT || '3026'}`
  const statusUrl = `${baseUrl}/api/import-fedsync/status?jobId=${jobId}`
  
  const checkStatus = () => {
    http.get(statusUrl, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          const status = JSON.parse(data)
          
          if (status.status === 'completed') {
            logger.info('🎉 Import completed successfully!')
            logger.info('📊 Stats:', JSON.stringify(status.stats))
            process.exit(0)
          } else if (status.status === 'failed') {
            logger.error('❌ Import failed:', status.error)
            process.exit(1)
          } else {
            // Still running, check again in 2 seconds
            setTimeout(checkStatus, 2000)
          }
        } catch (error) {
          logger.error('❌ Failed to check status:', error.message)
          process.exit(1)
        }
      })
    }).on('error', (error) => {
      logger.error('❌ Status check failed:', error.message)
      process.exit(1)
    })
  }
  
  checkStatus()
}

// Start the main process
main()