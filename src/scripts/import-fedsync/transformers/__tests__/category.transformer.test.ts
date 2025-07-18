/**
 * Category Transformer Tests
 * 
 * TDD: Writing tests BEFORE implementation
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CategoryTransformer } from '../category.transformer'
import type { Category, CategoryGroup } from '../../schemas/category.schema'

describe('CategoryTransformer', () => {
  let transformer: CategoryTransformer

  beforeEach(() => {
    transformer = new CategoryTransformer()
  })

  describe('transformCategory', () => {
    it('should transform a basic category', () => {
      const category: Category = {
        id: 1,
        name: 'Art Gallery/Display',
      }

      const result = transformer.transformCategory(category)

      expect(result).toEqual({
        title: 'Art Gallery/Display', // Fixed: uses 'title' not 'name' for Payload
        type: 'general',
        externalId: 'cat-1',
      })
    })

    it('should transform a category with type', () => {
      const category = {
        id: 2,
        name: 'Restaurant',
        type: 'listing',
      }

      const result = transformer.transformCategory(category)

      expect(result).toEqual({
        title: 'Restaurant', // Fixed: uses 'title' not 'name' for Payload
        type: 'listing',
        externalId: 'cat-2',
      })
    })

    it('should handle category with group context', () => {
      const category: Category = {
        id: 3,
        name: 'Museums',
      }
      const groupName = 'Arts, Culture & History'

      const result = transformer.transformCategory(category, groupName)

      expect(result).toEqual({
        title: 'Museums', // Fixed: uses 'title' not 'name' for Payload
        type: 'general',
        externalId: 'cat-3',
        groupName: 'Arts, Culture & History',
      })
    })

    it('should trim category names', () => {
      const category: Category = {
        id: 4,
        name: '  Hotels & Motels  ',
      }

      const result = transformer.transformCategory(category)

      expect(result.title).toBe('Hotels & Motels') // Fixed: 'title' field
    })

    it('should generate correct external IDs', () => {
      const category1 = { id: 100, name: 'Test 1' }
      const category2 = { id: 200, name: 'Test 2' }

      const result1 = transformer.transformCategory(category1)
      const result2 = transformer.transformCategory(category2)

      expect(result1.externalId).toBe('cat-100')
      expect(result2.externalId).toBe('cat-200')
    })
  })

  describe('transformCategoryGroup', () => {
    it('should transform a category group', () => {
      const group: CategoryGroup = {
        id: 2,
        name: 'Arts, Culture & History',
      }

      const result = transformer.transformCategoryGroup(group)

      expect(result).toEqual({
        title: 'Arts, Culture & History', // Fixed: uses 'title' not 'name' for Payload
        type: 'group',
        externalId: 'group-2',
        isGroup: true,
      })
    })

    it('should handle string group IDs', () => {
      const group: CategoryGroup = {
        id: 123,
        name: 'Custom Group',
      }

      const result = transformer.transformCategoryGroup(group)

      expect(result.externalId).toBe('group-123')
    })
  })

  describe('transformCategoriesFile', () => {
    it('should transform entire categories file structure', () => {
      const categoriesFile = {
        categories: [
          {
            id: 2,
            name: 'Arts, Culture & History',
            categories: [
              { id: 1, name: 'Art Gallery/Display' },
              { id: 3, name: 'Museums' },
            ]
          },
          {
            id: 5,
            name: 'Dining',
            categories: [
              { id: 10, name: 'Restaurant' },
              { id: 11, name: 'Cafe' },
            ]
          }
        ]
      }

      const result = transformer.transformCategoriesFile(categoriesFile)

      expect(result).toHaveLength(6) // 2 groups + 4 categories
      expect(result[0]).toEqual({
        title: 'Arts, Culture & History', // Fixed: uses 'title' not 'name' for Payload
        type: 'group',
        externalId: 'group-2',
        isGroup: true,
      })
      expect(result[1]).toEqual({
        title: 'Art Gallery/Display', // Fixed: uses 'title' not 'name' for Payload
        type: 'general',
        externalId: 'cat-1',
        groupName: 'Arts, Culture & History',
      })
    })

    it('should handle groups without nested categories', () => {
      const categoriesFile = {
        categories: [
          {
            id: 1,
            name: 'Empty Group',
          }
        ]
      }

      const result = transformer.transformCategoriesFile(categoriesFile)

      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Empty Group') // Fixed: 'title' field
      expect(result[0].isGroup).toBe(true)
    })

    it('should preserve original data structure for reference', () => {
      const categoriesFile = {
        categories: [
          {
            id: 1,
            name: 'Test Group',
            categories: [
              { id: 2, name: 'Test Category', customField: 'value' }
            ]
          }
        ]
      }

      const result = transformer.transformCategoriesFile(categoriesFile)
      
      // Should have both group and category
      expect(result).toHaveLength(2)
      
      // Category should have group reference
      const category = result.find(r => r.externalId === 'cat-2')
      expect(category?.groupName).toBe('Test Group')
    })
  })

  describe('getCategoryMap', () => {
    it('should build a category ID to name map', () => {
      const categoriesFile = {
        categories: [
          {
            id: 1,
            name: 'Group 1',
            categories: [
              { id: 10, name: 'Category A' },
              { id: 20, name: 'Category B' },
            ]
          }
        ]
      }

      transformer.transformCategoriesFile(categoriesFile)
      const map = transformer.getCategoryMap()

      expect(map.get(10)).toBe('Category A')
      expect(map.get(20)).toBe('Category B')
      expect(map.size).toBeGreaterThanOrEqual(2)
    })
  })

  describe('validation', () => {
    it('should validate transformed categories', () => {
      const category: Category = {
        id: 1,
        name: 'Valid Category',
      }

      const result = transformer.transformCategory(category)
      const isValid = transformer.validateTransformed(result)

      expect(isValid).toBe(true)
    })

    it('should reject invalid transformed data', () => {
      const invalidData = {
        // Missing required fields
        type: 'general',
      }

      const isValid = transformer.validateTransformed(invalidData)

      expect(isValid).toBe(false)
    })
  })
})