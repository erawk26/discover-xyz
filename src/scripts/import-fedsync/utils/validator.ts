/**
 * Import Validation Utility
 * 
 * Validates imported data to ensure integrity
 * and completeness.
 */

import { getPayload } from 'payload'
import payloadConfig from '@payload-config'
import { logger } from './logger'
import type { Payload } from 'payload'

export interface ValidationReport {
  categories: {
    total: number
    valid: number
    issues: string[]
  }
  events: {
    total: number
    valid: number
    withCategories: number
    withDates: number
    issues: string[]
  }
  profiles: {
    total: number
    valid: number
    withCategories: number
    withPhotos: number
    issues: string[]
  }
  relationships: {
    orphanedCategories: number
    missingReferences: string[]
  }
  issues: string[]
}

export class ImportValidator {
  private payload!: Payload
  
  async init() {
    this.payload = await getPayload({ config: payloadConfig })
  }
  
  /**
   * Run validation on imported data
   */
  async validate(type: string = 'all'): Promise<ValidationReport> {
    await this.init()
    
    const report: ValidationReport = {
      categories: {
        total: 0,
        valid: 0,
        issues: [],
      },
      events: {
        total: 0,
        valid: 0,
        withCategories: 0,
        withDates: 0,
        issues: [],
      },
      profiles: {
        total: 0,
        valid: 0,
        withCategories: 0,
        withPhotos: 0,
        issues: [],
      },
      relationships: {
        orphanedCategories: 0,
        missingReferences: [],
      },
      issues: [],
    }
    
    try {
      if (type === 'all' || type === 'categories') {
        await this.validateCategories(report)
      }
      
      if (type === 'all' || type === 'events') {
        await this.validateEvents(report)
      }
      
      if (type === 'all' || type === 'profiles') {
        await this.validateProfiles(report)
      }
      
      if (type === 'all') {
        await this.validateRelationships(report)
      }
      
      // Compile overall issues
      this.compileIssues(report)
      
    } catch (error) {
      logger.error('Validation error:', error)
      report.issues.push(`Validation failed: ${error}`)
    }
    
    return report
  }
  
  /**
   * Validate categories
   */
  private async validateCategories(report: ValidationReport) {
    logger.info('Validating categories...')
    
    const categories = await this.payload.find({
      collection: 'categories',
      limit: 0, // Get all
    })
    
    report.categories.total = categories.totalDocs
    
    categories.docs.forEach((category: any) => {
      let isValid = true
      
      // Check required fields
      if (!category.name) {
        report.categories.issues.push(`Category ${category.id} missing name`)
        isValid = false
      }
      
      if (!category.type) {
        report.categories.issues.push(`Category ${category.id} missing type`)
        isValid = false
      }
      
      if (isValid) {
        report.categories.valid++
      }
    })
  }
  
  /**
   * Validate events
   */
  private async validateEvents(report: ValidationReport) {
    logger.info('Validating events...')
    
    const events = await this.payload.find({
      collection: 'events',
      limit: 0,
      depth: 1, // Include relationships
    })
    
    report.events.total = events.totalDocs
    
    for (const event of events.docs) {
      let isValid = true
      
      // Check required fields
      if (!event.title) {
        report.events.issues.push(`Event ${event.id} missing title`)
        isValid = false
      }
      
      if (!event.externalId) {
        report.events.issues.push(`Event ${event.id} missing externalId`)
        isValid = false
      }
      
      // Check event dates
      if (!event.eventDates || event.eventDates.length === 0) {
        report.events.issues.push(`Event ${event.title} has no event dates`)
        isValid = false
      } else {
        report.events.withDates++
        
        // Validate date formats
        event.eventDates.forEach((date: any, index: number) => {
          if (!date.startDate) {
            report.events.issues.push(`Event ${event.title} date[${index}] missing startDate`)
            isValid = false
          }
        })
      }
      
      // Check categories
      if (event.categories && event.categories.length > 0) {
        report.events.withCategories++
      }
      
      // Check location
      if (!event.address?.city) {
        report.events.issues.push(`Event ${event.title} missing city`)
      }
      
      if (isValid) {
        report.events.valid++
      }
    }
  }
  
