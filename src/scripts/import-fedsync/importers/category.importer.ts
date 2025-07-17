/**
 * Category Importer
 * 
 * Imports categories from FedSync JSON data into Payload CMS.
 * Categories are the foundation data that events and profiles depend on.
 */

import fs from 'fs/promises'
import { BaseImporter, ImportOptions, ImportResult } from './base.importer'
import { config } from '../config'
import { logger } from '../utils/logger'
import { ValidationError } from '../utils/errors'
import { ProgressTracker } from '../utils/progress'
import type { CategoriesFile, Category, ExtendedCategoryGroup } from '../types/fedsync.types'

export class CategoryImporter extends BaseImporter {
  private categoryMap: Map<number, string> = new Map()
  
  getCollectionName(): string {
    return 'categories'
  }
  
  async import(options: ImportOptions = {}): Promise<ImportResult> {
    this.options = { ...options }
    
    logger.info('Starting category import...')
    const progress = new ProgressTracker()
    
    try {
      await this.init()
      
      // Load categories file
      const categoriesData = await this.loadCategoriesFile()
      
      // Flatten the hierarchical structure
      const allCategories = this.flattenCategories(categoriesData.categories)
      
      // Apply limit if specified
      const categoriesToImport = options.limit 
        ? allCategories.slice(0, options.limit)
        : allCategories
      
      this.result.total = categoriesToImport.length
      progress.start('Importing categories', this.result.total)
      
      // Import categories in batches
      const batchSize = options.batchSize || config.import.batchSize
      
      for (let i = 0; i < categoriesToImport.length; i += batchSize) {
        const batch = categoriesToImport.slice(i, i + batchSize)
        await this.processBatch(batch)
        
        progress.update(Math.min(i + batchSize, categoriesToImport.length))
        
        // Run garbage collection periodically
        await this.runGarbageCollection()
      }
      
      progress.succeed(`Imported ${this.result.success} categories successfully`)
      
      // Log category map for debugging
      logger.debug(`Category map contains ${this.categoryMap.size} entries`)
      
    } catch (error: any) {
      progress.fail(`Category import failed: ${error.message}`)
      throw error
    }
    
    return this.finalize()
  }
  
  /**
   * Load and parse categories JSON file
   */
  private async loadCategoriesFile(): Promise<CategoriesFile> {
    try {
      const data = await fs.readFile(config.paths.categories, 'utf-8')
      return JSON.parse(data)
    } catch (error: any) {
      throw new ValidationError(
        `Failed to load categories file: ${error.message}`,
        { path: config.paths.categories }
      )
    }
  }
  
  /**
   * Flatten hierarchical category structure
   */
  private flattenCategories(groups: ExtendedCategoryGroup[]): any[] {
    const flattened: any[] = []
    
    for (const group of groups) {
      // Add group as a parent category
      flattened.push({
        name: group.name,
        type: 'group',
        externalId: `group-${group.id}`,
        isGroup: true,
      })
      
      // Add child categories
      if (group.categories && Array.isArray(group.categories)) {
        for (const category of group.categories) {
          flattened.push({
            name: category.name,
            type: category.type || 'general',
            externalId: category.id,
            groupName: group.name,
            isGroup: false,
          })
          
          // Build lookup map
          this.categoryMap.set(category.id, category.name)
        }
      }
    }
    
    return flattened
  }
  
  /**
   * Transform category data to Payload format
   */
  async transform(source: any): Promise<any> {
    return {
      name: source.name,
      type: source.type,
      externalId: source.externalId,
      // Add any additional fields as needed
    }
  }
  
  /**
   * Get the category map for use by other importers
   */
  getCategoryMap(): Map<number, string> {
    return this.categoryMap
  }
  
  /**
   * Resolve category name to ID
   */
  async resolveCategoryId(categoryName: string): Promise<string | null> {
    try {
      const result = await this.payload.find({
        collection: 'categories',
        where: {
          name: { equals: categoryName }
        },
        limit: 1,
      })
      
      return result.docs.length > 0 ? result.docs[0].id : null
    } catch (error) {
      logger.error(`Failed to resolve category "${categoryName}":`, error)
      return null
    }
  }
}