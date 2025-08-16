/**
 * Import Orchestrator
 * 
 * Main orchestrator that coordinates the complete FedSync import process
 * Integrates transformers with Payload CMS for data loading
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import { CategoryTransformer } from '../transformers/category.transformer'
import { EventTransformer } from '../transformers/event.transformer'
import { ProfileTransformer } from '../transformers/profile.transformer'
import { Logger, LogLevel } from 'fedsync/logger'
import { ProgressTracker } from '../utils/progress'
import pLimit from 'p-limit'
import fs from 'fs/promises'
import path from 'path'

export interface ImportOptions {
  batchSize?: number
  concurrency?: number
  skipCategories?: boolean
  skipEvents?: boolean
  skipProfiles?: boolean
  dryRun?: boolean
  logLevel?: LogLevel
  logFile?: string
}

export interface ImportStats {
  categories: {
    processed: number
    imported: number
    errors: number
  }
  events: {
    processed: number
    imported: number
    errors: number
  }
  profiles: {
    processed: number
    imported: number
    errors: number
  }
  startTime: Date
  endTime?: Date
  duration?: number
}

export class ImportOrchestrator {
  private payload: any
  private categoryTransformer: CategoryTransformer
  private eventTransformer?: EventTransformer
  private profileTransformer?: ProfileTransformer
  private logger: Logger
  private progress: ProgressTracker
  private limit: (fn: () => Promise<any>) => Promise<any>
  
  constructor(options: ImportOptions = {}) {
    this.logger = new Logger({ 
      level: options.logLevel || LogLevel.INFO,
      logToFile: !!options.logFile,
      logFile: options.logFile,
      colors: true,
      timestamp: true
    })
    this.progress = new ProgressTracker()
    this.limit = pLimit(options.concurrency || 5)
    
    // Initialize transformers (will get maps during import)
    this.categoryTransformer = new CategoryTransformer()
    // Event and Profile transformers will be initialized after category import
  }

  /**
   * Initialize Payload CMS connection
   */
  async initialize(): Promise<void> {
    this.logger.info('🚀 Initializing Payload CMS connection...')
    
    try {
      this.payload = await getPayload({ config })
      this.logger.info('✅ Payload CMS connection established')
    } catch (error) {
      this.logger.error('❌ Failed to connect to Payload CMS:', error)
      throw new Error('Failed to initialize Payload CMS connection')
    }
  }

  /**
   * Run complete FedSync import process
   */
  async runImport(dataPath: string, options: ImportOptions = {}): Promise<ImportStats> {
    const stats: ImportStats = {
      categories: { processed: 0, imported: 0, errors: 0 },
      events: { processed: 0, imported: 0, errors: 0 },
      profiles: { processed: 0, imported: 0, errors: 0 },
      startTime: new Date()
    }

    this.logger.info('🎯 Starting FedSync import process...')
    this.logger.info(`📁 Data path: ${dataPath}`)
    this.logger.info(`⚙️  Options:`, options)

    try {
      // Phase 1: Import Categories (required for events/profiles)
      if (!options.skipCategories) {
        this.logger.info('\n📂 Phase 1: Importing Categories...')
        await this.importCategories(dataPath, stats, options)
      }

      // Initialize transformers with category map
      const categoryMap = this.categoryTransformer.getCategoryMap()
      const amenityMap = await this.buildAmenityMap(dataPath) // TODO: Implement amenity loading
      
      this.eventTransformer = new EventTransformer(categoryMap)
      this.profileTransformer = new ProfileTransformer(categoryMap, amenityMap)

      // Phase 2: Import Events
      if (!options.skipEvents) {
        this.logger.info('\n🎪 Phase 2: Importing Events...')
        await this.importEvents(dataPath, stats, options)
      }

      // Phase 3: Import Profiles
      if (!options.skipProfiles) {
        this.logger.info('\n🏢 Phase 3: Importing Profiles...')
        await this.importProfiles(dataPath, stats, options)
      }

      stats.endTime = new Date()
      stats.duration = stats.endTime.getTime() - stats.startTime.getTime()

      this.logger.info('\n🎉 Import completed successfully!')
      this.logStats(stats)

    } catch (error) {
      this.logger.error('💥 Import failed:', error)
      stats.endTime = new Date()
      stats.duration = stats.endTime.getTime() - stats.startTime.getTime()
      throw error
    }

    return stats
  }

  /**
   * Import categories from FedSync data
   */
  private async importCategories(dataPath: string, stats: ImportStats, options: ImportOptions): Promise<void> {
    const categoriesPath = path.join(dataPath, 'categories', 'categories.json')
    
    try {
      // Check if categories file exists
      await fs.access(categoriesPath)
      
      // Load and transform categories
      const categoriesData = JSON.parse(await fs.readFile(categoriesPath, 'utf-8'))
      const transformedCategories = this.categoryTransformer.transformCategoriesFile(categoriesData)
      
      this.logger.info(`📊 Found ${transformedCategories.length} categories to import`)
      stats.categories.processed = transformedCategories.length

      if (options.dryRun) {
        this.logger.info('🧪 Dry run mode - categories would be imported')
        stats.categories.imported = transformedCategories.length
        return
      }

      // Import categories in batches
      const batchSize = options.batchSize || 50
      const batches = this.createBatches(transformedCategories, batchSize)
      
      this.progress.start('Importing categories', batches.length)

      for (const [index, batch] of batches.entries()) {
        await this.importCategoryBatch(batch, stats)
        this.progress.update(index + 1, `Batch ${index + 1}/${batches.length} completed`)
      }

      this.progress.finish('Categories imported successfully')

    } catch (error: any) {
      if (error.code === 'ENOENT') {
        this.logger.warn('⚠️  Categories file not found, skipping category import')
      } else {
        this.logger.error('❌ Failed to import categories:', error)
        throw error
      }
    }
  }

  /**
   * Import events from FedSync data
   */
  private async importEvents(dataPath: string, stats: ImportStats, options: ImportOptions): Promise<void> {
    const eventsDir = path.join(dataPath, 'events')
    
    try {
      // Get all event files
      const eventFiles = await this.getJsonFiles(eventsDir)
      this.logger.info(`📊 Found ${eventFiles.length} event files to process`)
      stats.events.processed = eventFiles.length

      if (options.dryRun) {
        this.logger.info('🧪 Dry run mode - events would be imported')
        stats.events.imported = eventFiles.length
        return
      }

      // Process events with concurrency control
      this.progress.start('Importing events', eventFiles.length)
      
      const tasks = eventFiles.map((filePath, index) => 
        this.limit(async () => {
          try {
            await this.importSingleEvent(filePath, stats)
            this.progress.update(index + 1, `Processed ${path.basename(filePath)}`)
          } catch (error) {
            this.logger.error(`Failed to import event ${filePath}:`, error)
            stats.events.errors++
          }
        })
      )

      await Promise.all(tasks)
      this.progress.finish('Events imported successfully')

    } catch (error: any) {
      if (error.code === 'ENOENT') {
        this.logger.warn('⚠️  Events directory not found, skipping event import')
      } else {
        this.logger.error('❌ Failed to import events:', error)
        throw error
      }
    }
  }

  /**
   * Import profiles from FedSync data
   */
  private async importProfiles(dataPath: string, stats: ImportStats, options: ImportOptions): Promise<void> {
    const profilesDir = path.join(dataPath, 'profiles')
    
    try {
      // Get all profile files
      const profileFiles = await this.getJsonFiles(profilesDir)
      this.logger.info(`📊 Found ${profileFiles.length} profile files to process`)
      stats.profiles.processed = profileFiles.length

      if (options.dryRun) {
        this.logger.info('🧪 Dry run mode - profiles would be imported')
        stats.profiles.imported = profileFiles.length
        return
      }

      // Process profiles with concurrency control
      this.progress.start('Importing profiles', profileFiles.length)
      
      const tasks = profileFiles.map((filePath, index) => 
        this.limit(async () => {
          try {
            await this.importSingleProfile(filePath, stats)
            this.progress.update(index + 1, `Processed ${path.basename(filePath)}`)
          } catch (error) {
            this.logger.error(`Failed to import profile ${filePath}:`, error)
            stats.profiles.errors++
          }
        })
      )

      await Promise.all(tasks)
      this.progress.finish('Profiles imported successfully')

    } catch (error: any) {
      if (error.code === 'ENOENT') {
        this.logger.warn('⚠️  Profiles directory not found, skipping profile import')
      } else {
        this.logger.error('❌ Failed to import profiles:', error)
        throw error
      }
    }
  }

  /**
   * Import a batch of categories with parent/child relationship handling
   */
  private async importCategoryBatch(categories: any[], stats: ImportStats): Promise<void> {
    // Separate groups and individual categories
    const groups = categories.filter(cat => cat.type === 'group')
    const individualCategories = categories.filter(cat => cat.type === 'category')
    
    // Phase 1: Import groups first
    const groupIdMap = new Map<string, string>() // externalId -> Payload ID
    
    for (const group of groups) {
      try {
        const result = await this.importSingleCategory(group)
        if (result) {
          groupIdMap.set(group.externalId, result.id)
        }
        stats.categories.imported++
      } catch (error) {
        this.logger.error(`Failed to import group ${group.title}:`, error)
        stats.categories.errors++
      }
    }
    
    // Phase 2: Import individual categories with parent references
    for (const category of individualCategories) {
      try {
        // Find parent group ID if this category has a groupName
        if (category.groupName) {
          const parentExternalId = `group-${groups.find(g => g.title === category.groupName)?.title?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`
          const parentGroup = groups.find(g => g.title === category.groupName)
          if (parentGroup) {
            const parentPayloadId = groupIdMap.get(parentGroup.externalId)
            if (parentPayloadId) {
              category.parent = parentPayloadId
            }
          }
        }
        
        await this.importSingleCategory(category)
        stats.categories.imported++
      } catch (error) {
        this.logger.error(`Failed to import category ${category.title}:`, error)
        stats.categories.errors++
      }
    }
  }
  
  /**
   * Import a single category or group
   */
  private async importSingleCategory(category: any): Promise<any> {
    // Check if category already exists by externalId
    const existing = await this.payload.find({
      collection: 'categories',
      where: {
        externalId: { equals: category.externalId }
      }
    })

    if (existing.docs.length > 0) {
      // Update existing category
      return await this.payload.update({
        collection: 'categories',
        id: existing.docs[0].id,
        data: category
      })
    } else {
      // Create new category
      return await this.payload.create({
        collection: 'categories',
        data: category
      })
    }
  }

  /**
   * Import a single event file
   */
  private async importSingleEvent(filePath: string, stats: ImportStats): Promise<void> {
    if (!this.eventTransformer) {
      throw new Error('Event transformer not initialized')
    }
    
    const eventData = JSON.parse(await fs.readFile(filePath, 'utf-8'))
    const transformedEvent = this.eventTransformer.transform(eventData)

    // Check if event already exists
    const existing = await this.payload.find({
      collection: 'events',
      where: {
        externalId: { equals: transformedEvent.externalId }
      }
    })

    if (existing.docs.length > 0) {
      // Update existing event
      await this.payload.update({
        collection: 'events',
        id: existing.docs[0].id,
        data: transformedEvent
      })
    } else {
      // Create new event
      await this.payload.create({
        collection: 'events',
        data: transformedEvent
      })
    }

    stats.events.imported++
  }

  /**
   * Import a single profile file
   */
  private async importSingleProfile(filePath: string, stats: ImportStats): Promise<void> {
    if (!this.profileTransformer) {
      throw new Error('Profile transformer not initialized')
    }
    
    const profileData = JSON.parse(await fs.readFile(filePath, 'utf-8'))
    const transformedProfile = this.profileTransformer.transform(profileData)

    // Check if profile already exists
    const existing = await this.payload.find({
      collection: 'profiles',
      where: {
        externalId: { equals: transformedProfile.externalId }
      }
    })

    if (existing.docs.length > 0) {
      // Update existing profile
      await this.payload.update({
        collection: 'profiles',
        id: existing.docs[0].id,
        data: transformedProfile
      })
    } else {
      // Create new profile
      await this.payload.create({
        collection: 'profiles',
        data: transformedProfile
      })
    }

    stats.profiles.imported++
  }

  /**
   * Build amenity ID to name mapping (placeholder - implement based on data structure)
   */
  private async buildAmenityMap(dataPath: string): Promise<Map<number, string>> {
    // TODO: Load amenities.json and build map
    // For now, return empty map
    return new Map()
  }

  /**
   * Get all JSON files in a directory
   */
  private async getJsonFiles(dirPath: string): Promise<string[]> {
    const files = await fs.readdir(dirPath)
    return files
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(dirPath, file))
  }

  /**
   * Create batches from array
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = []
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }
    return batches
  }

  /**
   * Log import statistics
   */
  private logStats(stats: ImportStats): void {
    this.logger.info('\n📊 Import Statistics:')
    this.logger.info('┌─────────────┬───────────┬───────────┬─────────┐')
    this.logger.info('│ Type        │ Processed │ Imported  │ Errors  │')
    this.logger.info('├─────────────┼───────────┼───────────┼─────────┤')
    this.logger.info(`│ Categories  │ ${stats.categories.processed.toString().padStart(9)} │ ${stats.categories.imported.toString().padStart(9)} │ ${stats.categories.errors.toString().padStart(7)} │`)
    this.logger.info(`│ Events      │ ${stats.events.processed.toString().padStart(9)} │ ${stats.events.imported.toString().padStart(9)} │ ${stats.events.errors.toString().padStart(7)} │`)
    this.logger.info(`│ Profiles    │ ${stats.profiles.processed.toString().padStart(9)} │ ${stats.profiles.imported.toString().padStart(9)} │ ${stats.profiles.errors.toString().padStart(7)} │`)
    this.logger.info('└─────────────┴───────────┴───────────┴─────────┘')
    
    const totalProcessed = stats.categories.processed + stats.events.processed + stats.profiles.processed
    const totalImported = stats.categories.imported + stats.events.imported + stats.profiles.imported
    const totalErrors = stats.categories.errors + stats.events.errors + stats.profiles.errors
    
    this.logger.info(`\n📈 Totals: ${totalProcessed} processed, ${totalImported} imported, ${totalErrors} errors`)
    this.logger.info(`⏱️  Duration: ${stats.duration ? Math.round(stats.duration / 1000) : 0}s`)
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.logger.info('🧹 Cleaning up resources...')
    // Payload cleanup if needed
  }
}