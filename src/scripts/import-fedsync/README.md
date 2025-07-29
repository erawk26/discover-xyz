# FedSync Import System

This directory contains the import system for FedSync data into Payload CMS.

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

## Features

- **Batch Processing**: Efficiently imports large datasets
- **Progress Tracking**: Real-time progress indicators
- **Error Handling**: Detailed error logging and recovery
- **Data Validation**: Zod schemas ensure data integrity
- **Relationship Resolution**: Handles categories and amenities dependencies

## Import Statistics

After import, you'll see statistics like:
```
📊 Import Statistics:
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

This system replaces the previous local FedSync library with the `fedsync-standalone` npm package for better maintainability and separation of concerns.