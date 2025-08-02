# FedSync Data Import Strategy for DiscoverXYZ

[← Back to FedSync Guide](README.md) | [← Back to Main Documentation](../../README.md)

**Date**: 2025-07-17  
**Purpose**: Comprehensive plan for importing FedSync data into Payload CMS

## 📈 Data Analysis Summary

### Available Data
- **Events**: 700+ event JSON files with recurring dates, locations, and categories
- **Profiles**: 1000+ business listing JSON files with amenities, hours, photos
- **Categories**: Hierarchical taxonomy with groups (Arts, Entertainment, Events, etc.)
- **Amenities**: Features and services for business profiles

### Key Challenges Identified
1. **Large Calendar Arrays**: Events contain 100+ calendar entries per date range
2. **External Photos**: All images are Cloudinary URLs that need downloading
3. **Relationship Resolution**: Categories and amenities must exist before import
4. **Field Name Conversion**: snake_case to camelCase transformation required
5. **Data Volume**: 1700+ records to import efficiently

## 🎯 Import Strategy Overview

### Recommended Approach: Local API with Batch Processing

Based on the JSON import guide recommendations:
- **Method**: Payload Local API (3-7x faster than REST)
- **Batch Size**: 500 records per batch
- **Validation**: Multi-layer with Zod schemas
- **Error Handling**: Transaction support with rollback capability

### Import Order (Critical for Dependencies)

```
1. Categories (no dependencies)
   ↓
2. Amenities (no dependencies)  
   ↓
3. Cities/Regions (extract from data)
   ↓
4. Events & Profiles (parallel import possible)
```

## 📐 Field Mapping Specifications

### Events Collection Mapping

```typescript
// FedSync Event → Payload Event
{
  // Direct mappings
  id: event.id,
  title: event.title,
  description: event.description,
  
  // Nested transformations
  calendar: transformCalendarArray(event.calendar),
  location: transformLocation(event.location),
  contact: transformContact(event.contact),
  photos: await downloadPhotos(event.photos),
  
  // Relationship resolution
  categories: await resolveCategories(event.categories),
  
  // Metadata preservation
  fedSyncData: {
    originalId: event.id,
    lastSynced: new Date(),
    apiVersion: event.api_version
  }
}
```

### Profiles Collection Mapping

```typescript
// FedSync Profile → Payload Profile
{
  // Business info
  name: profile.name,
  description: profile.description,
  type: profile.type,
  
  // Location data
  address: transformAddress(profile.address),
  coordinates: {
    lat: profile.lat,
    lng: profile.lng
  },
  
  // Business operations
  hours: transformHours(profile.hours),
  amenities: await resolveAmenities(profile.amenities),
  
  // Media
  photos: await downloadPhotos(profile.photos),
  videos: transformVideos(profile.videos),
  
  // Contact & social
  contact: transformContact(profile.contact),
  
  // Accommodation-specific
  rooms: profile.rooms,
  suites: profile.suites,
  meetingFacilities: profile.meeting_facilities
}
```

## 🔄 Data Transformation Details

### Calendar Array Processing

**Challenge**: Events have calendar arrays with 100+ entries
**Solution**: Efficient transformation and deduplication

```typescript
function transformCalendarArray(calendar: FedSyncCalendar[]): PayloadCalendar[] {
  return calendar
    .filter(entry => isValidDateRange(entry))
    .map(entry => ({
      startDate: new Date(entry.start_date),
      endDate: new Date(entry.end_date),
      startTime: entry.start_time,
      endTime: entry.end_time,
      recurring: entry.recurring,
      notes: entry.notes
    }))
    .slice(0, 50) // Limit to prevent database bloat
}
```

### Photo Download Strategy

**Challenge**: All photos are external Cloudinary URLs
**Solution**: Background download with fallback

```typescript
async function downloadPhotos(photos: FedSyncPhoto[]): Promise<PayloadMedia[]> {
  const downloadPromises = photos.map(async (photo) => {
    try {
      const mediaId = await downloadAndCreateMedia(photo.url, {
        alt: photo.caption || photo.title,
        filename: generateFilename(photo.url)
      })
      return mediaId
    } catch (error) {
      logger.warn(`Failed to download photo: ${photo.url}`, error)
      return null // Skip failed downloads
    }
  })
  
  const results = await Promise.allSettled(downloadPromises)
  return results
    .filter(result => result.status === 'fulfilled' && result.value)
    .map(result => result.value)
}
```

### Relationship Resolution

**Challenge**: Categories and amenities must exist before linking
**Solution**: Pre-import dependency resolution

```typescript
async function resolveCategories(categoryNames: string[]): Promise<string[]> {
  const categoryIds = []
  
  for (const name of categoryNames) {
    let category = await payload.find({
      collection: 'categories',
      where: { name: { equals: name } }
    })
    
    if (!category.docs.length) {
      // Create missing category
      category = await payload.create({
        collection: 'categories',
        data: { name, slug: slugify(name) }
      })
    }
    
    categoryIds.push(category.docs[0].id)
  }
  
  return categoryIds
}
```

## 🚀 Performance Optimization

### Batch Processing Implementation

```typescript
class BatchProcessor {
  constructor(
    private batchSize: number = 500,
    private concurrency: number = 5
  ) {}
  
  async processBatch<T>(items: T[], processor: (item: T) => Promise<any>) {
    const batches = chunk(items, this.batchSize)
    
    for (const batch of batches) {
      const promises = batch.map(item => 
        this.withRetry(() => processor(item))
      )
      
      await Promise.allSettled(promises)
      
      // Rate limiting
      await this.delay(100)
    }
  }
  
  private async withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error) {
        if (i === maxRetries - 1) throw error
        await this.delay(1000 * Math.pow(2, i)) // Exponential backoff
      }
    }
  }
}
```

