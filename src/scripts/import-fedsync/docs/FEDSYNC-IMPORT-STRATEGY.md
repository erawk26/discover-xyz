# FedSync Data Import Strategy for DiscoverXYZ

**Date**: 2025-07-17  
**Purpose**: Comprehensive plan for importing FedSync data into Payload CMS

## 📊 Data Analysis Summary

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
  title: source.name,
  externalId: source.external_id,
  trackingId: source.tracking_id,
  
  // Location transformation
  location: [source.longitude, source.latitude],
  venueName: source.venue_name,
  address: {
    line1: source.address.line_1,
    line2: source.address.line_2,
    city: source.address.city,
    state: source.address.state,
    postcode: source.address.postcode
  },
  
  // Event dates transformation (complex)
  eventDates: source.event_dates.map(date => ({
    name: date.name,
    startDate: new Date(date.start_date),
    endDate: date.end_date ? new Date(date.end_date) : null,
    startTime: date.start_time,
    endTime: date.end_time,
    allDay: Boolean(date.all_day),
    timesText: date.times_text
    // Note: Ignore calendar array - too verbose
  })),
  
  // Contact info grouping
  emailAddresses: {
    business: source.email_addresses.business,
    booking: source.email_addresses.booking
  },
  
  // Category relationships (resolve IDs)
  categories: await resolveCategories(source.products[0]?.categories),
  
  // Metadata
  listingData: source, // Preserve original
  syncedAt: source.syncedAt,
  syncSource: source.syncSource,
  status: 'published',
  publishedAt: new Date()
}
```

### Profiles Collection Mapping

```typescript
// FedSync Profile → Payload Profile
{
  // Basic info
  title: source.name,
  sortName: source.name_sort,
  externalId: source.external_id,
  trackingId: source.tracking_id,
  type: source.type || 'listing',
  
  // Description from products
  description: source.products[0]?.description?.text,
  
  // Location (same as events)
  location: [source.longitude, source.latitude],
  address: { /* same transformation */ },
  
  // Complex amenities resolution
  amenities: await resolveAmenities(source.amenities),
  
  // Photos transformation
  photos: await transformPhotos(source.products[0]?.photos),
  
  // Business hours (if present)
  hours: source.hours.map(hour => ({
    day: hour.day,
    open: hour.open_time,
    close: hour.close_time
  })),
  
  // Meeting facilities (if applicable)
  meetingFacilities: source.meeting_facilities ? {
    totalSqFt: source.meeting_facilities.total_sq_ft,
    numMtgRooms: source.meeting_facilities.num_mtg_rooms,
    largestRoom: source.meeting_facilities.largest_room,
    ceilingHt: source.meeting_facilities.ceiling_ht
  } : null,
  
  // Metadata
  listingData: source,
  syncedAt: source.syncedAt,
  syncSource: source.syncSource
}
```

## 💻 Implementation Plan

### Phase 1: Setup & Dependencies (Day 1)

```typescript
// 1. Create import script structure
src/
  scripts/
    import-fedsync/
      index.ts           // Main orchestrator
      schemas.ts         // Zod validation schemas
      transformers.ts    // Data transformation functions
      resolvers.ts       // Relationship resolvers
      importers/
        categories.ts    // Category importer
        amenities.ts     // Amenity importer
        events.ts        // Event importer
        profiles.ts      // Profile importer
```

### Phase 2: Category & Amenity Import

```typescript
// categories.ts
import { getPayload } from 'payload'
import { z } from 'zod'
import fs from 'fs/promises'

const CategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.string().optional(),
  categories: z.array(z.any()).optional()
})

