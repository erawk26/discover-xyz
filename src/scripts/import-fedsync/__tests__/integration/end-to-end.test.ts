/**
 * End-to-End Import Tests
 * 
 * Complete integration tests that run actual imports against 
 * real Payload database to catch system-level issues
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ImportOrchestrator } from '../../importers/import-orchestrator'
import { LogLevel } from 'fedsync/logger'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'

describe('End-to-End Import Integration', () => {
  let payload: any
  let orchestrator: ImportOrchestrator
  let tempDir: string
  let createdIds: { categories: string[], events: string[], profiles: string[] }

  beforeAll(async () => {
    payload = await getPayload({ config })
    
    orchestrator = new ImportOrchestrator({
      batchSize: 10,
      concurrency: 2,
      logLevel: LogLevel.ERROR // Suppress logs during tests
    })
    
    await orchestrator.initialize()
    
    // Create temp directory for test data
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'fedsync-test-'))
    
    createdIds = { categories: [], events: [], profiles: [] }
  })

  afterAll(async () => {
    // Cleanup created test data
    for (const categoryId of createdIds.categories) {
      try {
        await payload.delete({ collection: 'categories', id: categoryId })
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    for (const eventId of createdIds.events) {
      try {
        await payload.delete({ collection: 'events', id: eventId })
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    for (const profileId of createdIds.profiles) {
      try {
        await payload.delete({ collection: 'profiles', id: profileId })
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    // Cleanup temp directory
    await fs.rmdir(tempDir, { recursive: true }).catch(() => {})
    
    await orchestrator.cleanup()
  })

  describe('Categories Import E2E', () => {
    it('should import categories and create them in database', async () => {
      // Create test categories file
      const categoriesDir = path.join(tempDir, 'categories')
      await fs.mkdir(categoriesDir, { recursive: true })
      
      const categoriesData = {
        categories: [
          {
            id: 1,
            name: 'E2E Test Category',
            categories: [
              { id: 101, name: 'E2E Subcategory 1', type: 'test' },
              { id: 102, name: 'E2E Subcategory 2', type: 'test' }
            ]
          }
        ]
      }
      
      await fs.writeFile(
        path.join(categoriesDir, 'categories.json'),
        JSON.stringify(categoriesData, null, 2)
      )
      
      // Run import
      const stats = await orchestrator.runImport(tempDir, {
        skipEvents: true,
        skipProfiles: true
      })
      
      expect(stats.categories.processed).toBe(3) // 1 group + 2 categories
      expect(stats.categories.imported).toBe(3)
      expect(stats.categories.errors).toBe(0)
      
      // Verify categories exist in database
      const groupResult = await payload.find({
        collection: 'categories',
        where: { title: { equals: 'E2E Test Category' } }
      })
      
      expect(groupResult.docs).toHaveLength(1)
      createdIds.categories.push(groupResult.docs[0].id)
      
      const subcat1Result = await payload.find({
        collection: 'categories',
        where: { title: { equals: 'E2E Subcategory 1' } }
      })
      
      expect(subcat1Result.docs).toHaveLength(1)
      createdIds.categories.push(subcat1Result.docs[0].id)
      
      const subcat2Result = await payload.find({
        collection: 'categories',
        where: { title: { equals: 'E2E Subcategory 2' } }
      })
      
      expect(subcat2Result.docs).toHaveLength(1)
      createdIds.categories.push(subcat2Result.docs[0].id)
    })
  })

  describe('Events Import E2E', () => {
    it('should import events and create them in database', async () => {
      // Create test events directory and files
      const eventsDir = path.join(tempDir, 'events')
      await fs.mkdir(eventsDir, { recursive: true })
      
      const eventData = {
        type: 'event',
        name: 'E2E Test Event',
        external_id: 99999,
        tracking_id: 'e2e-test-event',
        latitude: 40.7128,
        longitude: -74.0060,
        venue_name: 'E2E Test Venue',
        address: {
          line_1: 'E2E Test Address',
          line_2: '',
          city: 'Test City',
          state: 'TS',
          postcode: '12345'
        },
        event_dates: [{
          name: 'E2E Test Date',
          start_date: '2024-12-25',
          end_date: '2024-12-25',
          start_time: '10:00',
          end_time: '18:00',
          all_day: false,
          times_text: '10 AM - 6 PM'
        }],
        email_addresses: {
          business: 'e2e@test.com',
          booking: ''
        },
        phone_numbers: {
          local: '555-E2E-TEST',
          alt: '', fax: '', free_us: '', free_world: ''
        },
        websites: {
          business: 'https://e2e-test.com',
          booking: ''
        },
        socials: {
          facebook: '', twitter: '', instagram: '', youtube: '', pinterest: ''
        },
        products: [{
          description: {
            text: 'End-to-end test event description'
          }
        }]
      }
      
      await fs.writeFile(
        path.join(eventsDir, 'e2e-test-event.json'),
        JSON.stringify(eventData, null, 2)
      )
      
      // Run import
      const stats = await orchestrator.runImport(tempDir, {
        skipCategories: true,
        skipProfiles: true
      })
      
      expect(stats.events.processed).toBe(1)
      expect(stats.events.imported).toBe(1)
      expect(stats.events.errors).toBe(0)
      
      // Verify event exists in database
      const eventResult = await payload.find({
        collection: 'events',
        where: { externalId: { equals: 99999 } }
      })
      
      expect(eventResult.docs).toHaveLength(1)
      const event = eventResult.docs[0]
      
      expect(event.title).toBe('E2E Test Event')
      expect(event.venueName).toBe('E2E Test Venue')
      expect(event.location).toEqual([-74.0060, 40.7128])
      expect(event.eventDates).toHaveLength(1)
      expect(event.eventDates[0].name).toBe('E2E Test Date')
      
      createdIds.events.push(event.id)
    })
  })

  describe('Profiles Import E2E', () => {
    it('should import profiles and create them in database', async () => {
      // Create test profiles directory and files
      const profilesDir = path.join(tempDir, 'profiles')
      await fs.mkdir(profilesDir, { recursive: true })
      
      const profileData = {
        type: 'listing', // Real FedSync format
        name: 'E2E Test Business',
        external_id: 88888,
        tracking_id: 'e2e-test-business',
        latitude: 40.6892,
        longitude: -73.9442,
        address: {
          line_1: 'E2E Test Business Address',
          line_2: 'Suite E2E',
          city: 'Test City',
          state: 'TS',
          postcode: '54321'
        },
        email_addresses: {
          business: 'business@e2e-test.com',
          booking: ''
        },
        phone_numbers: {
          local: '555-BUSINESS',
          alt: '', fax: '', free_us: '', free_world: ''
        },
        websites: {
          business: 'https://e2e-business.com',
          booking: ''
        },
        socials: {
          facebook: '', twitter: '', instagram: '', youtube: '', pinterest: ''
        },
        products: [{
          description: {
            text: 'End-to-end test business description'
          }
        }]
      }
      
      await fs.writeFile(
        path.join(profilesDir, 'e2e-test-business.json'),
        JSON.stringify(profileData, null, 2)
      )
      
      // Run import
      const stats = await orchestrator.runImport(tempDir, {
        skipCategories: true,
        skipEvents: true
      })
      
      expect(stats.profiles.processed).toBe(1)
      expect(stats.profiles.imported).toBe(1)
      expect(stats.profiles.errors).toBe(0)
      
      // Verify profile exists in database
      const profileResult = await payload.find({
        collection: 'profiles',
        where: { externalId: { equals: 88888 } }
      })
      
      expect(profileResult.docs).toHaveLength(1)
      const profile = profileResult.docs[0]
      
      expect(profile.title).toBe('E2E Test Business')
      expect(profile.location).toEqual([-73.9442, 40.6892])
      expect(profile.address.line1).toBe('E2E Test Business Address')
      expect(profile.address.line2).toBe('Suite E2E')
      
      createdIds.profiles.push(profile.id)
    })
  })

  describe('Complete Import E2E', () => {
    it('should run complete import process without errors', async () => {
      // Create minimal complete dataset
      const completeDir = path.join(tempDir, 'complete')
      await fs.mkdir(completeDir, { recursive: true })
      
      // Categories
      const categoriesDir = path.join(completeDir, 'categories')
      await fs.mkdir(categoriesDir)
      await fs.writeFile(
        path.join(categoriesDir, 'categories.json'),
        JSON.stringify({
          categories: [{
            id: 999,
            name: 'Complete Test Category',
            categories: [{ id: 9999, name: 'Complete Subcategory', type: 'complete' }]
          }]
        })
      )
      
      // Events
      const eventsDir = path.join(completeDir, 'events')
      await fs.mkdir(eventsDir)
      await fs.writeFile(
        path.join(eventsDir, 'complete-event.json'),
        JSON.stringify({
          type: 'event',
          name: 'Complete Test Event',
          external_id: 77777,
          tracking_id: 'complete-test',
          address: { line_1: 'Complete Address', city: 'Complete City', state: 'CC' },
          event_dates: [{ name: 'Complete Date', start_date: '2024-01-01', end_date: '2024-01-01', all_day: true }],
          email_addresses: {}, phone_numbers: {}, websites: {}, socials: {}
        })
      )
      
      // Profiles
      const profilesDir = path.join(completeDir, 'profiles')
      await fs.mkdir(profilesDir)
      await fs.writeFile(
        path.join(profilesDir, 'complete-profile.json'),
        JSON.stringify({
          type: 'listing',
          name: 'Complete Test Profile',
          external_id: 66666,
          tracking_id: 'complete-profile',
          address: { line_1: 'Complete Profile Address', city: 'Complete City', state: 'CC' },
          email_addresses: {}, phone_numbers: {}, websites: {}, socials: {}
        })
      )
      
      // Run complete import
      const stats = await orchestrator.runImport(completeDir)
      
      expect(stats.categories.processed).toBe(2)
      expect(stats.categories.imported).toBe(2)
      expect(stats.categories.errors).toBe(0)
      
      expect(stats.events.processed).toBe(1)
      expect(stats.events.imported).toBe(1)
      expect(stats.events.errors).toBe(0)
      
      expect(stats.profiles.processed).toBe(1)
      expect(stats.profiles.imported).toBe(1)
      expect(stats.profiles.errors).toBe(0)
      
      expect(stats.startTime).toBeDefined()
      expect(stats.endTime).toBeDefined()
      expect(stats.duration).toBeGreaterThan(0)
      
      // Cleanup complete test data
      const completeCategory = await payload.find({
        collection: 'categories',
        where: { title: { equals: 'Complete Test Category' } }
      })
      if (completeCategory.docs.length > 0) {
        createdIds.categories.push(completeCategory.docs[0].id)
      }
      
      const completeSubcategory = await payload.find({
        collection: 'categories',
        where: { title: { equals: 'Complete Subcategory' } }
      })
      if (completeSubcategory.docs.length > 0) {
        createdIds.categories.push(completeSubcategory.docs[0].id)
      }
      
      const completeEvent = await payload.find({
        collection: 'events',
        where: { externalId: { equals: 77777 } }
      })
      if (completeEvent.docs.length > 0) {
        createdIds.events.push(completeEvent.docs[0].id)
      }
      
      const completeProfile = await payload.find({
        collection: 'profiles',
        where: { externalId: { equals: 66666 } }
      })
      if (completeProfile.docs.length > 0) {
        createdIds.profiles.push(completeProfile.docs[0].id)
      }
    })
  })

  describe('Error Handling E2E', () => {
    it('should handle missing data directories gracefully', async () => {
      const emptyDir = path.join(tempDir, 'empty')
      await fs.mkdir(emptyDir, { recursive: true })
      
      // Should not throw, just skip missing directories
      const stats = await orchestrator.runImport(emptyDir)
      
      expect(stats.categories.processed).toBe(0)
      expect(stats.events.processed).toBe(0)
      expect(stats.profiles.processed).toBe(0)
    })

    it('should handle dry run mode correctly', async () => {
      const dryRunDir = path.join(tempDir, 'dry-run')
      await fs.mkdir(dryRunDir, { recursive: true })
      
      // Create minimal test data
      const categoriesDir = path.join(dryRunDir, 'categories')
      await fs.mkdir(categoriesDir)
      await fs.writeFile(
        path.join(categoriesDir, 'categories.json'),
        JSON.stringify({
          categories: [{ id: 1, name: 'Dry Run Category', categories: [] }]
        })
      )
      
      const stats = await orchestrator.runImport(dryRunDir, { dryRun: true })
      
      expect(stats.categories.processed).toBe(1)
      expect(stats.categories.imported).toBe(1) // Should show as "would be imported"
      expect(stats.categories.errors).toBe(0)
      
      // Verify nothing was actually created
      const result = await payload.find({
        collection: 'categories',
        where: { title: { equals: 'Dry Run Category' } }
      })
      
      expect(result.docs).toHaveLength(0)
    })
  })
})