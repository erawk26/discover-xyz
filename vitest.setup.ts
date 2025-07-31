// Any setup scripts you might need go here

// Load .env files
import 'dotenv/config'

// Set test environment
process.env.NODE_ENV = 'test'

// Configure test database
if (!process.env.TEST_DATABASE_URI) {
  // Use a separate test database
  const baseUri = process.env.DATABASE_URI || 'mongodb://127.0.0.1/discover-xyz'
  process.env.TEST_DATABASE_URI = baseUri.replace(/\/[^/]+$/, '/discover-xyz-test')
}
