/**
 * Validation and Rollback Utilities
 *
 * Provides data validation and rollback capabilities for import operations
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import { Logger, LogLevel } from '@/lib/fedsync/src/logger'
import fs from 'fs/promises'
import path from 'path'

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  type: 'structure' | 'data' | 'schema' | 'reference'
  file?: string
  field?: string
  message: string
  suggestion?: string
}

export interface ValidationWarning {
  type: 'data' | 'performance' | 'compatibility'
  file?: string
  field?: string
  message: string
  impact: 'low' | 'medium' | 'high'
}

export interface RollbackPoint {
  id: string
  timestamp: Date
  description: string
  collections: string[]
  itemIds: Record<string, string[]>
}

export class DataValidator {
  private logger: Logger
  private payload: any

  constructor(logger?: Logger) {
    this.logger = logger || new Logger({ level: LogLevel.INFO })
  }

  async initialize(): Promise<void> {
    this.payload = await getPayload({ config })
  }

  /**
   * Validate FedSync data directory structure
   */
  async validateDataStructure(dataPath: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    }

    try {
      // Check if data path exists
      await fs.access(dataPath)
    } catch {
      result.errors.push({
        type: 'structure',
        message: `Data directory not found: ${dataPath}`,
        suggestion: 'Ensure the FedSync data directory exists and is accessible',
      })
      result.isValid = false
      return result
    }

    // Expected directory structure
    const expectedDirs = ['categories', 'events', 'profiles', 'amenities']

    for (const dir of expectedDirs) {
      const dirPath = path.join(dataPath, dir)
      try {
        const stat = await fs.stat(dirPath)
        if (!stat.isDirectory()) {
          result.warnings.push({
            type: 'data',
            message: `Expected directory but found file: ${dir}`,
            impact: 'medium',
          })
        }
      } catch {
        if (dir === 'categories') {
          result.errors.push({
            type: 'structure',
            message: `Required directory missing: ${dir}`,
            suggestion: 'Categories directory is required for import',
          })
          result.isValid = false
        } else {
          result.warnings.push({
            type: 'data',
            message: `Optional directory missing: ${dir}`,
            impact: 'low',
          })
        }
      }
    }

    return result
  }

  /**
   * Validate JSON files in a directory
   */
  async validateJsonFiles(dirPath: string, maxSampleSize: number = 10): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    }

    try {
      const files = await fs.readdir(dirPath)
      const jsonFiles = files.filter((f) => f.endsWith('.json'))

      if (jsonFiles.length === 0) {
        result.warnings.push({
          type: 'data',
          message: `No JSON files found in ${dirPath}`,
          impact: 'medium',
        })
        return result
      }

      // Sample files for validation
      const sampleFiles = jsonFiles.slice(0, maxSampleSize)

      for (const file of sampleFiles) {
        const filePath = path.join(dirPath, file)
        try {
          const content = await fs.readFile(filePath, 'utf-8')
          JSON.parse(content)
        } catch (error: any) {
          result.errors.push({
            type: 'data',
            file: file,
            message: `Invalid JSON: ${error.message}`,
            suggestion: 'Fix JSON syntax errors in the file',
          })
          result.isValid = false
        }
      }

      // Performance warning for large datasets
      if (jsonFiles.length > 10000) {
        result.warnings.push({
          type: 'performance',
          message: `Large dataset detected: ${jsonFiles.length} files`,
          impact: 'medium',
        })
      }
    } catch (error: any) {
      result.errors.push({
        type: 'structure',
        message: `Failed to read directory: ${error.message}`,
        suggestion: 'Ensure directory is accessible and readable',
      })
      result.isValid = false
    }

    return result
  }

  /**
   * Validate data against schemas
   */
  async validateAgainstSchemas(dataPath: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    }

    // TODO: Implement schema validation using our Zod schemas
    // This would validate sample data against CategorySchema, EventSchema, etc.

    result.warnings.push({
      type: 'compatibility',
      message: 'Schema validation not yet implemented',
      impact: 'low',
    })

    return result
  }

  /**
   * Validate Payload CMS collections exist
   */
  async validatePayloadCollections(): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    }

    const requiredCollections = ['categories', 'events', 'profiles']

    try {
      if (!this.payload) {
        await this.initialize()
      }

      const collections = this.payload.config.collections.map((c: any) => c.slug)

      for (const collection of requiredCollections) {
        if (!collections.includes(collection)) {
          result.errors.push({
            type: 'schema',
            message: `Required Payload collection missing: ${collection}`,
            suggestion: `Add ${collection} collection to your Payload config`,
          })
          result.isValid = false
        }
      }
    } catch (error: any) {
      result.errors.push({
        type: 'schema',
        message: `Failed to validate Payload collections: ${error.message}`,
        suggestion: 'Ensure Payload CMS is properly configured and accessible',
      })
      result.isValid = false
    }

    return result
  }
}

