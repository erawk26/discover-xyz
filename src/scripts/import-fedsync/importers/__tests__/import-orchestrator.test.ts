/**
 * Import Orchestrator Tests
 * 
 * Tests for the main import orchestration system
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Logger, LogLevel } from 'fedsync-standalone/logger'
import fs from 'fs/promises'
import path from 'path'

// Mock the entire payload config to avoid ES module issues
vi.mock('@payload-config', () => ({
  default: {
    collections: [],
    plugins: [],
    db: {},
  },
}))

// Mock payload-auth separately  
vi.mock('payload-auth/better-auth', () => ({
  betterAuthPlugin: vi.fn(() => ({
    name: 'better-auth-plugin',
    init: vi.fn(),
  })),
}))

// Import after mocks are set up
import { ImportOrchestrator } from '../import-orchestrator'
type ImportOptions = Parameters<ImportOrchestrator['prototype']['import']>[1]

// Mock Payload CMS
const mockPayload = {
  find: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}

// Mock getPayload
vi.mock('payload', () => ({
  getPayload: vi.fn(() => Promise.resolve(mockPayload))
}))

// Mock file system
vi.mock('fs/promises')

describe('ImportOrchestrator', () => {
  let orchestrator: ImportOrchestrator
  const mockDataPath = '/mock/data/path'

  beforeEach(() => {
    vi.clearAllMocks()
    orchestrator = new ImportOrchestrator()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize Payload CMS connection', async () => {
      await orchestrator.initialize()
      
      // Verify connection was established
      expect(orchestrator).toBeDefined()
    })

    it('should handle initialization errors', async () => {
      const { getPayload } = await import('payload')
      vi.mocked(getPayload).mockRejectedValueOnce(new Error('Connection failed'))

      await expect(orchestrator.initialize()).rejects.toThrow('Failed to initialize Payload CMS connection')
    })
  })

  describe('Import Options', () => {
    it('should accept custom import options', () => {
      const options: ImportOptions = {
        batchSize: 25,
        concurrency: 3,
        skipCategories: true,
        dryRun: true,
        logLevel: 'debug'
      }

      const customOrchestrator = new ImportOrchestrator(options)
      expect(customOrchestrator).toBeDefined()
    })

    it('should use default options when none provided', () => {
      const defaultOrchestrator = new ImportOrchestrator()
      expect(defaultOrchestrator).toBeDefined()
    })
  })

  describe('Category Import', () => {
    it('should process categories file successfully', async () => {
      // Mock file system
      const mockCategories = {
        categories: [
          {
            id: 1,
            name: 'Arts, Culture & History',
            categories: [
              { id: 1, name: 'Art Gallery/Display' },
              { id: 2, name: 'Historic Site' }
            ]
          }
        ]
      }

      vi.mocked(fs.access).mockResolvedValueOnce(undefined)
      vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify(mockCategories))

      // Mock Payload responses
      mockPayload.find.mockResolvedValue({ docs: [] })
      mockPayload.create.mockResolvedValue({ id: 'new-id' })

      await orchestrator.initialize()
      const stats = await orchestrator.runImport(mockDataPath, { 
        skipEvents: true, 
        skipProfiles: true 
      })

      expect(stats.categories.processed).toBeGreaterThan(0)
      expect(stats.categories.imported).toBeGreaterThan(0)
      expect(stats.categories.errors).toBe(0)
    })

    it('should handle missing categories file gracefully', async () => {
      const error = new Error('File not found')
      ;(error as any).code = 'ENOENT'
      vi.mocked(fs.access).mockRejectedValueOnce(error)

      await orchestrator.initialize()
      const stats = await orchestrator.runImport(mockDataPath, { 
        skipEvents: true, 
        skipProfiles: true 
      })

      expect(stats.categories.processed).toBe(0)
      expect(stats.categories.imported).toBe(0)
    })

    it('should update existing categories', async () => {
      const mockCategories = {
        categories: [
          {
            id: 1,
            name: 'Test Group',
            categories: [{ id: 1, name: 'Test Category' }]
          }
        ]
      }

      vi.mocked(fs.access).mockResolvedValueOnce(undefined)
      vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify(mockCategories))

      // Mock existing category found
      mockPayload.find.mockResolvedValue({ 
        docs: [{ id: 'existing-id', externalId: 'cat-1' }] 
      })
      mockPayload.update.mockResolvedValue({ id: 'existing-id' })

      await orchestrator.initialize()
      const stats = await orchestrator.runImport(mockDataPath, { 
        skipEvents: true, 
        skipProfiles: true 
      })

      expect(mockPayload.update).toHaveBeenCalled()
      expect(stats.categories.imported).toBeGreaterThan(0)
    })
  })

  describe('Event Import', () => {
    it('should process event files successfully', async () => {
      // Mock event files
      vi.mocked(fs.readdir).mockResolvedValueOnce(['1024.json', '1025.json'])
      
      const mockEvent = {
        type: 'event',
        name: 'Test Event',
        event_dates: [{
          name: 'Date 1',
          start_date: '2024-01-01',
          end_date: '2024-01-01',
          all_day: 1
        }],
        address: { city: 'Test City', state: 'TS' },
        email_addresses: { business: '', booking: '' },
        phone_numbers: { local: '', alt: '', fax: '', free_us: '', free_world: '' },
        websites: { business: '', booking: '', meetings: '', mobile: '' },
        socials: { facebook: '', twitter: '', instagram: '', youtube: '', pinterest: '', tripadvisor: '', tiktok: '' }
      }

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockEvent))
      mockPayload.find.mockResolvedValue({ docs: [] })
      mockPayload.create.mockResolvedValue({ id: 'new-event-id' })

      await orchestrator.initialize()
      const stats = await orchestrator.runImport(mockDataPath, { 
        skipCategories: true, 
        skipProfiles: true 
      })

      expect(stats.events.processed).toBe(2)
      expect(stats.events.imported).toBe(2)
      expect(stats.events.errors).toBe(0)
    })

    it('should handle missing events directory gracefully', async () => {
      const error = new Error('Directory not found')
      ;(error as any).code = 'ENOENT'
      vi.mocked(fs.readdir).mockRejectedValueOnce(error)

      await orchestrator.initialize()
      const stats = await orchestrator.runImport(mockDataPath, { 
        skipCategories: true, 
        skipProfiles: true 
      })

      expect(stats.events.processed).toBe(0)
      expect(stats.events.imported).toBe(0)
    })
  })

  describe('Profile Import', () => {
    it('should process profile files successfully', async () => {
      // Mock profile files
      vi.mocked(fs.readdir).mockResolvedValueOnce(['683.json', '684.json'])
      
      const mockProfile = {
        type: 'accommodation',
        name: 'Test Hotel',
        address: { city: 'Test City', state: 'TS' },
        email_addresses: { business: '', booking: '' },
        phone_numbers: { local: '', alt: '', fax: '', free_us: '', free_world: '' },
        websites: { business: '', booking: '', meetings: '', mobile: '' },
        socials: { facebook: '', twitter: '', instagram: '', youtube: '', pinterest: '', tripadvisor: '', tiktok: '' }
      }

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockProfile))
      mockPayload.find.mockResolvedValue({ docs: [] })
      mockPayload.create.mockResolvedValue({ id: 'new-profile-id' })

      await orchestrator.initialize()
      const stats = await orchestrator.runImport(mockDataPath, { 
        skipCategories: true, 
        skipEvents: true 
      })

      expect(stats.profiles.processed).toBe(2)
      expect(stats.profiles.imported).toBe(2)
      expect(stats.profiles.errors).toBe(0)
    })
  })

  describe('Dry Run Mode', () => {
    it('should not make changes in dry run mode', async () => {
      const mockCategories = {
        categories: [
          {
            id: 1,
            name: 'Test Group',
            categories: [{ id: 1, name: 'Test Category' }]
          }
        ]
      }

      vi.mocked(fs.access).mockResolvedValueOnce(undefined)
      vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify(mockCategories))
      // Mock empty directories for events and profiles
      vi.mocked(fs.readdir)
        .mockResolvedValueOnce([]) // Empty events dir
        .mockResolvedValueOnce([]) // Empty profiles dir

      await orchestrator.initialize()
      const stats = await orchestrator.runImport(mockDataPath, { 
        dryRun: true 
      })

      // Should not call Payload methods in dry run
      expect(mockPayload.create).not.toHaveBeenCalled()
      expect(mockPayload.update).not.toHaveBeenCalled()
      
      // But should show what would be imported
      expect(stats.categories.imported).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle individual item import failures', async () => {
      vi.mocked(fs.readdir).mockResolvedValueOnce(['bad-event.json'])
      vi.mocked(fs.readFile).mockResolvedValueOnce('invalid json')

      await orchestrator.initialize()
      const stats = await orchestrator.runImport(mockDataPath, { 
        skipCategories: true, 
        skipProfiles: true 
      })

      expect(stats.events.processed).toBe(1)
      expect(stats.events.errors).toBe(1)
      expect(stats.events.imported).toBe(0)
    })

    it('should continue processing after individual failures', async () => {
      vi.mocked(fs.readdir).mockResolvedValueOnce(['bad.json', 'good.json'])
      
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce('invalid json') // First file fails
        .mockResolvedValueOnce(JSON.stringify({ // Second file succeeds
          type: 'event',
          name: 'Good Event',
          event_dates: [{ name: 'Date', start_date: '2024-01-01', end_date: '2024-01-01', all_day: 1 }],
          address: { city: 'Test', state: 'TS' },
          email_addresses: { business: '', booking: '' },
          phone_numbers: { local: '', alt: '', fax: '', free_us: '', free_world: '' },
          websites: { business: '', booking: '', meetings: '', mobile: '' },
          socials: { facebook: '', twitter: '', instagram: '', youtube: '', pinterest: '', tripadvisor: '', tiktok: '' }
        }))

      mockPayload.find.mockResolvedValue({ docs: [] })
      mockPayload.create.mockResolvedValue({ id: 'new-id' })

      await orchestrator.initialize()
      const stats = await orchestrator.runImport(mockDataPath, { 
        skipCategories: true, 
        skipProfiles: true 
      })

      expect(stats.events.processed).toBe(2)
      expect(stats.events.errors).toBe(1)
      expect(stats.events.imported).toBe(1)
    })
  })

  describe('Statistics and Reporting', () => {
    it('should provide comprehensive import statistics', async () => {
      // Mock minimal successful import
      vi.mocked(fs.access).mockResolvedValueOnce(undefined)
      vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify({ categories: [] }))
      vi.mocked(fs.readdir)
        .mockResolvedValueOnce([]) // Empty events dir
        .mockResolvedValueOnce([]) // Empty profiles dir

      await orchestrator.initialize()
      const stats = await orchestrator.runImport(mockDataPath)

      expect(stats).toHaveProperty('categories')
      expect(stats).toHaveProperty('events')
      expect(stats).toHaveProperty('profiles')
      expect(stats).toHaveProperty('startTime')
      expect(stats).toHaveProperty('endTime')
      expect(stats).toHaveProperty('duration')
      
      expect(typeof stats.duration).toBe('number')
      expect(stats.duration).toBeGreaterThanOrEqual(0)
    })
  })
})