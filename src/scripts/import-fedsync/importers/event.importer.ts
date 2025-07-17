/**
 * Event Importer
 * 
 * Imports events from FedSync JSON files into Payload CMS.
 */

import fs from 'fs/promises'
import path from 'path'
import { BaseImporter, ImportOptions, ImportResult } from './base.importer'
import { config } from '../config'
import { logger } from '../utils/logger'
import { FileSystemError } from '../utils/errors'
import { ProgressTracker } from '../utils/progress'
import { isEvent, type Listing, type TransformedEvent } from '../types/fedsync.types'

export class EventImporter extends BaseImporter {
  getCollectionName(): string {
    return 'events'
  }
  
  async import(options: ImportOptions = {}): Promise<ImportResult> {
    this.options = { ...options }
    
    logger.info('Starting event import...')
    const progress = new ProgressTracker()
    
    try {
      await this.init()
      
      // Get all event files
      const eventFiles = await this.getEventFiles()
      
      // Apply limit if specified
      const filesToImport = options.limit 
        ? eventFiles.slice(0, options.limit)
        : eventFiles
      
      this.result.total = filesToImport.length
      progress.start('Importing events', this.result.total)
      
      // Process files in batches
      const batchSize = options.batchSize || config.import.batchSize
      
      for (let i = 0; i < filesToImport.length; i += batchSize) {
        const batch = filesToImport.slice(i, i + batchSize)
        
        // Load and process batch
        const events = await Promise.all(
          batch.map(file => this.loadEventFile(file))
        )
        
        await this.processBatch(events)
        
        progress.update(
          Math.min(i + batchSize, filesToImport.length),
          `Processing ${batch[0]}`
        )
        
        await this.runGarbageCollection()
      }
      
      progress.succeed(`Imported ${this.result.success} events successfully`)
      
    } catch (error: any) {
      progress.fail(`Event import failed: ${error.message}`)
      throw error
    }
    
    return this.finalize()
  }
  
  /**
   * Get list of event JSON files
   */
  private async getEventFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(config.paths.events)
      return files
        .filter(f => f.endsWith('.json'))
        .map(f => path.join(config.paths.events, f))
        .sort()
    } catch (error: any) {
      throw new FileSystemError(
        `Failed to read events directory: ${error.message}`,
        { path: config.paths.events }
      )
    }
  }
  
  /**
   * Load and parse event JSON file
   */
  private async loadEventFile(filepath: string): Promise<Listing> {
    try {
      const data = await fs.readFile(filepath, 'utf-8')
      const parsed = JSON.parse(data) as Listing
      
      // Validate it's an event
      if (!isEvent(parsed)) {
        throw new Error(`File ${filepath} does not contain an event (type: ${parsed.type})`)
      }
      
      // Add file reference for error tracking
      (parsed as any)._sourceFile = path.basename(filepath)
      
      return parsed
    } catch (error: any) {
      throw new FileSystemError(
        `Failed to load event file: ${error.message}`,
        { path: filepath }
      )
    }
  }
  
  /**
   * Transform event data to Payload format
   */
  async transform(source: Listing): Promise<TransformedEvent> {
    // Validate this is an event
    if (!isEvent(source)) {
      throw new Error(`Expected event type, got ${source.type}`)
    }
    
    // Transform event dates
    const eventDates = source.event_dates.map(date => ({
      name: date.name,
      startDate: date.start_date,
      endDate: date.end_date,
      startTime: date.start_time,
      endTime: date.end_time,
      allDay: Boolean(date.all_day),
      timesText: date.times_text || '',
    }))
    
    // Get description from products
    const description = source.products?.[0]?.description?.text
    
    return {
      title: source.name,
      externalId: source.external_id || 0,
      trackingId: source.tracking_id || '',
      description: description ? [{
        children: [{ text: description }]
      }] : undefined,
      
      // Location
      ...(source.latitude && source.longitude ? {
        location: [source.longitude, source.latitude]
      } : {}),
      venueName: source.venue_name,
      
      // Address
      address: {
        line1: source.address.line_1 || '',
        line2: source.address.line_2 || '',
        city: source.address.city,
        state: source.address.state,
        postcode: source.address.postcode || '',
      },
      
      // Event dates
      eventDates,
      
      // Contact info
      emailAddresses: {
        business: source.email_addresses.business,
        booking: source.email_addresses.booking,
      },
      
      phoneNumbers: {
        local: source.phone_numbers.local,
        alt: source.phone_numbers.alt,
        fax: source.phone_numbers.fax,
        freeUS: source.phone_numbers.free_us,
        freeWorld: source.phone_numbers.free_world,
      },
      
      websites: {
        business: source.websites.business,
        booking: source.websites.booking || '',
      },
      
      socials: {
        facebook: source.socials.facebook,
        twitter: source.socials.twitter,
        instagram: source.socials.instagram,
        youtube: source.socials.youtube,
        pinterest: source.socials.pinterest || '',
      },
      
      // Categories - TODO: resolve from category IDs
      categories: [],
      
      // Metadata
      listingData: source,
      syncedAt: new Date().toISOString(),
      syncSource: 'federator-api',
      
      // Publishing
      status: 'published',
      publishedAt: new Date().toISOString(),
    }
  }
}