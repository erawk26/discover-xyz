/**
 * Category Transformer
 * 
 * Transforms FedSync category data to Payload CMS format
 */

import { TransformedCategorySchema } from '../schemas/category.schema'
import type { Category, CategoryGroup, TransformedCategory } from '../schemas/category.schema'

export class CategoryTransformer {
  private categoryMap: Map<number, string> = new Map()

  /**
   * Transform a single category
   */
  transformCategory(category: Category, groupName?: string, parentId?: string): TransformedCategory {
    const transformed = {
      title: category.name.trim(),
      type: 'category', // Individual categories have type 'category'
      externalId: `cat-${category.id}`,
      ...(parentId && { parent: parentId }), // Reference to parent group by ID
      ...(groupName && { groupName }) // Keep for backward compatibility
    }

    return transformed
  }

  /**
   * Transform a category group
   */
  transformCategoryGroup(group: CategoryGroup): TransformedCategory {
    return {
      title: group.name,
      type: 'group',
      externalId: `group-${group.id}`,
      isGroup: true,
    }
  }

  /**
   * Transform entire categories file structure
   */
  transformCategoriesFile(categoriesFile: { categories: CategoryGroup[] }): TransformedCategory[] {
    const transformed: TransformedCategory[] = []

    for (const group of categoriesFile.categories) {
      // Add the group
      transformed.push(this.transformCategoryGroup(group))

      // Add nested categories if they exist
      if (group.categories && Array.isArray(group.categories)) {
        for (const category of group.categories) {
          transformed.push(this.transformCategory(category, group.name))
          
          // Build the category map
          this.categoryMap.set(category.id, category.name)
        }
      }
    }

    return transformed
  }

  /**
   * Get the category map for lookups
   */
  getCategoryMap(): Map<number, string> {
    return this.categoryMap
  }

  /**
   * Validate transformed data
   */
  validateTransformed(data: any): boolean {
    const result = TransformedCategorySchema.safeParse(data)
    return result.success
  }
}