/**
 * Logger Utility
 * 
 * Provides consistent logging throughout the import system.
 * Supports console output with colors and file logging.
 */

import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import { config } from '../config'

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

class Logger {
  private level: LogLevel
  private logFile?: fs.WriteStream
  private errorFile?: fs.WriteStream
  
  constructor() {
    this.level = this.parseLogLevel(config.logging.level)
    
    if (config.logging.writeToFile) {
      this.initializeFileLogging()
    }
  }
  
  private parseLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'error': return LogLevel.ERROR
      case 'warn': return LogLevel.WARN
      case 'info': return LogLevel.INFO
      case 'debug': return LogLevel.DEBUG
      default: return LogLevel.INFO
    }
  }
  
  private initializeFileLogging() {
    try {
      // Ensure log directory exists
      const logDir = path.dirname(config.logging.logFilePath)
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true })
      }
      
      // Create write streams
      this.logFile = fs.createWriteStream(config.logging.logFilePath, { flags: 'a' })
      this.errorFile = fs.createWriteStream(config.logging.errorLogPath, { flags: 'a' })
    } catch (error) {
      console.error('Failed to initialize file logging:', error)
    }
  }
  
  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString()
    const formattedArgs = args.length > 0 ? ' ' + args.map(a => 
      typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
    ).join(' ') : ''
    
    return `[${timestamp}] [${level}] ${message}${formattedArgs}`
  }
  
  private writeToFile(message: string, isError = false) {
    if (!config.logging.writeToFile) return
    
    const formatted = message + '\n'
    
    if (isError && this.errorFile) {
      this.errorFile.write(formatted)
    }
    
    if (this.logFile) {
      this.logFile.write(formatted)
    }
  }
  
  error(message: string, ...args: any[]) {
    if (this.level >= LogLevel.ERROR) {
      const formatted = this.formatMessage('ERROR', message, ...args)
      console.error(chalk.red('✗ ' + message), ...args)
      this.writeToFile(formatted, true)
    }
  }
  
  warn(message: string, ...args: any[]) {
    if (this.level >= LogLevel.WARN) {
      const formatted = this.formatMessage('WARN', message, ...args)
      console.warn(chalk.yellow('⚠ ' + message), ...args)
      this.writeToFile(formatted)
    }
  }
  
  info(message: string, ...args: any[]) {
    if (this.level >= LogLevel.INFO) {
      const formatted = this.formatMessage('INFO', message, ...args)
      console.log(chalk.blue('ℹ ' + message), ...args)
      this.writeToFile(formatted)
    }
  }
  
  success(message: string, ...args: any[]) {
    if (this.level >= LogLevel.INFO) {
      const formatted = this.formatMessage('SUCCESS', message, ...args)
      console.log(chalk.green('✓ ' + message), ...args)
      this.writeToFile(formatted)
    }
  }
  
  debug(message: string, ...args: any[]) {
    if (this.level >= LogLevel.DEBUG) {
      const formatted = this.formatMessage('DEBUG', message, ...args)
      console.log(chalk.gray('🔍 ' + message), ...args)
      this.writeToFile(formatted)
    }
  }
  
  // Special formatting methods
  
  progress(current: number, total: number, message?: string) {
    const percentage = Math.round((current / total) * 100)
    const progressBar = this.createProgressBar(percentage)
    const text = message ? ` - ${message}` : ''
    
    process.stdout.write(`\r${progressBar} ${percentage}% (${current}/${total})${text}`)
    
    if (current === total) {
      process.stdout.write('\n')
    }
  }
  
  private createProgressBar(percentage: number): string {
    const width = 30
    const filled = Math.round(width * percentage / 100)
    const empty = width - filled
    
    return chalk.cyan('[') + 
           chalk.green('█'.repeat(filled)) + 
           chalk.gray('░'.repeat(empty)) + 
           chalk.cyan(']')
  }
  
  table(data: Record<string, any>) {
    const maxKeyLength = Math.max(...Object.keys(data).map(k => k.length))
    
    console.log(chalk.gray('┌' + '─'.repeat(maxKeyLength + 2) + '┬' + '─'.repeat(30) + '┐'))
    
    Object.entries(data).forEach(([key, value]) => {
      const paddedKey = key.padEnd(maxKeyLength)
      const formattedValue = String(value).substring(0, 28)
      console.log(chalk.gray('│ ') + chalk.cyan(paddedKey) + chalk.gray(' │ ') + formattedValue.padEnd(28) + chalk.gray(' │'))
    })
    
    console.log(chalk.gray('└' + '─'.repeat(maxKeyLength + 2) + '┴' + '─'.repeat(30) + '┘'))
  }
  
  close() {
    if (this.logFile) {
      this.logFile.end()
    }
    if (this.errorFile) {
      this.errorFile.end()
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Ensure logs are flushed on exit
process.on('exit', () => {
  logger.close()
})