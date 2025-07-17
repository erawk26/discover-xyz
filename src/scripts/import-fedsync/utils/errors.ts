/**
 * Error Handling Utilities
 * 
 * Custom error classes and error handling utilities
 * for the FedSync import system.
 */

import { logger } from './logger'

/**
 * Base error class for import errors
 */
export class ImportError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ImportError'
  }
}

/**
 * Validation error
 */
export class ValidationError extends ImportError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

/**
 * Data transformation error
 */
export class TransformationError extends ImportError {
  constructor(message: string, details?: any) {
    super(message, 'TRANSFORMATION_ERROR', details)
    this.name = 'TransformationError'
  }
}

/**
 * File system error
 */
export class FileSystemError extends ImportError {
  constructor(message: string, details?: any) {
    super(message, 'FILESYSTEM_ERROR', details)
    this.name = 'FileSystemError'
  }
}

/**
 * Database/Payload error
 */
export class DatabaseError extends ImportError {
  constructor(message: string, details?: any) {
    super(message, 'DATABASE_ERROR', details)
    this.name = 'DatabaseError'
  }
}

/**
 * Network/API error
 */
export class NetworkError extends ImportError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', details)
    this.name = 'NetworkError'
  }
}

/**
 * Error handler with retry capability
 */
export class ErrorHandler {
  private retryDelays = [1000, 2000, 5000] // Exponential backoff
  
  /**
   * Handle error with optional retry
   */
  async handle<T>(
    operation: () => Promise<T>,
    options: {
      retries?: number
      onError?: (error: Error, attempt: number) => void
      shouldRetry?: (error: Error) => boolean
    } = {}
  ): Promise<T> {
    const { retries = 0, onError, shouldRetry = this.isRetryable } = options
    
    let lastError: Error
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        if (onError) {
          onError(lastError, attempt)
        }
        
        if (attempt < retries && shouldRetry(lastError)) {
          const delay = this.retryDelays[Math.min(attempt, this.retryDelays.length - 1)]
          logger.warn(`Retry attempt ${attempt + 1}/${retries} after ${delay}ms`)
          await this.sleep(delay)
        } else {
          break
        }
      }
    }
    
    throw lastError!
  }
  
  /**
   * Check if error is retryable
   */
  private isRetryable(error: Error): boolean {
    // Network errors are retryable
    if (error instanceof NetworkError) {
      return true
    }
    
    // Database connection errors might be retryable
    if (error instanceof DatabaseError) {
      return error.message.includes('connection') || 
             error.message.includes('timeout')
    }
    
    // Rate limit errors
    if (error.message.includes('rate limit') || 
        error.message.includes('too many requests')) {
      return true
    }
    
    return false
  }
  
  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  /**
   * Format error for logging
   */
  static format(error: unknown): string {
    if (error instanceof ImportError) {
      return `${error.name}: ${error.message} (${error.code})${
        error.details ? '\nDetails: ' + JSON.stringify(error.details, null, 2) : ''
      }`
    }
    
    if (error instanceof Error) {
      return `${error.name}: ${error.message}${
        error.stack ? '\n' + error.stack : ''
      }`
    }
    
    return String(error)
  }
  
  /**
   * Extract user-friendly message from error
   */
  static getUserMessage(error: unknown): string {
    if (error instanceof ValidationError) {
      return `Validation failed: ${error.message}`
    }
    
    if (error instanceof TransformationError) {
      return `Data transformation failed: ${error.message}`
    }
    
    if (error instanceof FileSystemError) {
      return `File system error: ${error.message}`
    }
    
    if (error instanceof DatabaseError) {
      return `Database error: ${error.message}`
    }
    
    if (error instanceof NetworkError) {
      return `Network error: ${error.message}`
    }
    
    if (error instanceof Error) {
      return error.message
    }
    
    return 'An unknown error occurred'
  }
}

/**
 * Error aggregator for batch operations
 */
export class ErrorAggregator {
  private errors: Array<{
    item: string
    error: Error
    timestamp: Date
  }> = []
  
  /**
   * Add an error
   */
  add(item: string, error: Error) {
    this.errors.push({
      item,
      error,
      timestamp: new Date(),
    })
  }
  
  /**
   * Get error count
   */
  get count(): number {
    return this.errors.length
  }
  
  /**
   * Get all errors
   */
  getAll() {
    return this.errors
  }
  
  /**
   * Get errors by type
   */
  getByType(errorType: typeof Error) {
    return this.errors.filter(e => e.error instanceof errorType)
  }
  
  /**
   * Generate summary report
   */
  getSummary(): string {
    if (this.errors.length === 0) {
      return 'No errors occurred'
    }
    
    const byType = new Map<string, number>()
    
    this.errors.forEach(({ error }) => {
      const type = error.constructor.name
      byType.set(type, (byType.get(type) || 0) + 1)
    })
    
    let summary = `Total errors: ${this.errors.length}\n`
    summary += 'Errors by type:\n'
    
    byType.forEach((count, type) => {
      summary += `  - ${type}: ${count}\n`
    })
    
    return summary
  }
  
  /**
   * Save errors to file
   */
  async saveToFile(filepath: string) {
    const fs = await import('fs/promises')
    const report = {
      summary: this.getSummary(),
      errors: this.errors.map(({ item, error, timestamp }) => ({
        item,
        timestamp: timestamp.toISOString(),
        type: error.constructor.name,
        message: error.message,
        details: error instanceof ImportError ? error.details : undefined,
      })),
    }
    
    await fs.writeFile(filepath, JSON.stringify(report, null, 2))
  }
}