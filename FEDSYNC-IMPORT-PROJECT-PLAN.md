# FedSync Import Project Plan

**Project**: Import FedSync Data into Payload CMS  
**Duration**: 5-7 days (can be extended based on complexity)  
**Team Size**: 1-2 developers

## 📅 Project Overview

### Goal
Successfully import 1,700+ records from FedSync JSON files into Payload CMS with proper data transformation, validation, and relationship mapping.

### Success Criteria
- ✅ All valid records imported without data loss
- ✅ < 1% error rate on imports
- ✅ Relationships properly resolved (categories, amenities)
- ✅ Import process is resumable and idempotent
- ✅ Clear documentation and monitoring

---

## Phase 1: Setup & Infrastructure (Day 1)
**Duration**: 4-6 hours  
**Goal**: Establish foundation for import system

### Tasks
1. **Install Dependencies** (30 min)
   ```bash
   pnpm add zod       # Validation
   pnpm add p-limit   # Concurrency control
   pnpm add chalk     # Console formatting
   pnpm add ora       # Progress spinners
   ```

2. **Create Project Structure** (1 hour)
   ```
   src/scripts/import-fedsync/
   ├── index.ts                 # Main orchestrator
   ├── config.ts               # Configuration
   ├── schemas/                # Validation schemas
   │   ├── event.schema.ts
   │   ├── profile.schema.ts
   │   └── category.schema.ts
   ├── transformers/           # Data transformers
   │   ├── event.transformer.ts
   │   ├── profile.transformer.ts
   │   └── shared.transformer.ts
   ├── importers/              # Import logic
   │   ├── base.importer.ts
   │   ├── category.importer.ts
   │   ├── event.importer.ts
   │   └── profile.importer.ts
   ├── utils/                  # Utilities
   │   ├── logger.ts
   │   ├── progress.ts
   │   └── errors.ts
   └── types/                  # TypeScript types
       └── fedsync.types.ts
   ```

3. **Implement Base Infrastructure** (2-3 hours)
   - Base importer class with error handling
   - Logging system with file output
   - Progress tracking utilities
   - Configuration management

### Deliverables
- ✅ Project structure created
- ✅ Dependencies installed
- ✅ Base classes implemented
- ✅ Logging system operational

### Verification
```bash
# Test base setup
pnpm tsx src/scripts/import-fedsync/index.ts --help
```

---

## Phase 2: Schema Definition & Validation (Day 1-2)
**Duration**: 4-6 hours  
**Goal**: Define comprehensive validation schemas

### Tasks
1. **Analyze Data Structures** (1 hour)
   - Sample 10-20 files from each type
   - Document all field variations
   - Identify optional vs required fields

2. **Create Zod Schemas** (3 hours)
   ```typescript
   // event.schema.ts
   export const EventDateSchema = z.object({
     name: z.string(),
     start_date: z.string().datetime(),
     end_date: z.string().datetime().nullable(),
     start_time: z.string().nullable(),
     end_time: z.string().nullable(),
     all_day: z.union([z.number(), z.boolean()]).transform(Boolean),
     times_text: z.string().optional(),
     calendar: z.array(z.any()).optional() // Ignore for import
   })
   
   export const FedSyncEventSchema = z.object({
     id: z.number(),
     external_id: z.number(),
     tracking_id: z.string(),
     name: z.string(),
     // ... complete schema
   })
   ```

3. **Create Validation Tests** (1-2 hours)
   - Unit tests for each schema
   - Edge case handling
   - Error message formatting

### Deliverables
- ✅ Complete Zod schemas for all data types
- ✅ Schema unit tests
- ✅ Validation error handlers
- ✅ Type definitions generated from schemas

### Verification
```bash
# Run schema tests
pnpm test src/scripts/import-fedsync/schemas
```

---

## Phase 3: Category Import Implementation (Day 2)
**Duration**: 3-4 hours  
**Goal**: Import foundation data (categories)

### Tasks
1. **Category Importer** (2 hours)
   ```typescript
   class CategoryImporter extends BaseImporter {
     async import(): Promise<ImportResult> {
       // Load categories.json
       // Flatten hierarchy
       // Check existing records
       // Import with deduplication
       // Return statistics
     }
   }
   ```

2. **Relationship Mapping** (1 hour)
   - Build category lookup maps
   - Handle parent-child relationships
   - Cache for performance

3. **Testing & Verification** (1 hour)
   - Import categories
   - Verify in Payload admin
   - Check relationships

### Deliverables
- ✅ Working category importer
- ✅ Category lookup cache
- ✅ Import statistics
- ✅ Categories visible in admin

### Verification
```bash
# Import categories
pnpm tsx src/scripts/import-fedsync categories

# Check results
pnpm tsx src/scripts/import-fedsync verify categories
```

---

## Phase 4: Event Import Implementation (Day 3)
**Duration**: 6-8 hours  
**Goal**: Import all events with proper transformation

### Tasks
1. **Event Transformer** (2 hours)
   - Field mapping implementation
   - Date/time conversions
   - Location data handling
   - Category resolution

2. **Event Importer** (3 hours)
   ```typescript
   class EventImporter extends BaseImporter {
     async import(options: ImportOptions): Promise<ImportResult> {
       // Batch processing
       // Progress tracking
       // Error recovery
       // Duplicate detection
     }
   }
   ```

