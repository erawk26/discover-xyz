# FedSync Integration Guide

[← Back to Main Documentation](../../README.md)

This guide covers the complete FedSync data synchronization system for importing external data into Payload CMS.

## Quick Start

### Prerequisites
1. Ensure MongoDB is running
2. Set up environment variables in `.env`:
   ```bash
   FEDERATOR_BEARER_TOKEN=your_token_here
   FEDERATOR_API_URL=https://api.federator.com
   PAYLOAD_SECRET=your_payload_secret
   DATABASE_URI=mongodb://localhost:27017/discover-xyz
   ```

### Two-Step Process

#### Step 1: Sync Data from API
```bash
pnpm sync
```
Downloads all data from FedSync API to `data/fedsync/`

#### Step 2: Import to Payload CMS
```bash
pnpm import
```
Imports the synced data into your Payload CMS database

### Automated Sync with Cron

To automatically sync and import data on a schedule:

```bash
# Run the cron job manually
pnpm cron:fedsync

# Set up automated scheduling (see ../CRON_EXAMPLES.md)
```

The cron job will:
1. Sync data from FedSync API
2. Wait 5 seconds (configurable)
3. Import data to Payload CMS
4. Log all operations to `logs/cron/`
5. Send webhook notifications (if configured)

See [Cron Setup Examples](../CRON_EXAMPLES.md) for detailed setup instructions.

## Features

- **Batch Processing**: Efficiently imports large datasets
- **Progress Tracking**: Real-time progress indicators
- **Error Handling**: Detailed error logging and recovery
- **Data Validation**: Zod schemas ensure data integrity
- **Relationship Resolution**: Handles categories and amenities dependencies

## Import Statistics

After import, you'll see statistics like:
```
📈 Import Statistics:
┌─────────────┬───────────┬───────────┬─────────┐
│ Type        │ Processed │ Imported  │ Errors  │
├─────────────┼───────────┼───────────┼─────────┤
│ Categories  │       226 │       226 │       0 │
│ Events      │       864 │       864 │       0 │
│ Profiles    │      1434 │      1434 │       0 │
└─────────────┴───────────┴───────────┴─────────┘
```

## Architecture

- **CLI**: Command-line interface (`cli.ts`)
- **Orchestrator**: Manages the import process (`importers/import-orchestrator.ts`)
- **Transformers**: Convert FedSync data to Payload format
- **Schemas**: Zod validation schemas for data integrity

## Data Collections

### Events Collection

The Events collection is designed to manage event listings with comprehensive date, location, and contact information:

- **Event Information**: Title, description, multiple date ranges with times
- **Location Details**: Venue name, full address, GPS coordinates, city/region relationships
- **Contact Information**: Multiple email types, phone numbers, websites, and social media
- **Media**: Photo galleries with captions
- **Metadata**: Categories, sync tracking, external IDs for API integration

### Profiles Collection

The Profiles collection handles business listings with extensive features:

- **Business Details**: Name, description, type classification
- **Location & Service Area**: Address, coordinates, cities served, regions
- **Contact Methods**: Multiple emails, phones, websites, social media profiles
- **Operating Hours**: Detailed business hours by day
- **Amenities & Features**: Relationship-based amenity tracking
- **Accommodation Info**: Room counts, suites, meeting facilities
- **Media**: Photo and video galleries
- **Sync Integration**: API data preservation, sync status tracking

## Troubleshooting

### Common Issues

1. **Missing PAYLOAD_SECRET**: Make sure `dotenv` is loaded in the CLI script
2. **MongoDB Connection**: Ensure MongoDB is running on the configured URI
3. **File Not Found**: Run `pnpm sync` before `pnpm import`

### Logs

Check logs for detailed error information:
- Console output during import
- Log files in `logs/` directory

## Development

### Running Tests
```bash
# Run all import tests
pnpm test:int

# Run specific test file
pnpm vitest run src/scripts/import-fedsync/__tests__/integration/end-to-end.test.ts
```

### Adding New Importers

1. Create transformer in `transformers/`
2. Add schema in `schemas/`
3. Register in `import-orchestrator.ts`
4. Add tests in `__tests__/`

## Migration Notes

This system replaces the previous local FedSync library with the `fedsync` npm package for better maintainability and separation of concerns.

## Related Documentation

- [API Usage Guide](API-USAGE.md) - Detailed API endpoint documentation
- [Implementation Strategy](FEDSYNC-IMPORT-STRATEGY.md) - Technical strategy and architecture
- [Cron Setup Examples](../CRON_EXAMPLES.md) - Automated synchronization setup