  /**
   * Validate profiles
   */
  private async validateProfiles(report: ValidationReport) {
    logger.info('Validating profiles...')
    
    const profiles = await this.payload.find({
      collection: 'profiles',
      limit: 0,
      depth: 1,
    })
    
    report.profiles.total = profiles.totalDocs
    
    for (const profile of profiles.docs) {
      let isValid = true
      
      // Check required fields
      if (!profile.title) {
        report.profiles.issues.push(`Profile ${profile.id} missing title`)
        isValid = false
      }
      
      if (!profile.externalId) {
        report.profiles.issues.push(`Profile ${profile.id} missing externalId`)
        isValid = false
      }
      
      // Check categories
      if (profile.categories && profile.categories.length > 0) {
        report.profiles.withCategories++
      }
      
      // Check photos
      if (profile.photos && profile.photos.length > 0) {
        report.profiles.withPhotos++
      }
      
      // Check address
      if (!profile.address?.city) {
        report.profiles.issues.push(`Profile ${profile.title} missing city`)
      }
      
      // Check business type
      if (!profile.type) {
        report.profiles.issues.push(`Profile ${profile.title} missing type`)
      }
      
      if (isValid) {
        report.profiles.valid++
      }
    }
  }
  
  /**
   * Validate relationships
   */
  private async validateRelationships(report: ValidationReport) {
    logger.info('Validating relationships...')
    
    // Check for orphaned categories (categories with no events/profiles)
    const categories = await this.payload.find({
      collection: 'categories',
      limit: 0,
    })
    
    for (const category of categories.docs) {
      // Check if category is used in events
      const eventsWithCategory = await this.payload.find({
        collection: 'events',
        where: {
          categories: {
            contains: category.id,
          },
        },
        limit: 1,
      })
      
      // Check if category is used in profiles
      const profilesWithCategory = await this.payload.find({
        collection: 'profiles',
        where: {
          categories: {
            contains: category.id,
          },
        },
        limit: 1,
      })
      
      if (eventsWithCategory.totalDocs === 0 && profilesWithCategory.totalDocs === 0) {
        report.relationships.orphanedCategories++
      }
    }
  }
  
  /**
   * Compile overall issues
   */
  private compileIssues(report: ValidationReport) {
    // Add high-level issues
    if (report.categories.valid < report.categories.total) {
      const invalid = report.categories.total - report.categories.valid
      report.issues.push(`${invalid} invalid categories found`)
    }
    
    if (report.events.valid < report.events.total) {
      const invalid = report.events.total - report.events.valid
      report.issues.push(`${invalid} invalid events found`)
    }
    
    if (report.profiles.valid < report.profiles.total) {
      const invalid = report.profiles.total - report.profiles.valid
      report.issues.push(`${invalid} invalid profiles found`)
    }
    
    if (report.events.withDates === 0 && report.events.total > 0) {
      report.issues.push('No events have date information')
    }
    
    if (report.relationships.orphanedCategories > 0) {
      report.issues.push(`${report.relationships.orphanedCategories} orphaned categories found`)
    }
    
    // Add percentage stats
    if (report.events.total > 0) {
      const categoryPercentage = Math.round((report.events.withCategories / report.events.total) * 100)
      if (categoryPercentage < 50) {
        report.issues.push(`Only ${categoryPercentage}% of events have categories`)
      }
    }
    
    if (report.profiles.total > 0) {
      const photoPercentage = Math.round((report.profiles.withPhotos / report.profiles.total) * 100)
      if (photoPercentage < 30) {
        report.issues.push(`Only ${photoPercentage}% of profiles have photos`)
      }
    }
  }
  
  /**
   * Generate detailed validation report file
   */
  async generateReport(report: ValidationReport, filepath: string) {
    const fs = await import('fs/promises')
    
    const detailedReport = {
      timestamp: new Date().toISOString(),
      summary: {
        totalRecords: report.categories.total + report.events.total + report.profiles.total,
        validRecords: report.categories.valid + report.events.valid + report.profiles.valid,
        overallHealth: this.calculateHealth(report),
      },
      ...report,
    }
    
    await fs.writeFile(filepath, JSON.stringify(detailedReport, null, 2))
    logger.info(`Validation report saved to ${filepath}`)
  }
  
  /**
   * Calculate overall health percentage
   */
  private calculateHealth(report: ValidationReport): number {
    const total = report.categories.total + report.events.total + report.profiles.total
    const valid = report.categories.valid + report.events.valid + report.profiles.valid
    
    if (total === 0) return 0
    
    return Math.round((valid / total) * 100)
  }
}