3. **Performance Optimization** (2 hours)
   - Implement batching (500 records)
   - Add concurrency limits
   - Memory management
   - Progress indicators

4. **Testing** (1 hour)
   - Test with subset (10 events)
   - Verify transformations
   - Check relationships

### Deliverables
- ✅ Event transformer with tests
- ✅ Batch import system
- ✅ Progress tracking
- ✅ Error logs for failed imports

### Verification
```bash
# Test import
pnpm tsx src/scripts/import-fedsync events --limit 10

# Full import
pnpm tsx src/scripts/import-fedsync events --batch-size 500
```

---

## Phase 5: Profile Import Implementation (Day 4)
**Duration**: 8-10 hours  
**Goal**: Import business profiles with complex data

### Tasks
1. **Profile Transformer** (3 hours)
   - Complex field mappings
   - Amenity resolution
   - Photo handling
   - Hours transformation

2. **Profile Importer** (3 hours)
   - Similar to events but more complex
   - Handle meeting facilities
   - Process amenities
   - Manage photos

3. **Photo Strategy** (2 hours)
   - Option A: Reference external URLs
   - Option B: Download and upload
   - Implement chosen strategy

4. **Testing & Optimization** (2 hours)

### Deliverables
- ✅ Profile transformer
- ✅ Photo handling system
- ✅ Amenity relationships
- ✅ Complete import logs

### Verification
```bash
# Test profiles
pnpm tsx src/scripts/import-fedsync profiles --limit 10

# Import with photo download
pnpm tsx src/scripts/import-fedsync profiles --download-photos
```

---

## Phase 6: Validation & Cleanup (Day 5)
**Duration**: 4-6 hours  
**Goal**: Ensure data integrity

### Tasks
1. **Data Validation** (2 hours)
   ```typescript
   class ImportValidator {
     async validate(): Promise<ValidationReport> {
       // Count records
       // Check relationships
       // Verify required fields
       // Find orphaned data
     }
   }
   ```

2. **Cleanup Scripts** (1 hour)
   - Remove duplicates
   - Fix broken relationships
   - Update sync timestamps

3. **Reporting** (1 hour)
   - Generate import report
   - Document issues
   - Create success metrics

### Deliverables
- ✅ Validation report
- ✅ Cleanup completed
- ✅ Import statistics
- ✅ Issue documentation

---

## Phase 7: Production & Documentation (Day 5-6)
**Duration**: 4-6 hours  
**Goal**: Production-ready system

### Tasks
1. **Production Features** (2 hours)
   - Resume capability
   - Incremental sync
   - Scheduled imports
   - Monitoring integration

2. **Documentation** (2 hours)
   - Operation guide
   - Troubleshooting guide
   - Architecture diagram
   - API documentation

3. **Deployment** (2 hours)
   - Package scripts
   - Environment setup
   - Cron configuration
   - Monitoring setup

### Deliverables
- ✅ Production-ready scripts
- ✅ Complete documentation
- ✅ Deployment guide
- ✅ Monitoring dashboard

---

## 📊 Resource Requirements

### Technical Requirements
- Node.js 18+
- 8GB RAM minimum
- 10GB disk space
- MongoDB running locally
- Payload CMS dev environment

### Team Skills
- TypeScript proficiency
- Payload CMS experience
- Data transformation experience
- MongoDB knowledge helpful

---

## 🚀 Quick Start Commands

```bash
# Phase 1: Setup
pnpm install
pnpm tsx src/scripts/import-fedsync init

# Phase 3: Categories
pnpm tsx src/scripts/import-fedsync import categories

# Phase 4: Events (test)
pnpm tsx src/scripts/import-fedsync import events --limit 10

# Phase 4: Events (full)
pnpm tsx src/scripts/import-fedsync import events

# Phase 5: Profiles
pnpm tsx src/scripts/import-fedsync import profiles

# Phase 6: Validate
pnpm tsx src/scripts/import-fedsync validate

# Full import
pnpm tsx src/scripts/import-fedsync import all
```

---

## 📈 Success Metrics

### Phase Completion Criteria
- **Phase 1**: Base system runs without errors
- **Phase 2**: All schemas validate sample data
- **Phase 3**: 100% categories imported
- **Phase 4**: 95%+ events imported successfully
- **Phase 5**: 95%+ profiles imported successfully
- **Phase 6**: Validation passes all checks
- **Phase 7**: Documentation complete, system deployed

### Overall Project Success
- ✅ < 1% import failure rate
- ✅ 100% relationship integrity
- ✅ Import time < 30 minutes for full dataset
- ✅ System is maintainable and documented
- ✅ Can perform incremental updates

---

## 🔄 Risk Mitigation

### Potential Risks & Solutions
1. **Large calendar arrays**: Strip from import, too verbose
2. **Memory issues**: Implement streaming/batching
3. **Duplicate data**: Use external_id for deduplication
4. **Failed imports**: Implement checkpoint/resume
5. **Photo downloads fail**: Fallback to external URLs

---

## 📝 Daily Checklist

### Developer Daily Tasks
- [ ] Review previous day's logs
- [ ] Run validation checks
- [ ] Update progress tracking
- [ ] Document any issues
- [ ] Commit code changes
- [ ] Update team on progress

### End of Day
- [ ] Run full validation
- [ ] Backup database
- [ ] Update documentation
- [ ] Plan next day's tasks