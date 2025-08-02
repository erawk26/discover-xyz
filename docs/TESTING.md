# Testing Guide

[← Back to Main Documentation](../README.md)

## Overview

This guide covers running and writing tests for the Discover XYZ project.

## Running Tests

### All Tests
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

### Specific Test Types
```bash
# Unit tests only
pnpm test:unit

# Integration tests only
pnpm test:int

# End-to-end tests
pnpm test:e2e
```

### FedSync Import Tests
```bash
# Run all import tests
pnpm vitest run src/scripts/import-fedsync/__tests__/

# Run specific test file
pnpm vitest run src/scripts/import-fedsync/__tests__/integration/end-to-end.test.ts

# Run with verbose output
pnpm vitest run --reporter=verbose
```

## Test Structure

### Directory Organization
```
__tests__/
├── unit/                 # Unit tests
│   ├── transformers/     # Data transformation tests
│   ├── validators/       # Schema validation tests
│   └── utils/            # Utility function tests
├── integration/          # Integration tests
│   ├── importers/        # Importer integration tests
│   └── end-to-end.test.ts # Full import workflow
└── fixtures/             # Test data fixtures
    ├── events/           # Sample event data
    ├── profiles/         # Sample profile data
    └── categories/       # Sample category data
```

## Writing Tests

### Test Configuration

Tests use Vitest with the following configuration:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test-setup.ts']
  }
})
```

### Example Unit Test

```typescript
// __tests__/unit/transformers/event-transformer.test.ts
import { describe, it, expect } from 'vitest'
import { transformEvent } from '../../../transformers/event-transformer'
import { mockFedSyncEvent } from '../../fixtures/events'

describe('Event Transformer', () => {
  it('should transform FedSync event to Payload format', () => {
    const fedSyncEvent = mockFedSyncEvent()
    const payloadEvent = transformEvent(fedSyncEvent)
    
    expect(payloadEvent.title).toBe(fedSyncEvent.title)
    expect(payloadEvent.calendar).toBeDefined()
    expect(payloadEvent.location).toBeDefined()
  })
  
  it('should handle missing optional fields', () => {
    const minimalEvent = { id: '1', title: 'Test Event' }
    const result = transformEvent(minimalEvent)
    
    expect(result.title).toBe('Test Event')
    expect(result.description).toBeUndefined()
  })
})
```

### Example Integration Test

```typescript
// __tests__/integration/importers/event-importer.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { EventImporter } from '../../../importers/event-importer'
import { setupTestDatabase, cleanupTestDatabase } from '../../test-utils'

describe('Event Importer Integration', () => {
  let importer: EventImporter
  
  beforeEach(async () => {
    await setupTestDatabase()
    importer = new EventImporter()
  })
  
  afterEach(async () => {
    await cleanupTestDatabase()
  })
  
  it('should import events from JSON files', async () => {
    const result = await importer.importFromDirectory('./test-fixtures/events')
    
    expect(result.imported).toBeGreaterThan(0)
    expect(result.errors).toBe(0)
    
    // Verify data was actually created
    const events = await payload.find({ collection: 'events' })
    expect(events.docs.length).toBe(result.imported)
  })
})
```

## Test Environment Setup

### Environment Variables

Create a `.env.test` file for test-specific configuration:

```bash
# Test database (separate from development)
DATABASE_URI=mongodb://localhost:27017/discover-xyz-test

# Test Payload secret
PAYLOAD_SECRET=test-secret-key

# Mock external services
FEDERATOR_API_URL=http://localhost:3001/mock-api
FEDERATOR_BEARER_TOKEN=mock-token
```

### Test Database

Tests use a separate test database that is cleaned between test runs:

```typescript
// test-utils.ts
export async function setupTestDatabase() {
  // Connect to test database
  await mongoose.connect(process.env.DATABASE_URI_TEST!)
  
  // Clear all collections
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
}

export async function cleanupTestDatabase() {
  await mongoose.connection.close()
}
```

## Mocking External Services

### FedSync API Mocking

```typescript
// __tests__/mocks/fedsync-api.ts
import { vi } from 'vitest'

vi.mock('fedsync-standalone', () => ({
  FedSyncAPI: vi.fn().mockImplementation(() => ({
    getEvents: vi.fn().mockResolvedValue(mockEvents),
    getProfiles: vi.fn().mockResolvedValue(mockProfiles),
    getCategories: vi.fn().mockResolvedValue(mockCategories)
  }))
}))
```

### Payload CMS Mocking

```typescript
// __tests__/mocks/payload.ts
const mockPayload = {
  find: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn()
}

vi.mock('payload', () => ({ default: mockPayload }))
```

## Testing Best Practices

### 1. Test Isolation
- Each test should be independent
- Clean up data between tests
- Use fresh mocks for each test

### 2. Test Data Management
- Use factories for generating test data
- Keep test data minimal but realistic
- Use fixtures for complex scenarios

### 3. Async Testing
- Always await async operations
- Use proper error handling
- Test both success and failure cases

### 4. Performance Testing
- Test with realistic data volumes
- Measure import performance
- Set reasonable timeouts

```typescript
// Example performance test
it('should import 1000 events in under 30 seconds', async () => {
  const startTime = Date.now()
  const events = generateMockEvents(1000)
  
  await importer.importEvents(events)
  
  const duration = Date.now() - startTime
  expect(duration).toBeLessThan(30000)
}, 35000) // 35 second timeout
```

## Continuous Integration

### GitHub Actions

Tests run automatically on pull requests:

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:4.4
        ports:
          - 27017:27017
    
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run tests
        run: pnpm test
        env:
          DATABASE_URI_TEST: mongodb://localhost:27017/test
          PAYLOAD_SECRET: test-secret
```

## Debugging Tests

### Debug Mode

```bash
# Run tests in debug mode
NODE_OPTIONS="--inspect" pnpm test

# Run specific test with debugging
pnpm vitest run --reporter=verbose path/to/test.ts
```

### Logging in Tests

```typescript
// Enable debug logging in tests
process.env.LOG_LEVEL = 'debug'

// Or use console.log for debugging (remove before commit)
console.log('Debug: testing import of', event.title)
```

## Test Coverage

### Generating Coverage Reports

```bash
# Run tests with coverage
pnpm test --coverage

# Open coverage report
open coverage/index.html
```

### Coverage Goals
- **Minimum**: 80% line coverage
- **Target**: 90% line coverage
- **Critical paths**: 100% coverage (imports, transformers)

## Troubleshooting

### Common Issues

1. **MongoDB Connection Errors**
   - Ensure MongoDB is running
   - Check DATABASE_URI_TEST is correct
   - Verify test database permissions

2. **Timeout Errors**
   - Increase test timeout for slow operations
   - Check for hanging async operations
   - Ensure proper cleanup in afterEach

3. **Mock Issues**
   - Clear mocks between tests with `vi.clearAllMocks()`
   - Verify mock implementations match real APIs
   - Check mock modules are properly imported

### Debug Commands

```bash
# Run single test with full output
pnpm vitest run --reporter=verbose --no-coverage test-file.test.ts

# Run tests with database logging
DEBUG=payload:* pnpm test

# Run with memory debugging
NODE_OPTIONS="--max-old-space-size=4096" pnpm test
```

## Related Documentation

- [Development Guidelines](../CLAUDE.md) - Project standards and workflow
- [FedSync Integration](./fedsync/README.md) - Data import system
- [API Documentation](./API.md) - API endpoints and usage

For more specific testing scenarios, refer to the test files in the `__tests__` directories throughout the codebase.