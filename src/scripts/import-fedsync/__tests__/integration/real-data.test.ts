/**
 * Real Data Integration Tests
 * 
 * Tests using actual FedSync data formats to catch real-world issues
 * that mock data tests miss
 */

import { describe, it, expect } from 'vitest'
import { CategoryTransformer } from '../../transformers/category.transformer'
import { EventTransformer } from '../../transformers/event.transformer' 
import { ProfileTransformer } from '../../transformers/profile.transformer'
import * as realSamples from '../fixtures/real-fedsync-samples.json'

describe('Real FedSync Data Integration', () => {
  describe('Categories from Real Data', () => {
    it('should transform real FedSync categories structure', () => {
      const transformer = new CategoryTransformer()
      const realCategories = realSamples.categories
      
      const transformed = transformer.transformCategoriesFile(realCategories)
      
      expect(transformed.length).toBeGreaterThan(0)
      
      // Should create groups and individual categories
      const groups = transformed.filter(cat => cat.isGroup)
      const individuals = transformed.filter(cat => !cat.isGroup)
      
      expect(groups.length).toBe(2) // Food & Drink, Entertainment
      expect(individuals.length).toBe(5) // 3 under Food & Drink, 2 under Entertainment
      
      // Validate structure
      const foodGroup = groups.find(g => g.title === 'Food & Drink')
      expect(foodGroup).toBeDefined()
      expect(foodGroup?.type).toBe('group')
      
      const restaurant = individuals.find(i => i.title === 'Restaurants')
      expect(restaurant).toBeDefined()
      expect(restaurant?.groupName).toBe('Food & Drink')
    })

    it('should build correct category map for lookups', () => {
      const transformer = new CategoryTransformer()
      const realCategories = realSamples.categories
      
      transformer.transformCategoriesFile(realCategories)
      const categoryMap = transformer.getCategoryMap()
      
      expect(categoryMap.get(101)).toBe('Restaurants')
      expect(categoryMap.get(102)).toBe('Cafes')
      expect(categoryMap.get(103)).toBe('Bars')
      expect(categoryMap.get(201)).toBe('Music Venues')
      expect(categoryMap.get(202)).toBe('Theaters')
    })
  })

  describe('Events from Real Data', () => {
    it('should transform real FedSync event data', () => {
      const categoryMap = new Map([[201, 'Music Venues'], [202, 'Theaters']])
      const transformer = new EventTransformer(categoryMap)
      const realEvent = realSamples.realEvent
      
      const transformed = transformer.transform(realEvent)
      
      expect(transformed.title).toBe('Summer Music Festival')
      expect(transformed.externalId).toBe(12345)
      expect(transformed.trackingId).toBe('smf-2024-001')
      expect(transformed.venueName).toBe('Central Park')
      
      // Validate location format [longitude, latitude]
      expect(transformed.location).toEqual([-74.0060, 40.7128])
      
      // Validate address structure
      expect(transformed.address.line1).toBe('Central Park')
      expect(transformed.address.line2).toBe('Great Lawn')
      expect(transformed.address.city).toBe('New York')
      expect(transformed.address.state).toBe('NY')
      expect(transformed.address.postcode).toBe('10024')
      
      // Validate event dates
      expect(transformed.eventDates).toHaveLength(2)
      expect(transformed.eventDates[0].name).toBe('Opening Night')
      expect(transformed.eventDates[1].name).toBe('Main Festival')
      
      // Validate contact info
      expect(transformed.emailAddresses.business).toBe('info@summermusicfest.com')
      expect(transformed.emailAddresses.booking).toBe('tickets@summermusicfest.com')
      expect(transformed.phoneNumbers.local).toBe('212-555-0123')
      expect(transformed.websites.business).toBe('https://summermusicfest.com')
      
      // Validate description from products
      expect(transformed.description).toBeDefined()
      expect(transformed.description?.root.children[0].children[0].text).toContain('ultimate summer music experience')
    })

    it('should handle events with minimal data gracefully', () => {
      const categoryMap = new Map()
      const transformer = new EventTransformer(categoryMap)
      const minimalEvent = realSamples.problematicCases.eventWithMissingFields
      
      expect(() => {
        const transformed = transformer.transform(minimalEvent)
        expect(transformed.title).toBe('Minimal Event')
        expect(transformed.eventDates).toHaveLength(1)
        expect(transformed.eventDates[0].allDay).toBe(true)
      }).not.toThrow()
    })
  })

  describe('Profiles from Real Data', () => {
    it('should transform real FedSync profile with "listing" type', () => {
      const categoryMap = new Map([[101, 'Restaurants'], [102, 'Cafes']])
      const amenityMap = new Map([[1, 'WiFi'], [5, 'Parking'], [12, 'Outdoor Seating']])
      const transformer = new ProfileTransformer(categoryMap, amenityMap)
      const realProfile = realSamples.realProfile
      
      // This should NOT fail with "Expected profile type, got listing"
      const transformed = transformer.transform(realProfile)
      
      expect(transformed.title).toBe('The Artisan Bakery')
      expect(transformed.externalId).toBe(67890)
      expect(transformed.trackingId).toBe('tab-brooklyn-001')
      
      // Validate location format [longitude, latitude]
      expect(transformed.location).toEqual([-73.9442, 40.6892])
      
      // Validate address
      expect(transformed.address.line1).toBe('456 Brooklyn Avenue')
      expect(transformed.address.line2).toBe('Suite 12')
      expect(transformed.address.city).toBe('Brooklyn')
      
      // Validate contact info
      expect(transformed.emailAddresses.business).toBe('hello@artisanbakery.com')
      expect(transformed.phoneNumbers.local).toBe('718-555-0456')
      expect(transformed.websites.business).toBe('https://artisanbakery.com')
      
      // Validate description
      expect(transformed.description?.root.children[0].children[0].text).toContain('Handcrafted artisan breads')
    })

    it('should handle problematic category formats', () => {
      const categoryMap = new Map()
      const amenityMap = new Map()
      const transformer = new ProfileTransformer(categoryMap, amenityMap)
      const problematicProfile = realSamples.problematicCases.profileWithStringCategories
      
      expect(() => {
        const transformed = transformer.transform(problematicProfile)
        expect(transformed.title).toBe('Business with String Categories')
        // Categories should be empty array to avoid ObjectId errors
        expect(Array.isArray(transformed.categories)).toBe(true)
      }).not.toThrow()
    })

    it('should handle invalid photo formats gracefully', () => {
      const categoryMap = new Map()
      const amenityMap = new Map()
      const transformer = new ProfileTransformer(categoryMap, amenityMap)
      const profileWithBadPhotos = realSamples.problematicCases.profileWithInvalidPhotos
      
      expect(() => {
        const transformed = transformer.transform(profileWithBadPhotos)
        expect(transformed.title).toBe('Business with Invalid Photos')
        // Photos should be disabled to avoid Media collection validation errors
        expect(transformed.photos).toEqual([])
      }).not.toThrow()
    })
  })

  describe('Data Format Edge Cases', () => {
    it('should handle missing nested objects', () => {
      const categoryMap = new Map()
      const transformer = new EventTransformer(categoryMap)
      
      const eventWithMissingNested = {
        ...realSamples.realEvent,
        email_addresses: undefined,
        phone_numbers: undefined,
        websites: undefined,
        socials: undefined
      }
      
      expect(() => {
        const transformed = transformer.transform(eventWithMissingNested)
        expect(transformed.title).toBe('Summer Music Festival')
      }).not.toThrow()
    })

    it('should handle string vs number type mismatches', () => {
      const categoryMap = new Map()
      const amenityMap = new Map()
      const transformer = new ProfileTransformer(categoryMap, amenityMap)
      
      const profileWithStringId = {
        ...realSamples.realProfile,
        external_id: '67890', // String instead of number
        latitude: '40.6892', // String instead of number
        longitude: '-73.9442' // String instead of number
      }
      
      expect(() => {
        const transformed = transformer.transform(profileWithStringId)
        expect(transformed.externalId).toBe('67890') // Should handle string
      }).not.toThrow()
    })
  })

  describe('Required Field Validation', () => {
    it('should validate required fields are present in real data', () => {
      const realEvent = realSamples.realEvent
      
      // These fields are required by our transformers
      expect(realEvent.name).toBeDefined()
      expect(realEvent.type).toBeDefined()
      expect(realEvent.external_id).toBeDefined()
      expect(realEvent.tracking_id).toBeDefined()
      expect(realEvent.address).toBeDefined()
      expect(realEvent.event_dates).toBeDefined()
      expect(Array.isArray(realEvent.event_dates)).toBe(true)
      expect(realEvent.event_dates.length).toBeGreaterThan(0)
    })

    it('should validate required address fields', () => {
      const realProfile = realSamples.realProfile
      
      expect(realProfile.address.line_1).toBeDefined()
      expect(realProfile.address.city).toBeDefined()
      expect(realProfile.address.state).toBeDefined()
      // postcode is optional in some regions
    })
  })
})