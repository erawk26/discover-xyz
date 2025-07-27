import { MongoClient, Db } from 'mongodb'

let client: MongoClient | null = null
let db: Db | null = null

/**
 * Get MongoDB client for Better Auth
 * Reuses the same connection as Payload CMS
 */
export function getMongoClient(): Db {
  if (db) {
    return db
  }

  const uri = process.env.NODE_ENV === 'test' 
    ? process.env.TEST_DATABASE_URI! 
    : process.env.DATABASE_URI!

  if (!uri) {
    throw new Error('DATABASE_URI is not defined')
  }

  // Extract database name from URI
  const dbName = uri.split('/').pop()?.split('?')[0]
  if (!dbName) {
    throw new Error('Could not extract database name from URI')
  }

  // Create client if not exists
  if (!client) {
    client = new MongoClient(uri)
  }

  // Connect and get database
  db = client.db(dbName)
  
  return db
}