import { betterAuth } from 'better-auth'
import { mongodbAdapter } from 'better-auth/adapters/mongodb'
import { createBetterAuthOptions } from './auth-options'
import { MongoClient } from 'mongodb'

// Create MongoDB client for Better Auth
const client = new MongoClient(process.env.DATABASE_URI!)

export const auth = betterAuth({
  ...createBetterAuthOptions(),
  database: mongodbAdapter(client.db('discover-xyz'))
})

// Export the type for use in other files
export type Auth = typeof auth