export class RollbackManager {
  private logger: Logger
  private payload: any
  private rollbackPoints: Map<string, RollbackPoint> = new Map()

  constructor(logger?: Logger) {
    this.logger = logger || new Logger({ level: LogLevel.INFO })
  }

  async initialize(): Promise<void> {
    this.payload = await getPayload({ config })
  }

  /**
   * Create a rollback point before import
   */
  async createRollbackPoint(description: string, collections: string[]): Promise<string> {
    if (!this.payload) {
      await this.initialize()
    }

    const rollbackId = `rollback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const rollbackPoint: RollbackPoint = {
      id: rollbackId,
      timestamp: new Date(),
      description,
      collections,
      itemIds: {},
    }

    // Record current state of collections
    for (const collection of collections) {
      try {
        const existing = await this.payload.find({
          collection,
          limit: 0, // Get count only
          where: {
            syncSource: { equals: 'federator-api' },
          },
        })

        rollbackPoint.itemIds[collection] = existing.docs.map((doc: any) => doc.id)
        this.logger.debug(`Recorded ${existing.totalDocs} existing items in ${collection}`)
      } catch (error: any) {
        this.logger.warn(`Failed to record rollback state for ${collection}: ${error.message}`)
      }
    }

    this.rollbackPoints.set(rollbackId, rollbackPoint)
    this.logger.info(`Created rollback point: ${rollbackId}`)

    return rollbackId
  }

  /**
   * Execute rollback to a specific point
   */
  async executeRollback(rollbackId: string): Promise<boolean> {
    const rollbackPoint = this.rollbackPoints.get(rollbackId)

    if (!rollbackPoint) {
      this.logger.error(`Rollback point not found: ${rollbackId}`)
      return false
    }

    if (!this.payload) {
      await this.initialize()
    }

    this.logger.info(`Starting rollback to: ${rollbackPoint.description}`)

    try {
      for (const collection of rollbackPoint.collections) {
        await this.rollbackCollection(collection, rollbackPoint.itemIds[collection] || [])
      }

      this.logger.info(`Rollback completed successfully`)
      return true
    } catch (error: any) {
      this.logger.error(`Rollback failed: ${error.message}`)
      return false
    }
  }

  /**
   * Rollback a specific collection
   */
  private async rollbackCollection(collection: string, preserveIds: string[]): Promise<void> {
    this.logger.info(`Rolling back collection: ${collection}`)

    // Find all items that were imported (have syncSource = 'federator-api')
    const imported = await this.payload.find({
      collection,
      limit: 0,
      where: {
        syncSource: { equals: 'federator-api' },
      },
    })

    // Delete items that weren't in the original state
    const toDelete = imported.docs.filter((doc: any) => !preserveIds.includes(doc.id))

    this.logger.info(`Deleting ${toDelete.length} imported items from ${collection}`)

    for (const item of toDelete) {
      try {
        await this.payload.delete({
          collection,
          id: item.id,
        })
      } catch (error: any) {
        this.logger.warn(`Failed to delete ${collection} item ${item.id}: ${error.message}`)
      }
    }

    this.logger.info(`Rollback completed for ${collection}`)
  }

  /**
   * List available rollback points
   */
  listRollbackPoints(): RollbackPoint[] {
    return Array.from(this.rollbackPoints.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    )
  }

  /**
   * Clean up old rollback points
   */
  cleanupOldRollbackPoints(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now()

    for (const [id, point] of this.rollbackPoints.entries()) {
      if (now - point.timestamp.getTime() > maxAge) {
        this.rollbackPoints.delete(id)
        this.logger.debug(`Cleaned up old rollback point: ${id}`)
      }
    }
  }
}