export async function importCategories() {
  const payload = await getPayload({ config })
  const data = await fs.readFile('src/lib/fedsync/listingData/categories/categories.json', 'utf8')
  const parsed = JSON.parse(data)
  
  // Flatten hierarchical structure
  const allCategories = flattenCategories(parsed.categories)
  
  // Import in batches
  for (const category of allCategories) {
    await payload.create({
      collection: 'categories',
      data: {
        name: category.name,
        type: category.type || 'general',
        externalId: category.id,
        parent: category.parentId // if hierarchical
      },
      overrideAccess: true
    })
  }
}
```

### Phase 3: Event & Profile Import

```typescript
// events.ts - Optimized for performance
export async function importEvents() {
  const payload = await getPayload({ config })
  const eventFiles = await getEventFiles()
  
  // Process in batches of 500
  const BATCH_SIZE = 500
  let processed = 0
  
  for (let i = 0; i < eventFiles.length; i += BATCH_SIZE) {
    const batch = eventFiles.slice(i, i + BATCH_SIZE)
    
    await Promise.all(batch.map(async (file) => {
      try {
        const data = await readEventFile(file)
        const validated = EventSchema.parse(data)
        const transformed = await transformEvent(validated)
        
        // Check if already exists
        const existing = await payload.find({
          collection: 'events',
          where: { externalId: { equals: transformed.externalId } },
          limit: 1
        })
        
        if (existing.docs.length === 0) {
          await payload.create({
            collection: 'events',
            data: transformed,
            overrideAccess: true,
            depth: 0 // Minimize population
          })
        } else {
          // Update existing
          await payload.update({
            collection: 'events',
            id: existing.docs[0].id,
            data: transformed,
            overrideAccess: true
          })
        }
        
        processed++
        console.log(`Processed ${processed}/${eventFiles.length} events`)
      } catch (error) {
        console.error(`Failed to import ${file}:`, error)
        // Log to error file for review
      }
    }))
  }
}
```

### Phase 4: Photo Handling Strategy

```typescript
// Option 1: Reference External URLs (Recommended for initial import)
async function transformPhotos(photos: any[]) {
  return photos?.map(photo => ({
    url: photo.properties.cloudinary.secure_url,
    caption: photo.caption,
    altText: photo.alt_text || photo.caption,
    externalId: photo.id
  })) || []
}

// Option 2: Download and Upload (For production)
async function downloadAndUploadPhoto(photo: any, payload: any) {
  const response = await fetch(photo.properties.cloudinary.secure_url)
  const buffer = await response.arrayBuffer()
  
  const upload = await payload.create({
    collection: 'media',
    data: {
      alt: photo.alt_text || photo.caption,
    },
    file: {
      data: Buffer.from(buffer),
      name: `${photo.id}-${photo.original_filename}`,
      mimetype: 'image/jpeg'
    }
  })
  
  return upload.id
}
```

## 🚀 Execution Commands

### Development Workflow

```bash
# 1. First run categories import
pnpm tsx src/scripts/import-fedsync categories

# 2. Import amenities (if implemented)
pnpm tsx src/scripts/import-fedsync amenities

# 3. Import events (can run parallel with profiles)
pnpm tsx src/scripts/import-fedsync events

# 4. Import profiles
pnpm tsx src/scripts/import-fedsync profiles

# Or import all with dependencies resolved
pnpm tsx src/scripts/import-fedsync all
```

### Production Considerations

1. **Incremental Sync**: Use syncedAt timestamps for updates
2. **Error Recovery**: Implement checkpoint system for resume capability
3. **Monitoring**: Add progress bars and ETA calculations
4. **Validation**: Run post-import validation queries

## 🔍 Validation & Testing

### Post-Import Validation Queries

```typescript
// Verify import completeness
async function validateImport(payload: any) {
  const stats = {
    events: await payload.count({ collection: 'events' }),
    profiles: await payload.count({ collection: 'profiles' }),
    categories: await payload.count({ collection: 'categories' }),
    
    // Check relationships
    eventsWithCategories: await payload.count({
      collection: 'events',
      where: { categories: { not_equals: null } }
    }),
    
    // Check for missing data
    eventsWithoutDates: await payload.find({
      collection: 'events',
      where: { eventDates: { equals: null } },
      limit: 10
    })
  }
  
  console.log('Import Statistics:', stats)
  return stats
}
```

## 📈 Performance Optimization Tips

1. **Disable Hooks During Import**: Add flag to skip non-critical hooks
2. **Use Direct Database for Categories**: Since they're simple lookups
3. **Implement Caching**: Cache category/amenity lookups
4. **Process in Parallel**: Events and Profiles can import simultaneously
5. **Skip Drafts**: Import directly as published to avoid versioning overhead

## 🎯 Success Metrics

- **Import Speed**: Target 100-200 records/minute
- **Error Rate**: <1% failed imports
- **Relationship Accuracy**: 100% category/amenity resolution
- **Data Integrity**: All required fields populated
- **Idempotency**: Re-running import updates, not duplicates

## 📝 Next Steps

1. Create Zod schemas for validation
2. Implement category importer first
3. Build transformer functions with tests
4. Create progress monitoring
5. Add error recovery mechanisms
6. Document import process for operations team

---

**Recommendation**: Start with a subset (10-20 records) to validate the transformation pipeline before full import.