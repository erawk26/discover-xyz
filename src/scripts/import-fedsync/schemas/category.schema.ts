/**
 * Category Schema Definitions
 * 
 * Zod schemas for validating category data from FedSync
 */

import { z } from 'zod'

// FedSync Category Schema
export const CategorySchema = z.object({
  id: z.number(),
  name: z.string().min(1, { message: 'Name must be at least 1 character' }).trim(),
  type: z.string().optional(),
})

// Extended CategoryGroup Schema with nested categories
export const CategoryGroupSchema = z.object({
  id: z.union([z.number(), z.string()]),
  name: z.string().min(1),
  categories: z.array(CategorySchema).optional(),
})

// Transformed Category Schema for Payload CMS
export const TransformedCategorySchema = z.object({
  title: z.string().min(1),
  type: z.enum(['group', 'category']),
  externalId: z.string(),
  parent: z.string().optional(), // Payload ID of parent category
  isGroup: z.boolean().optional(), // Backward compatibility
  groupName: z.string().optional(), // Backward compatibility
})

// Type exports
export type Category = z.infer<typeof CategorySchema>
export type CategoryGroup = z.infer<typeof CategoryGroupSchema>
export type TransformedCategory = z.infer<typeof TransformedCategorySchema>