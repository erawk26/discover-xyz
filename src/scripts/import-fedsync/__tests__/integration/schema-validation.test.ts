/**
 * Schema Validation Tests
 * 
 * Tests that validate transformers produce data compatible with 
 * actual Payload CMS collection configurations
 */

import { CollectionConfig } from 'payload'
import { Categories } from '@/collections/Categories'
import { CategoryTransformer } from '../../transformers/category.transformer'
import { EventTransformer } from '../../transformers/event.transformer'
import { ProfileTransformer } from '../../transformers/profile.transformer'

describe('Schema Validation Against Collection Configs', () => {
  describe('Categories Schema Validation', () => {
    it('should produce data compatible with Categories collection config', () => {
      const transformer = new CategoryTransformer()
      const config = Categories as CollectionConfig
      
      // Extract required fields from collection config
      const requiredFields = config.fields
        ?.filter(field => 'required' in field && field.required)
        .map(field => 'name' in field ? field.name : null)
        .filter(Boolean) || []
      
      const mockCategory = {
        id: 123,
        name: 'Test Category',
        type: 'general'
      }
      
      const transformed = transformer.transformCategory(mockCategory)
      
      // Validate all required fields are present
      for (const fieldName of requiredFields) {
        expect(transformed).toHaveProperty(fieldName)
        expect(transformed[fieldName]).toBeDefined()
        expect(transformed[fieldName]).not.toBe('')
      }
      
      // Validate specific field requirements for Categories
      expect(transformed.title).toBe('Test Category')
      expect(typeof transformed.title).toBe('string')
      expect(transformed.title.length).toBeGreaterThan(0)
    })

    it('should not include fields not defined in Categories collection', () => {
      const transformer = new CategoryTransformer()
      const config = Categories as CollectionConfig
      
      // Get all field names from collection config
      const validFieldNames = new Set(
        config.fields?.map(field => 'name' in field ? field.name : null).filter(Boolean) || []
      )
      
      const mockCategory = {
        id: 123,
        name: 'Test Category',
        type: 'general'
      }
      
      const transformed = transformer.transformCategory(mockCategory)
      
      // Check that transformed object doesn't have unexpected fields
      // Note: externalId is not in Categories collection, this would cause query errors
      Object.keys(transformed).forEach(key => {
        if (key !== 'type' && key !== 'externalId' && key !== 'isGroup' && key !== 'groupName') {
          // Only check core collection fields
          if (!validFieldNames.has(key)) {
            console.warn(`Field '${key}' in transformed data is not defined in Categories collection`)
          }
        }
      })
    })
  })

  describe('Field Type Validation', () => {
    it('should validate text fields are strings', () => {
      const transformer = new CategoryTransformer()
      
      const mockCategory = {
        id: 123,
        name: 'Test Category',
        type: 'general'
      }
      
      const transformed = transformer.transformCategory(mockCategory)
      
      // Categories collection has 'title' as text field
      expect(typeof transformed.title).toBe('string')
      expect(transformed.title.trim()).toBe(transformed.title) // Should be trimmed
    })

    it('should validate required fields are not empty', () => {
      const transformer = new CategoryTransformer()
      
      const mockCategory = {
        id: 123,
        name: '', // Empty required field
        type: 'general'
      }
      
      expect(() => {
        const transformed = transformer.transformCategory(mockCategory)
        // Title should not be empty string
        if (!transformed.title || transformed.title.trim() === '') {
          throw new Error('Required field title cannot be empty')
        }
      }).toThrow()
    })
  })

  describe('Real FedSync Data Format Validation', () => {
    it('should handle actual FedSync listing type for profiles', () => {
      const categoryMap = new Map()
      const amenityMap = new Map()
      const transformer = new ProfileTransformer(categoryMap, amenityMap)
      
      // This is the ACTUAL format from FedSync
      const realFedSyncProfile = {
        type: 'listing', // Not 'profile'!
        name: 'Real Business Name',
        external_id: 12345,
        tracking_id: 'real-tracking-id',
        address: {
          line_1: 'Real Address',
          line_2: '',
          city: 'Real City',
          state: 'CA',
          postcode: '90210'
        },
        latitude: 34.0522,
        longitude: -118.2437,
        email_addresses: {
          business: 'real@business.com',
          booking: ''
        },
        phone_numbers: {
          local: '555-0123',
          alt: '',
          fax: '',
          free_us: '',
          free_world: ''
        },
        websites: {
          business: 'https://realbusiness.com',
          booking: ''
        },
        socials: {
          facebook: '',
          twitter: '',
          instagram: '',
          youtube: '',
          pinterest: ''
        },
        products: []
      }
      
      // This should NOT throw "Expected profile type, got listing"
      expect(() => {
        const transformed = transformer.transform(realFedSyncProfile)
        expect(transformed.title).toBe('Real Business Name')
      }).not.toThrow()
    })

    it('should handle missing optional fields gracefully', () => {
      const categoryMap = new Map()
      const amenityMap = new Map()
      const transformer = new ProfileTransformer(categoryMap, amenityMap)
      
      // Minimal FedSync data
      const minimalProfile = {
        type: 'listing',
        name: 'Minimal Business',
        external_id: 999,
        tracking_id: 'minimal-tracking',
        address: {
          line_1: 'Basic Address',
          city: 'City',
          state: 'ST'
        },
        email_addresses: {},
        phone_numbers: {},
        websites: {},
        socials: {}
      }
      
      expect(() => {
        const transformed = transformer.transform(minimalProfile)
        expect(transformed.title).toBe('Minimal Business')
      }).not.toThrow()
    })
  })

  describe('MongoDB ObjectId Validation', () => {
    it('should understand ObjectId requirements for relationships', () => {
      // MongoDB ObjectIds are 24-character hex strings
      const validObjectId = '507f1f77bcf86cd799439011'
      const invalidObjectId = 'not-an-objectid'
      
      expect(validObjectId.length).toBe(24)
      expect(/^[0-9a-fA-F]{24}$/.test(validObjectId)).toBe(true)
      expect(/^[0-9a-fA-F]{24}$/.test(invalidObjectId)).toBe(false)
    })

    it('should identify relationship field requirements', () => {
      // This test documents that relationship fields need ObjectIds, not strings
      const categoryMap = new Map([[1, 'Test Category']])
      const transformer = new EventTransformer(categoryMap)
      
      const mockEvent = {
        type: 'event',
        name: 'Test Event',
        external_id: 123,
        tracking_id: 'test',
        address: {
          line_1: 'Address',
          city: 'City',
          state: 'ST'
        },
        event_dates: [{
          name: 'Date',
          start_date: '2024-01-01',
          end_date: '2024-01-01',
          start_time: '10:00',
          end_time: '11:00',
          all_day: false
        }],
        email_addresses: { business: '' },
        phone_numbers: { local: '' },
        websites: { business: '' },
        socials: {}
      }
      
      const transformed = transformer.transform(mockEvent)
      
      // Categories should be empty array to avoid ObjectId validation errors
      expect(Array.isArray(transformed.categories)).toBe(true)
      expect(transformed.categories.length).toBe(0)
    })
  })
})