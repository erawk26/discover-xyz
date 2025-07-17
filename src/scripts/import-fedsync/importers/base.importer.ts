/**
 * Base Importer Class
 * 
 * Abstract base class for all importers.
 * Provides common functionality for data import operations.
 */

import { getPayload } from 'payload'
import payloadConfig from '@payload-config'
import { config } from '../config'
import { logger } from '../utils/logger'
import type { Payload } from 'payload'

export interface ImportOptions {
  limit?: number
  batchSize?: number
  skipExisting?: boolean
  downloadPhotos?: boolean
  dryRun?: boolean
}

export interface ImportResult {
  total: number
  success: number
  failed: number
  skipped: number
  errors: ImportError[]
  duration: number
}

export interface ImportError {
  file?: string
  id?: string | number
  message: string
  error?: any
}

export abstract class BaseImporter {
  protected payload!: Payload
  protected options: ImportOptions
  protected result: ImportResult
  protected startTime: number
  
  constructor() {
    this.options = {}
    this.result = {
      total: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      duration: 0,
    }
    this.startTime = Date.now()
  }
  
  /**
   * Initialize the importer
   */
  async init(): Promise<void> {
    try {
      this.payload = await getPayload({ config: payloadConfig })
      logger.debug('Payload CMS initialized')
    } catch (error) {
      logger.error('Failed to initialize Payload:', error)
      throw error
    }
  }
  
  /**
   * Main import method - must be implemented by subclasses
   */
  abstract import(options?: ImportOptions): Promise<ImportResult>
  
  /**
   * Get the collection name for this importer
   */
  abstract getCollectionName(): string
  
  /**
   * Transform source data to Payload format
   */
  abstract transform(source: any): Promise<any>
  
  /**
   * Check if a record already exists
   */
  protected async checkExists(externalId: number | string): Promise<string | null> {
    try {
      const existing = await this.payload.find({
        collection: this.getCollectionName() as any,
        where: {
          externalId: { equals: externalId }
        },
        limit: 1,
      })
      
      return existing.docs.length > 0 ? existing.docs[0].id : null
    } catch (error) {
      logger.debug(`Error checking existence for ${externalId}:`, error)
      return null
    }
  }
  
  /**
   * Create or update a record
   */
  protected async upsert(data: any, existingId?: string): Promise<any> {
    try {
      if (existingId && !this.options.skipExisting) {
        // Update existing
        return await this.payload.update({
          collection: this.getCollectionName() as any,
          id: existingId,
          data,
          overrideAccess: config.performance.overrideAccess,
          depth: config.performance.depth,
        })
      } else if (!existingId) {
        // Create new
        return await this.payload.create({
          collection: this.getCollectionName() as any,
          data,
          overrideAccess: config.performance.overrideAccess,
          depth: config.performance.depth,
        })
      } else {
        // Skip existing
        this.result.skipped++
        return null
      }
    } catch (error) {
      throw error
    }
  }
  
  /**
   * Process a batch of records
   */
  protected async processBatch(records: any[]): Promise<void> {
    const promises = records.map(async (record) => {
      try {
        // Transform the record
        const transformed = await this.transform(record)
        
        // Check if exists
        const existingId = await this.checkExists(transformed.externalId || '')
        
        if (existingId && this.options.skipExisting) {
          this.result.skipped++
          logger.debug(`Skipping existing record: ${transformed.externalId}`)
          return
        }
        
        // Upsert the record
        const result = await this.upsert(transformed, existingId)
        
        if (result) {
          this.result.success++
          logger.debug(`Imported: ${transformed.title || transformed.name || transformed.externalId}`)
        }
      } catch (error: any) {
        this.result.failed++
        this.result.errors.push({
          id: record.id || record.external_id,
          message: error.message || 'Unknown error',
          error,
        })
        logger.error(`Failed to import record ${record.id}:`, error.message)
      }
    })
    
    await Promise.all(promises)
  }
  
  /**
   * Finalize the import and return results
   */
  protected finalize(): ImportResult {
    this.result.duration = Date.now() - this.startTime
    return this.result
  }
  
  /**
   * Helper to convert snake_case to camelCase
   */
  protected snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
  }
  
  /**
   * Transform object keys from snake_case to camelCase
   */
  protected transformKeys(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.transformKeys(item))
    } else if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
      return Object.keys(obj).reduce((result, key) => {
        const camelKey = (config.fieldMappings.snakeToCamel as any)[key] || this.snakeToCamel(key)
        result[camelKey] = this.transformKeys(obj[key])
        return result
      }, {} as any)
    }
    return obj
  }
  
  /**
   * Run garbage collection periodically
   */
  protected async runGarbageCollection() {
    if (this.result.total % config.performance.gcInterval === 0) {
      if (global.gc) {
        global.gc()
        logger.debug('Garbage collection performed')
      }
    }
  }
}