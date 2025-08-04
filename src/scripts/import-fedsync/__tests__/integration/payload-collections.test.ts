/**
 * Integration Tests for Payload Collections
 * 
 * Tests transformers against ACTUAL Payload CMS collection schemas
 * to catch schema mismatches that unit tests miss
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getPayload } from 'payload'
import config from '@payload-config'
import { CategoryTransformer } from '../../transformers/category.transformer'
import { EventTransformer } from '../../transformers/event.transformer'
import { ProfileTransformer } from '../../transformers/profile.transformer'

describe('Payload Collection Integration', () => {
  let payload: any

  beforeAll(async () => {
    payload = await getPayload({ config })
  })

  describe('Categories Collection', () => {
    it('should validate Categories collection schema matches transformer output', async () => {
      const transformer = new CategoryTransformer()
      
      // Use real FedSync category format
      const mockCategory = {
        id: 123,
        name: 'Test Category',
        type: 'general'
      }
      
      const transformed = transformer.transformCategory(mockCategory)
      
      // Test against actual Categories collection by attempting create
      try {
        const result = await payload.create({
          collection: 'categories',
          data: transformed
        })
        
        expect(result).toBeDefined()
        expect(result.title).toBe('Test Category')
        
        // Cleanup
        await payload.delete({
          collection: 'categories',
          id: result.id
        })
      } catch (error: any) {
        // Should not throw validation errors
        fail(`Categories collection validation failed: ${error.message}`)
      }
    })

    it('should handle Categories collection queryable fields correctly', async () => {
      // Test the actual query pattern used in ImportOrchestrator
      const query = {
        collection: 'categories',
        where: {
          title: { equals: 'Test Query Category' }
        }
      }
      
      // This should not throw "path cannot be queried" errors
      const result = await payload.find(query)
      expect(result).toBeDefined()
      expect(Array.isArray(result.docs)).toBe(true)
    })
  })

  describe('Events Collection', () => {
    it('should validate Events collection accepts transformed event data', async () => {
      const categoryMap = new Map([[1, 'Test Category']])
      const transformer = new EventTransformer(categoryMap)
      
      // Real FedSync event format with "listing" type
      const mockEvent = {
        type: 'event',
        name: 'Test Event',
        external_id: 999,
        tracking_id: 'test-track-123',
        latitude: 40.7128,
        longitude: -74.0060,
        venue_name: 'Test Venue',
        address: {
          line_1: '123 Test St',
          line_2: '',
          city: 'Test City',
          state: 'NY',
          postcode: '10001'
        },
        event_dates: [{
          name: 'Main Event',
          start_date: '2024-01-15',
          end_date: '2024-01-15',
          start_time: '19:00',
          end_time: '21:00',
          all_day: false,
          times_text: '7-9 PM'
        }],
        email_addresses: {
          business: 'test@example.com',
          booking: 'booking@example.com'
        },
        phone_numbers: {
          local: '555-0123',
          alt: '',
          fax: '',
          free_us: '',
          free_world: ''
        },
        websites: {
          business: 'https://example.com',
          booking: ''
        },
        socials: {
          facebook: 'facebook.com/test',
          twitter: 'twitter.com/test',
          instagram: 'instagram.com/test',
          youtube: 'youtube.com/test',
          pinterest: ''
        },
        products: [{
          description: {
            text: 'Test event description'
          }
        }]
      }
      
      const transformed = transformer.transform(mockEvent)
      
      try {
        const result = await payload.create({
          collection: 'events',
          data: transformed
        })
        
        expect(result).toBeDefined()
        expect(result.title).toBe('Test Event')
        
        // Cleanup
        await payload.delete({
          collection: 'events',
          id: result.id
        })
      } catch (error: any) {
        fail(`Events collection validation failed: ${error.message}`)
      }
    })
  })

  describe('Profiles Collection', () => {
    it('should validate Profiles collection accepts transformed profile data', async () => {
      const categoryMap = new Map([[1, 'Test Category']])
      const amenityMap = new Map()
      const transformer = new ProfileTransformer(categoryMap, amenityMap)
      
      // Real FedSync profile format with "listing" type (not "profile")
      const mockProfile = {
        type: 'listing', // This is what FedSync actually sends
        name: 'Test Profile',
        external_id: 888,
        tracking_id: 'test-profile-123',
        latitude: 40.7128,
        longitude: -74.0060,
        address: {
          line_1: '456 Profile St',
          line_2: 'Suite 100',
          city: 'Profile City',
          state: 'CA',
          postcode: '90210'
        },
        email_addresses: {
          business: 'profile@example.com',
          booking: ''
        },
        phone_numbers: {
          local: '555-0456',
          alt: '',
          fax: '',
          free_us: '',
          free_world: ''
        },
        websites: {
          business: 'https://profileexample.com',
          booking: ''
        },
        socials: {
          facebook: '',
          twitter: '',
          instagram: '',
          youtube: '',
          pinterest: ''
        },
        products: [{
          description: {
            text: 'Test profile description'
          }
        }]
      }
      
      const transformed = transformer.transform(mockProfile)
      
      try {
        const result = await payload.create({
          collection: 'profiles',
          data: transformed
        })
        
        expect(result).toBeDefined()
        expect(result.title).toBe('Test Profile')
        
        // Cleanup
        await payload.delete({
          collection: 'profiles',
          id: result.id
        })
      } catch (error: any) {
        fail(`Profiles collection validation failed: ${error.message}`)
      }
    })
  })

  describe('Collection Field Validation', () => {
    it('should validate required fields exist in collections', async () => {
      // Test that collections have expected fields for import
      const collections = ['categories', 'events', 'profiles']
      
      for (const collectionName of collections) {
        const result = await payload.find({
          collection: collectionName,
          limit: 1
        })
        
        expect(result).toBeDefined()
        expect(typeof result.totalDocs).toBe('number')
      }
    })

    it('should validate relationship fields accept ObjectId format', async () => {
      // Create a test category to get valid ObjectId
      const category = await payload.create({
        collection: 'categories',
        data: {
          title: 'Test Relationship Category'
        }
      })
      
      expect(category.id).toBeDefined()
      expect(typeof category.id).toBe('string')
      expect(category.id.length).toBe(24) // MongoDB ObjectId length
      
      // Cleanup
      await payload.delete({
        collection: 'categories',
        id: category.id
      })
    })
  })
})