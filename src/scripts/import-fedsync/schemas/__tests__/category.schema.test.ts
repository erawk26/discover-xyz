/**
 * Category Schema Tests
 * 
 * TDD: Writing tests BEFORE implementation
 */

import { describe, it, expect } from 'vitest'
import { CategorySchema, CategoryGroupSchema, TransformedCategorySchema } from '../category.schema'
import type { Category, ExtendedCategoryGroup } from '../../types/fedsync.types'

describe('CategorySchema', () => {
  describe('FedSync Category Validation', () => {
    it('should validate a valid category', () => {
      const validCategory: Category = {
        id: 1,
        name: 'Art Gallery/Display',
      }
      
      const result = CategorySchema.safeParse(validCategory)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validCategory)
      }
    })

    it('should validate a category with optional type field', () => {
      const categoryWithType = {
        id: 1,
        name: 'Art Gallery/Display',
        type: 'listing',
      }
      
      const result = CategorySchema.safeParse(categoryWithType)
      expect(result.success).toBe(true)
    })

    it('should reject category without required id', () => {
      const invalidCategory = {
        name: 'Art Gallery/Display',
      }
      
      const result = CategorySchema.safeParse(invalidCategory)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('id')
      }
    })

    it('should reject category without required name', () => {
      const invalidCategory = {
        id: 1,
      }
      
      const result = CategorySchema.safeParse(invalidCategory)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name')
      }
    })

    it('should reject category with invalid id type', () => {
      const invalidCategory = {
        id: 'not-a-number',
        name: 'Art Gallery/Display',
      }
      
      const result = CategorySchema.safeParse(invalidCategory)
      expect(result.success).toBe(false)
    })

    it('should reject empty category name', () => {
      const invalidCategory = {
        id: 1,
        name: '',
      }
      
      const result = CategorySchema.safeParse(invalidCategory)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 1 character')
      }
    })

    it('should trim whitespace from category name', () => {
      const categoryWithWhitespace = {
        id: 1,
        name: '  Art Gallery/Display  ',
      }
      
      const result = CategorySchema.safeParse(categoryWithWhitespace)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Art Gallery/Display')
      }
    })
  })

  describe('CategoryGroup Validation', () => {
    it('should validate a valid category group', () => {
      const validGroup: ExtendedCategoryGroup = {
        id: 2,
        name: 'Arts, Culture & History',
        categories: [
          { id: 1, name: 'Art Gallery/Display' },
          { id: 2, name: 'Archaeology & Paleontology' },
        ]
      }
      
      const result = CategoryGroupSchema.safeParse(validGroup)
      expect(result.success).toBe(true)
    })

    it('should validate category group without nested categories', () => {
      const groupWithoutCategories = {
        id: 2,
        name: 'Arts, Culture & History',
      }
      
      const result = CategoryGroupSchema.safeParse(groupWithoutCategories)
      expect(result.success).toBe(true)
    })

    it('should reject category group with invalid nested categories', () => {
      const invalidGroup = {
        id: 2,
        name: 'Arts, Culture & History',
        categories: [
          { id: 1 }, // Missing name
        ]
      }
      
      const result = CategoryGroupSchema.safeParse(invalidGroup)
      expect(result.success).toBe(false)
    })
  })

  describe('Transformed Category Schema', () => {
    it('should validate a transformed category for Payload', () => {
      const transformedCategory = {
        name: 'Art Gallery/Display',
        type: 'listing',
        externalId: 'cat-1',
      }
      
      const result = TransformedCategorySchema.safeParse(transformedCategory)
      expect(result.success).toBe(true)
    })

    it('should validate a transformed category group', () => {
      const transformedGroup = {
        name: 'Arts, Culture & History',
        type: 'group',
        externalId: 'group-2',
        isGroup: true,
      }
      
      const result = TransformedCategorySchema.safeParse(transformedGroup)
      expect(result.success).toBe(true)
    })

    it('should reject transformed category without name', () => {
      const invalidTransformed = {
        type: 'listing',
        externalId: 'cat-1',
      }
      
      const result = TransformedCategorySchema.safeParse(invalidTransformed)
      expect(result.success).toBe(false)
    })

    it('should reject transformed category without externalId', () => {
      const invalidTransformed = {
        name: 'Art Gallery/Display',
        type: 'listing',
      }
      
      const result = TransformedCategorySchema.safeParse(invalidTransformed)
      expect(result.success).toBe(false)
    })

    it('should allow additional fields for extensibility', () => {
      const categoryWithExtra = {
        name: 'Art Gallery/Display',
        type: 'listing',
        externalId: 'cat-1',
        groupName: 'Arts, Culture & History',
        customField: 'some value',
      }
      
      const result = TransformedCategorySchema.safeParse(categoryWithExtra)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveProperty('groupName')
        expect(result.data).toHaveProperty('customField')
      }
    })
  })
})

