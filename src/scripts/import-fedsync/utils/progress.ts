/**
 * Progress Tracking Utility
 * 
 * Provides visual progress indicators and ETA calculations
 * for long-running import operations.
 */

import ora, { Ora } from 'ora'
import chalk from 'chalk'

export class ProgressTracker {
  private spinner: Ora | null = null
  private startTime: number = 0
  private processed: number = 0
  private total: number = 0
  private lastUpdate: number = 0
  
  /**
   * Start tracking progress
   */
  start(message: string, total: number) {
    this.startTime = Date.now()
    this.total = total
    this.processed = 0
    this.lastUpdate = Date.now()
    
    this.spinner = ora({
      text: message,
      spinner: 'dots',
      color: 'cyan',
    }).start()
  }
  
  /**
   * Update progress
   */
  update(processed: number, currentItem?: string) {
    this.processed = processed
    
    // Only update every 100ms to avoid flickering
    if (Date.now() - this.lastUpdate < 100) {
      return
    }
    
    this.lastUpdate = Date.now()
    
    const percentage = Math.round((processed / this.total) * 100)
    const elapsed = Date.now() - this.startTime
    const rate = processed / (elapsed / 1000) // items per second
    const remaining = this.total - processed
    const eta = remaining / rate // seconds
    
    let text = `Progress: ${processed}/${this.total} (${percentage}%)`
    
    if (rate > 0 && !isNaN(eta)) {
      text += ` - ETA: ${this.formatTime(eta)}`
      text += ` - Rate: ${rate.toFixed(1)}/s`
    }
    
    if (currentItem) {
      text += `\n${chalk.gray(`Current: ${currentItem}`)}`
    }
    
    if (this.spinner) {
      this.spinner.text = text
    }
  }
  
  /**
   * Mark as successful
   */
  succeed(message?: string) {
    if (this.spinner) {
      const elapsed = (Date.now() - this.startTime) / 1000
      const finalMessage = message || `Completed ${this.processed} items in ${this.formatTime(elapsed)}`
      this.spinner.succeed(finalMessage)
    }
  }
  
  /**
   * Mark as failed
   */
  fail(message?: string) {
    if (this.spinner) {
      this.spinner.fail(message || 'Operation failed')
    }
  }
  
  /**
   * Stop without marking success/fail
   */
  stop() {
    if (this.spinner) {
      this.spinner.stop()
    }
  }
  
  /**
   * Format seconds into human-readable time
   */
  private formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60)
      const secs = Math.round(seconds % 60)
      return `${minutes}m ${secs}s`
    } else {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      return `${hours}h ${minutes}m`
    }
  }
  
  /**
   * Create a simple progress bar for batch operations
   */
  static createBatchProgress(current: number, total: number, width: number = 30): string {
    const percentage = Math.round((current / total) * 100)
    const filled = Math.round(width * current / total)
    const empty = width - filled
    
    const bar = chalk.green('█').repeat(filled) + chalk.gray('░').repeat(empty)
    
    return `[${bar}] ${percentage}% (${current}/${total})`
  }
}

/**
 * Memory usage monitor
 */
export class MemoryMonitor {
  private initialMemory: number
  private peakMemory: number = 0
  
  constructor() {
    this.initialMemory = process.memoryUsage().heapUsed
  }
  
  /**
   * Get current memory usage
   */
  check(): { current: string; peak: string; delta: string } {
    const current = process.memoryUsage().heapUsed
    this.peakMemory = Math.max(this.peakMemory, current)
    
    return {
      current: this.formatBytes(current),
      peak: this.formatBytes(this.peakMemory),
      delta: this.formatBytes(current - this.initialMemory),
    }
  }
  
  /**
   * Log memory usage
   */
  log() {
    const stats = this.check()
    console.log(chalk.gray(`Memory: ${stats.current} (Peak: ${stats.peak}, Delta: ${stats.delta})`))
  }
  
  /**
   * Format bytes to human-readable
   */
  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let value = Math.abs(bytes)
    let unitIndex = 0
    
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024
      unitIndex++
    }
    
    const sign = bytes < 0 ? '-' : ''
    return `${sign}${value.toFixed(1)} ${units[unitIndex]}`
  }
}