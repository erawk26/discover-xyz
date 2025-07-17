#!/usr/bin/env node

/**
 * FedSync Import CLI
 * 
 * Command-line interface for the FedSync import system
 */

import { Command } from 'commander'
import chalk from 'chalk'
import { ImportOrchestrator, ImportOptions } from './importers/import-orchestrator'
import { Logger, LogLevel } from '@/lib/fedsync/src/logger'
import path from 'path'

const program = new Command()

program
  .name('fedsync-import')
  .description('Import FedSync data into Payload CMS')
  .version('1.0.0')

// Main import command
program
  .command('import')
  .description('Import FedSync data from JSON files')
  .argument('<data-path>', 'Path to FedSync data directory')
  .option('-c, --categories', 'Import categories only')
  .option('-e, --events', 'Import events only')
  .option('-p, --profiles', 'Import profiles only')
  .option('--skip-categories', 'Skip category import')
  .option('--skip-events', 'Skip event import')
  .option('--skip-profiles', 'Skip profile import')
  .option('--batch-size <size>', 'Batch size for imports', '50')
  .option('--concurrency <num>', 'Number of concurrent operations', '5')
  .option('--dry-run', 'Preview import without making changes')
  .option('--log-level <level>', 'Log level (debug, info, warn, error)', 'info')
  .option('--log-file <file>', 'Write logs to file')
  .action(async (dataPath: string, options: any) => {
    const logLevel = options.logLevel === 'debug' ? LogLevel.DEBUG :
                     options.logLevel === 'warn' ? LogLevel.WARN :
                     options.logLevel === 'error' ? LogLevel.ERROR :
                     LogLevel.INFO

    const logger = new Logger({ 
      level: logLevel,
      logToFile: !!options.logFile,
      logFile: options.logFile,
      colors: true,
      timestamp: true
    })

    try {
      // Validate data path
      const resolvedPath = path.resolve(dataPath)
      logger.info(`🎯 Starting FedSync import from: ${resolvedPath}`)

      // Configure import options
      const importOptions: ImportOptions = {
        batchSize: parseInt(options.batchSize),
        concurrency: parseInt(options.concurrency),
        dryRun: options.dryRun,
        logLevel: logLevel,
        logFile: options.logFile
      }

      // Handle selective imports
      if (options.categories || options.events || options.profiles) {
        importOptions.skipCategories = !options.categories
        importOptions.skipEvents = !options.events
        importOptions.skipProfiles = !options.profiles
      } else {
        // Use skip flags
        importOptions.skipCategories = options.skipCategories
        importOptions.skipEvents = options.skipEvents
        importOptions.skipProfiles = options.skipProfiles
      }

      if (options.dryRun) {
        logger.info(chalk.yellow('🧪 DRY RUN MODE - No data will be modified'))
      }

      // Initialize and run import
      const orchestrator = new ImportOrchestrator(importOptions)
      
      logger.info('🔌 Initializing Payload CMS connection...')
      await orchestrator.initialize()

      const stats = await orchestrator.runImport(resolvedPath, importOptions)

      // Success summary
      const totalImported = stats.categories.imported + stats.events.imported + stats.profiles.imported
      const totalErrors = stats.categories.errors + stats.events.errors + stats.profiles.errors

      if (totalErrors === 0) {
        logger.info(chalk.green(`\n🎉 Import completed successfully!`))
        logger.info(chalk.green(`✅ ${totalImported} items imported`))
      } else {
        logger.warn(chalk.yellow(`\n⚠️  Import completed with errors`))
        logger.warn(chalk.yellow(`✅ ${totalImported} items imported, ❌ ${totalErrors} errors`))
      }

      await orchestrator.cleanup()
      process.exit(0)

    } catch (error: any) {
      logger.error(chalk.red('\n💥 Import failed:'), error.message)
      
      if (options.logLevel === 'debug') {
        logger.error(error.stack)
      }
      
      process.exit(1)
    }
  })

// Status command
program
  .command('status')
  .description('Check import system status')
  .action(async () => {
    const logger = new Logger({ level: LogLevel.INFO })
    
    try {
      logger.info('🔍 Checking FedSync import system status...')
      
      const orchestrator = new ImportOrchestrator()
      await orchestrator.initialize()
      
      logger.info(chalk.green('✅ Payload CMS connection: OK'))
      logger.info(chalk.green('✅ Import system: Ready'))
      
      await orchestrator.cleanup()
      
    } catch (error: any) {
      logger.error(chalk.red('❌ System check failed:'), error.message)
      process.exit(1)
    }
  })

// Validate command
program
  .command('validate')
  .description('Validate FedSync data files')
  .argument('<data-path>', 'Path to FedSync data directory')
  .option('--categories', 'Validate categories only')
  .option('--events', 'Validate events only')  
  .option('--profiles', 'Validate profiles only')
  .action(async (dataPath: string, options: any) => {
    const logger = new Logger({ level: LogLevel.INFO })
    
    try {
      logger.info(`🔍 Validating FedSync data in: ${path.resolve(dataPath)}`)
      
      // TODO: Implement validation logic using our schemas
      logger.info(chalk.yellow('🚧 Validation feature coming soon...'))
      
    } catch (error: any) {
      logger.error(chalk.red('❌ Validation failed:'), error.message)
      process.exit(1)
    }
  })

// Examples command
program
  .command('examples')
  .description('Show usage examples')
  .action(() => {
    console.log(chalk.cyan('\n📚 FedSync Import Examples:\n'))
    
    console.log(chalk.white('Import all data:'))
    console.log(chalk.gray('  fedsync-import import /path/to/fedsync/data\n'))
    
    console.log(chalk.white('Import only categories:'))
    console.log(chalk.gray('  fedsync-import import /path/to/data --categories\n'))
    
    console.log(chalk.white('Dry run (preview without changes):'))
    console.log(chalk.gray('  fedsync-import import /path/to/data --dry-run\n'))
    
    console.log(chalk.white('Custom batch size and concurrency:'))
    console.log(chalk.gray('  fedsync-import import /path/to/data --batch-size 100 --concurrency 10\n'))
    
    console.log(chalk.white('Skip certain types:'))
    console.log(chalk.gray('  fedsync-import import /path/to/data --skip-events\n'))
    
    console.log(chalk.white('Debug mode with log file:'))
    console.log(chalk.gray('  fedsync-import import /path/to/data --log-level debug --log-file import.log\n'))
    
    console.log(chalk.white('Check system status:'))
    console.log(chalk.gray('  fedsync-import status\n'))
  })

// Handle unknown commands
program.on('command:*', () => {
  console.error(chalk.red('❌ Invalid command. Use --help to see available commands.'))
  process.exit(1)
})

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp()
}

program.parse()