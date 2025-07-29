/**
 * Integration Tests
 * 
 * Tests transformers with real sample data
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { CategoryTransformer } from '../category.transformer'
import { EventTransformer } from '../event.transformer'
import { ProfileTransformer } from '../profile.transformer'
import * as fs from 'fs/promises'
import * as path from 'path'

describe('Transformer Integration Tests', () => {
  let categoryTransformer: CategoryTransformer
  let eventTransformer: EventTransformer
  let profileTransformer: ProfileTransformer
  let categoryMap: Map<number, string>
  let fixtureData: any

  beforeAll(async () => {
    // Load fixture data
    const fixturePath = path.join(__dirname, '../../__tests__/fixtures/real-fedsync-samples.json')
    fixtureData = JSON.parse(await fs.readFile(fixturePath, 'utf-8'))
    
    // Initialize category transformer and load categories
    categoryTransformer = new CategoryTransformer()
    
    // Transform categories from fixture
    const transformedCategories = categoryTransformer.transformCategoriesFile(fixtureData.categories)
    
    // Get category map for other transformers
    categoryMap = categoryTransformer.getCategoryMap()
    
    // Create mock amenity map for profile transformer
    const amenityMap = new Map([
      [1, 'WiFi'],
      [2, 'Parking'],
      [3, 'Pool'],
    ])
    
    // Initialize other transformers
    eventTransformer = new EventTransformer(categoryMap)
    profileTransformer = new ProfileTransformer(categoryMap, amenityMap)
  })

  describe('Category Transformation', () => {
    it('should transform real categories from fixture data', async () => {
      const result = categoryTransformer.transformCategoriesFile(fixtureData.categories)
      
      // Check structure
      expect(result.length).toBeGreaterThan(0)
      
      // Find a specific group
      const foodGroup = result.find(c => c.title === 'Food & Drink')
      expect(foodGroup).toBeDefined()
      expect(foodGroup?.isGroup).toBe(true)
      expect(foodGroup?.externalId).toBe('group-1')
      
      // Find a specific category
      const restaurants = result.find(c => c.title === 'Restaurants')
      expect(restaurants).toBeDefined()
      expect(restaurants?.groupName).toBe('Food & Drink')
      expect(restaurants?.externalId).toBe('cat-101')
    })
  })

  describe('Event Transformation', () => {
    it('should transform a real event from fixture data', async () => {
      const result = eventTransformer.transform(fixtureData.realEvent)
      
      // Validate transformed event
      expect(result.title).toBe('Summer Music Festival')
      expect(result.eventDates).toBeInstanceOf(Array)
      expect(result.eventDates.length).toBe(2)
      expect(result.address).toBeDefined()
      expect(result.syncSource).toBe('federator-api')
      expect(result.status).toBe('published')
      
      // Check event dates
      expect(result.eventDates[0].name).toBe('Opening Night')
      expect(result.eventDates[0].startDate).toBe('2024-07-15')
      
      // Validate against schema
      const isValid = eventTransformer.validateTransformed(result)
      expect(isValid).toBe(true)
    })
  })

  describe('Profile Transformation', () => {
    it('should transform a real profile from fixture data', async () => {
      const result = profileTransformer.transform(fixtureData.realProfile)
      
      // Validate transformed profile
      expect(result.title).toBe('The Artisan Bakery')
      expect(result.address).toBeDefined()
      expect(result.emailAddresses).toBeDefined()
      expect(result.phoneNumbers).toBeDefined()
      expect(result.syncSource).toBe('federator-api')
      expect(result.status).toBe('published')
      
      // Check address fields
      expect(result.address.line1).toBeDefined()
      expect(result.address.city).toBeDefined()
      expect(result.address.state).toBeDefined()
      
      // Validate against schema
      const isValid = profileTransformer.validateTransformed(result)
      expect(isValid).toBe(true)
    })
  })

  describe('End-to-End Workflow', () => {
    it('should handle the complete transformation workflow', async () => {
      // This test simulates the actual import process
      const stats = {
        categories: 0,
        events: 0,
        profiles: 0,
        errors: 0,
      }
      
      // 1. Transform categories
      try {
        const categories = categoryTransformer.transformCategoriesFile(fixtureData.categories)
        stats.categories = categories.length
      } catch (error) {
        stats.errors++
      }
      
      // 2. Transform the sample event
      try {
        const event = eventTransformer.transform(fixtureData.realEvent)
        if (eventTransformer.validateTransformed(event)) {
          stats.events++
        }
      } catch (error) {
        stats.errors++
      }
      
      // 3. Transform the sample profile
      try {
        const profile = profileTransformer.transform(fixtureData.realProfile)
        if (profileTransformer.validateTransformed(profile)) {
          stats.profiles++
        }
      } catch (error) {
        stats.errors++
      }
      
      // All should be transformed successfully
      expect(stats.categories).toBeGreaterThan(0)
      expect(stats.events).toBe(1)
      expect(stats.profiles).toBe(1)
      expect(stats.errors).toBe(0)
    })
  })
})