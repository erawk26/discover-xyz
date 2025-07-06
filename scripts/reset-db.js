import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

async function resetDatabase() {
  // Get database URI from environment or use default
  const databaseURI = process.env.DATABASE_URI || 'mongodb://localhost:27017/payload'

  console.warn('🗑️  Database Reset Script')
  console.warn('======================')
  console.warn(`Connecting to MongoDB at: ${databaseURI}`)

  try {
    // Extract database name from connection string
    const dbName = databaseURI.split('/').pop().split('?')[0]

    // Connect to MongoDB directly
    const client = new MongoClient(databaseURI)
    await client.connect()
    console.info('✅ Connected to MongoDB')

    const db = client.db(dbName)

    // Get all collection names
    const collections = await db.listCollections().toArray()

    if (collections.length === 0) {
      console.warn('⚠️  No collections found in the database')
    } else {
      // Loop through each collection and delete all documents
      for (const collection of collections) {
        const collectionName = collection.name

        // Skip system collections
        if (collectionName.startsWith('system.')) {
          console.info(`Skipping system collection: ${collectionName}`)
          continue
        }

        try {
          console.warn(`🧹 Clearing collection: ${collectionName}`)
          const result = await db.collection(collectionName).deleteMany({})
          console.info(`   ✅ Removed ${result.deletedCount} documents from ${collectionName}`)
        } catch (err) {
          console.error(`   ❌ Error clearing ${collectionName}:`, err)
        }
      }
    }

    console.info('\n✨ Database reset complete ✨')
    await client.close()
    console.info('Connection closed')
  } catch (error) {
    console.error('❌ Error resetting database:', error)
    process.exit(1)
  }

  process.exit(0)
}

resetDatabase()
