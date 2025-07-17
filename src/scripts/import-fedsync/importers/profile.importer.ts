/**
 * Profile Importer
 * 
 * Imports business profiles from FedSync JSON files into Payload CMS.
 */

import fs from 'fs/promises'
import path from 'path'
import { BaseImporter, ImportOptions, ImportResult } from './base.importer'
import { config } from '../config'
import { logger } from '../utils/logger'
import { FileSystemError } from '../utils/errors'
import { ProgressTracker } from '../utils/progress'
import { isProfile, type Listing, type TransformedProfile, type ExtendedProfile } from '../types/fedsync.types'

export class ProfileImporter extends BaseImporter {
  getCollectionName(): string {
    return 'profiles'
  }
  
  async import(options: ImportOptions = {}): Promise<ImportResult> {
    this.options = { ...options }
    
    logger.info('Starting profile import...')
    const progress = new ProgressTracker()
    
    try {
      await this.init()
      
      // Get all profile files
      const profileFiles = await this.getProfileFiles()
      
      // Apply limit if specified
      const filesToImport = options.limit 
        ? profileFiles.slice(0, options.limit)
        : profileFiles
      
      this.result.total = filesToImport.length
      progress.start('Importing profiles', this.result.total)
      
      // Process files in batches
      const batchSize = options.batchSize || config.import.batchSize
      
      for (let i = 0; i < filesToImport.length; i += batchSize) {
        const batch = filesToImport.slice(i, i + batchSize)
        
        // Load and process batch
        const profiles = await Promise.all(
          batch.map(file => this.loadProfileFile(file))
        )
        
        await this.processBatch(profiles)
        
        progress.update(
          Math.min(i + batchSize, filesToImport.length),
          `Processing ${batch[0]}`
        )
        
        await this.runGarbageCollection()
      }
      
      progress.succeed(`Imported ${this.result.success} profiles successfully`)
      
    } catch (error: any) {
      progress.fail(`Profile import failed: ${error.message}`)
      throw error
    }
    
    return this.finalize()
  }
  
  /**
   * Get list of profile JSON files
   */
  private async getProfileFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(config.paths.profiles)
      return files
        .filter(f => f.endsWith('.json'))
        .map(f => path.join(config.paths.profiles, f))
        .sort()
    } catch (error: any) {
      throw new FileSystemError(
        `Failed to read profiles directory: ${error.message}`,
        { path: config.paths.profiles }
      )
    }
  }
  
  /**
   * Load and parse profile JSON file
   */
  private async loadProfileFile(filepath: string): Promise<Listing> {
    try {
      const data = await fs.readFile(filepath, 'utf-8')
      const parsed = JSON.parse(data) as Listing
      
      // Validate it's a profile (not an event)
      if (!isProfile(parsed)) {
        throw new Error(`File ${filepath} does not contain a profile (type: ${parsed.type})`)
      }
      
      // Add file reference for error tracking
      (parsed as any)._sourceFile = path.basename(filepath)
      
      return parsed
    } catch (error: any) {
      throw new FileSystemError(
        `Failed to load profile file: ${error.message}`,
        { path: filepath }
      )
    }
  }
  
  /**
   * Transform profile data to Payload format
   */
  async transform(source: Listing): Promise<TransformedProfile> {
    // Cast to ExtendedProfile to access profile-specific fields
    const profile = source as ExtendedProfile
    // Validate this is a profile (not an event)
    if (!isProfile(source)) {
      throw new Error(`Expected profile type, got ${source.type}`)
    }
    
    // Get description from products
    const description = profile.products?.[0]?.description?.text
    
    // Transform photos
    const photos = profile.products?.[0]?.photos?.map(photo => ({
      url: photo.properties?.cloudinary?.secure_url || photo.path,
      caption: photo.caption,
      altText: photo.alt_text || photo.caption,
      externalId: photo.id,
    })) || []
    
    // Transform hours - FedSync uses different field names
    const hours = profile.hours?.map(h => ({
      day: h.dayOfWeek,
      open: h.openAt,
      close: h.closeAt,
    })) || []
    
    return {
      title: profile.name,
      sortName: profile.name_sort,
      externalId: profile.external_id || 0,
      trackingId: profile.tracking_id || '',
      type: profile.type || 'profile',
      description: description ? [{
        children: [{ text: description }]
      }] : undefined,
      
      // Location
      ...(profile.latitude && profile.longitude ? {
        location: [profile.longitude, profile.latitude]
      } : {}),
      
      // Address
      address: {
        line1: profile.address.line_1 || '',
        line2: profile.address.line_2 || '',
        city: profile.address.city,
        state: profile.address.state,
        postcode: profile.address.postcode || '',
      },
      
      // Contact info
      emailAddresses: {
        business: profile.email_addresses.business,
        booking: profile.email_addresses.booking,
      },
      
      phoneNumbers: {
        local: profile.phone_numbers.local,
        alt: profile.phone_numbers.alt,
        fax: profile.phone_numbers.fax,
        freeUS: profile.phone_numbers.free_us,
        freeWorld: profile.phone_numbers.free_world,
      },
      
      websites: {
        business: profile.websites.business,
        booking: profile.websites.booking || '',
        meetings: profile.websites.meetings || '',
        mobile: profile.websites.mobile || '',
      },
      
      socials: {
        facebook: profile.socials.facebook,
        twitter: profile.socials.twitter,
        instagram: profile.socials.instagram,
        youtube: profile.socials.youtube,
        pinterest: profile.socials.pinterest || '',
        tripadvisor: profile.socials.tripadvisor,
      },
      
      // Business info
      hours,
      hoursText: profile.hours_text,
      photos,
      rates: profile.rates?.map(r => ({
        type: r.name,
        amount: r.value,
        description: r.name
      })) || [],
      citiesServed: profile.cities_served || [],
      
      // Meeting facilities
      ...(profile.meeting_facilities?.total_sq_ft ? {
        meetingFacilities: {
          totalSqFt: profile.meeting_facilities.total_sq_ft,
          numMtgRooms: profile.meeting_facilities.num_mtg_rooms,
          largestRoom: profile.meeting_facilities.largest_room,
          ceilingHt: profile.meeting_facilities.ceiling_ht,
        }
      } : {}),
      
      // Rooms info
      ...(profile.num_of_rooms ? {
        roomsInfo: {
          numOfRooms: profile.num_of_rooms,
          numOfSuites: profile.num_of_suites,
        }
      } : {}),
      
      // Categories & Amenities - TODO: resolve from IDs
      categories: [],
      amenities: [],
      
      // Metadata
      listingData: profile,
      syncedAt: new Date().toISOString(),
      syncSource: 'federator-api',
      
      // Publishing
      status: 'published',
      publishedAt: new Date().toISOString(),
    }
  }
}