### Memory Management

- **Streaming**: Process files one at a time, not in memory
- **Garbage Collection**: Explicit cleanup after batches
- **Memory Monitoring**: Track usage and adjust batch sizes

```typescript
if (process.memoryUsage().heapUsed > MEMORY_THRESHOLD) {
  global.gc?.() // Force garbage collection
  await delay(1000) // Allow cleanup
}
```

## 🔍 Validation Strategy

### Multi-Layer Validation

1. **Schema Validation**: Zod schemas for type safety
2. **Business Logic**: Custom validation rules
3. **Database Constraints**: Payload collection validation

```typescript
// Zod schema for Events
const EventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  calendar: z.array(CalendarEntrySchema).max(50),
  location: LocationSchema,
  contact: ContactSchema.optional(),
  categories: z.array(z.string()).max(10)
})

// Custom business validation
function validateEvent(event: any): ValidationResult {
  const issues = []
  
  if (!event.calendar?.length) {
    issues.push('Event must have at least one calendar entry')
  }
  
  if (event.calendar?.some(entry => new Date(entry.startDate) < new Date())) {
    issues.push('Event dates cannot be in the past')
  }
  
  return { valid: issues.length === 0, issues }
}
```

## 📊 Progress Tracking & Monitoring

### Real-time Progress Updates

```typescript
class ImportProgress {
  constructor(private total: number) {}
  
  update(processed: number, imported: number, errors: number) {
    const percentage = Math.round((processed / this.total) * 100)
    
    console.log(`📊 Import Progress: ${percentage}% (${processed}/${this.total})`);
    console.log(`✅ Imported: ${imported}, ❌ Errors: ${errors}`);
    
    // Update status file for API monitoring
    this.updateStatusFile({ processed, imported, errors, percentage })
  }
}
```

### Error Tracking & Recovery

```typescript
class ErrorTracker {
  private errors: ImportError[] = []
  
  logError(type: string, item: any, error: Error) {
    this.errors.push({
      type,
      itemId: item.id,
      message: error.message,
      timestamp: new Date(),
      data: item
    })
    
    // Write to error log file
    this.writeErrorLog()
  }
  
  generateRetryFile() {
    const retryableErrors = this.errors.filter(e => e.retryable)
    fs.writeFileSync('retry-items.json', JSON.stringify(retryableErrors, null, 2))
  }
}
```

## 📁 File Organization

### Import Module Structure

```
src/scripts/import-fedsync/
├── cli.ts                    # Command-line interface
├── importers/
│   ├── categories.ts         # Category importer
│   ├── amenities.ts          # Amenity importer
│   ├── events.ts             # Event importer
│   ├── profiles.ts           # Profile importer
│   └── orchestrator.ts       # Main orchestrator
├── transformers/
│   ├── event-transformer.ts  # Event data transformation
│   ├── profile-transformer.ts # Profile data transformation
│   └── shared.ts             # Shared transformation utilities
├── schemas/
│   ├── event.schema.ts       # Event validation schemas
│   ├── profile.schema.ts     # Profile validation schemas
│   └── shared.schema.ts      # Shared schemas
├── utils/
│   ├── batch-processor.ts    # Batch processing utilities
│   ├── media-downloader.ts   # Photo download utilities
│   ├── progress-tracker.ts   # Progress tracking
│   └── error-handler.ts      # Error handling
└── __tests__/
    ├── unit/                 # Unit tests
    └── integration/          # Integration tests
```

## 🗺️ Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [x] Set up import module structure
- [x] Create Zod validation schemas
- [x] Build batch processing utilities
- [x] Implement progress tracking

### Phase 2: Core Importers (Week 2)
- [x] Categories and amenities importers
- [x] Event data transformer and importer
- [x] Profile data transformer and importer
- [x] Relationship resolution logic

### Phase 3: Media & Testing (Week 3)
- [x] Photo download implementation
- [x] Comprehensive test suite
- [x] Error handling and recovery
- [x] Performance optimization

### Phase 4: Production & Monitoring (Week 4)
- [x] CLI interface and documentation
- [x] API endpoints for remote triggering
- [x] Monitoring and logging infrastructure
- [x] Production deployment

## ✅ Success Metrics

### Performance Targets
- **Import Speed**: > 100 records/minute
- **Success Rate**: > 95% successful imports
- **Memory Usage**: < 512MB peak
- **Error Recovery**: < 5% unrecoverable errors

### Quality Targets
- **Data Integrity**: 100% schema compliance
- **Relationship Accuracy**: 100% category/amenity links
- **Media Success**: > 90% photo downloads
- **Field Mapping**: 100% critical field preservation

## 🔧 Maintenance & Operations

### Regular Maintenance Tasks

1. **Data Sync**: Weekly FedSync API pulls
2. **Cleanup**: Monthly old import log cleanup
3. **Monitoring**: Daily import success verification
4. **Updates**: Quarterly schema validation updates

### Troubleshooting Guide

| Issue | Likely Cause | Solution |
|-------|--------------|----------|
| Import timeout | Large batch size | Reduce batch size to 100-200 |
| Memory errors | Too many concurrent operations | Reduce concurrency to 3-5 |
| Relationship errors | Missing dependencies | Run categories/amenities first |
| Photo failures | Network issues | Retry with exponential backoff |

---

## 📄 Related Documentation

- [API Usage Guide](API-USAGE.md) - Using the import API endpoints
- [FedSync Integration README](README.md) - Quick start and overview
- [Testing Documentation](../../TESTING.md) - Running and writing tests

This strategy document provides the comprehensive foundation for successfully importing FedSync data into Payload CMS while maintaining data integrity, performance, and reliability.