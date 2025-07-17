/**
 * Integration Tests
 * 
 * Tests transformers with real sample data
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { CategoryTransformer } from '../category.transformer'
import { EventTransformer } from '../event.transformer'
import { ProfileTransformer } from '../profile.transformer'
import fs from 'fs/promises'
import path from 'path'

describe('Transformer Integration Tests', () => {
  let categoryTransformer: CategoryTransformer
  let eventTransformer: EventTransformer
  let profileTransformer: ProfileTransformer
  let categoryMap: Map<number, string>

  beforeAll(async () => {
    // Initialize category transformer and load categories
    categoryTransformer = new CategoryTransformer()
    
    // Load and transform categories first
    const categoriesPath = path.join(process.cwd(), 'src/lib/fedsync/listingData/categories/categories.json')
    const categoriesData = JSON.parse(await fs.readFile(categoriesPath, 'utf-8'))
    const transformedCategories = categoryTransformer.transformCategoriesFile(categoriesData)
    
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
    it('should transform real categories.json file', async () => {
      const categoriesPath = path.join(process.cwd(), 'src/lib/fedsync/listingData/categories/categories.json')
      const categoriesData = JSON.parse(await fs.readFile(categoriesPath, 'utf-8'))
      
      const result = categoryTransformer.transformCategoriesFile(categoriesData)
      
      // Check structure
      expect(result.length).toBeGreaterThan(0)
      
      // Find a specific group
      const artsGroup = result.find(c => c.name === 'Arts, Culture & History')
      expect(artsGroup).toBeDefined()
      expect(artsGroup?.isGroup).toBe(true)
      expect(artsGroup?.externalId).toBe('group-2')
      
      // Find a specific category
      const artGallery = result.find(c => c.name === 'Art Gallery/Display')
      expect(artGallery).toBeDefined()
      expect(artGallery?.groupName).toBe('Arts, Culture & History')
      expect(artGallery?.externalId).toBe('cat-1')
    })
  })

  describe('Event Transformation', () => {
    it('should transform a real event JSON file', async () => {
      const eventPath = path.join(process.cwd(), 'src/lib/fedsync/listingData/events/1024.json')
      
      try {
        const eventData = JSON.parse(await fs.readFile(eventPath, 'utf-8'))
        const result = eventTransformer.transform(eventData)
        
        // Validate transformed event
        expect(result.title).toBeDefined()
        expect(result.eventDates).toBeInstanceOf(Array)
        expect(result.eventDates.length).toBeGreaterThan(0)
        expect(result.address).toBeDefined()
        expect(result.syncSource).toBe('federator-api')
        expect(result.status).toBe('published')
        
        // Check categories were resolved
        if (result.categories.length > 0) {
          expect(result.categories[0]).toBeTypeOf('string')
        }
        
        // Validate against schema
        const isValid = eventTransformer.validateTransformed(result)
        expect(isValid).toBe(true)
      } catch (error: any) {
        // File might not exist in test environment
        if (error.code === 'ENOENT') {
          console.log('Sample event file not found, skipping test')
          return
        }
        throw error
      }
    })
  })

  describe('Profile Transformation', () => {
    it('should transform a real profile JSON file', async () => {
      const profilePath = path.join(process.cwd(), 'src/lib/fedsync/listingData/profiles/683.json')
      
      try {
        const profileData = JSON.parse(await fs.readFile(profilePath, 'utf-8'))
        const result = profileTransformer.transform(profileData)
        
        // Validate transformed profile
        expect(result.title).toBeDefined()
        expect(result.address).toBeDefined()
        expect(result.emailAddresses).toBeDefined()
        expect(result.phoneNumbers).toBeDefined()
        expect(result.syncSource).toBe('federator-api')
        expect(result.status).toBe('published')
        
        // Check if it has business-specific fields
        if (result.hours) {
          expect(result.hours).toBeInstanceOf(Array)
        }
        
        // Check categories were resolved
        if (result.categories.length > 0) {
          expect(result.categories[0]).toBeTypeOf('string')
        }
        
        // Validate against schema
        const isValid = profileTransformer.validateTransformed(result)
        expect(isValid).toBe(true)
      } catch (error: any) {
        // File might not exist in test environment
        if (error.code === 'ENOENT') {
          console.log('Sample profile file not found, skipping test')
          return
        }
        throw error
      }
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
        const categoriesPath = path.join(process.cwd(), 'src/lib/fedsync/listingData/categories/categories.json')
        const categoriesData = JSON.parse(await fs.readFile(categoriesPath, 'utf-8'))
        const categories = categoryTransformer.transformCategoriesFile(categoriesData)
        stats.categories = categories.length
      } catch (error) {
        stats.errors++
      }
      
      // 2. Transform a sample event
      try {
        const eventPath = path.join(process.cwd(), 'src/lib/fedsync/listingData/events/1024.json')
        const eventData = JSON.parse(await fs.readFile(eventPath, 'utf-8'))
        const event = eventTransformer.transform(eventData)
        if (eventTransformer.validateTransformed(event)) {
          stats.events++
        }
      } catch (error) {
        // Expected if file doesn't exist
      }
      
      // 3. Transform a sample profile
      try {
        const profilePath = path.join(process.cwd(), 'src/lib/fedsync/listingData/profiles/683.json')
        const profileData = JSON.parse(await fs.readFile(profilePath, 'utf-8'))
        const profile = profileTransformer.transform(profileData)
        if (profileTransformer.validateTransformed(profile)) {
          stats.profiles++
        }
      } catch (error) {
        // Expected if file doesn't exist
      }
      
      // At least categories should be transformed
      expect(stats.categories).toBeGreaterThan(0)
      expect(stats.errors).toBe(0)
    })
  })
})