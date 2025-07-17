/**
 * FedSync Import Configuration
 * 
 * Central configuration for the import system.
 * Manages paths, settings, and import options.
 */

import path from 'path'

export const config = {
  // Data source paths
  paths: {
    base: path.join(process.cwd(), 'src/lib/fedsync/listingData'),
    categories: path.join(process.cwd(), 'src/lib/fedsync/listingData/categories/categories.json'),
    events: path.join(process.cwd(), 'src/lib/fedsync/listingData/events'),
    profiles: path.join(process.cwd(), 'src/lib/fedsync/listingData/profiles'),
    amenities: path.join(process.cwd(), 'src/lib/fedsync/listingData/amenities'),
    logs: path.join(process.cwd(), 'logs/import'),
  },
  
  // Import settings
  import: {
    batchSize: 500,
    maxConcurrency: 5,
    retryAttempts: 3,
    retryDelay: 1000, // ms
    skipExisting: true,
    validateBeforeImport: true,
  },
  
  // Performance settings
  performance: {
    // Payload API settings
    overrideAccess: true,
    depth: 0, // Minimize population for performance
    disableTransaction: false,
    
    // Memory management
    maxMemoryUsage: 0.8, // 80% of available memory
    gcInterval: 100, // Run GC every 100 records
  },
  
  // Logging settings
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    writeToFile: true,
    logFilePath: path.join(process.cwd(), 'logs/import/import.log'),
    errorLogPath: path.join(process.cwd(), 'logs/import/errors.log'),
    prettyPrint: true,
  },
  
  // Field mappings
  fieldMappings: {
    // Common transformations
    snakeToCamel: {
      external_id: 'externalId',
      tracking_id: 'trackingId',
      name_sort: 'sortName',
      event_dates: 'eventDates',
      email_addresses: 'emailAddresses',
      phone_numbers: 'phoneNumbers',
      cities_served: 'citiesServed',
      meeting_facilities: 'meetingFacilities',
      num_of_rooms: 'numOfRooms',
      num_of_suites: 'numOfSuites',
      published_city_id: 'publishedCityId',
      last_publish_utc: 'lastPublishUtc',
    },
    
    // Date fields that need conversion
    dateFields: [
      'start_date',
      'end_date',
      'created_at',
      'updated_at',
      'last_publish_utc',
      'syncedAt',
    ],
    
    // Fields to skip during import
    skipFields: [
      'calendar', // Too verbose for events
      'external_data',
      'custom',
    ],
  },
  
  // Validation settings
  validation: {
    requireExternalId: true,
    requireTitle: true,
    maxTitleLength: 200,
    maxDescriptionLength: 5000,
    allowEmptyCategories: true,
  },
  
  // Photo handling
  photos: {
    downloadExternal: false, // Start with references only
    uploadPath: 'fedsync-photos',
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    maxSize: 10 * 1024 * 1024, // 10MB
    generateAltText: true,
  },
} as const

// Type exports
export type Config = typeof config
export type ImportConfig = typeof config.import
export type PathConfig = typeof config.paths