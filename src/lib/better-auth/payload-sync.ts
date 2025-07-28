import { headers } from 'next/headers'
import type { User as PayloadUser } from '@/payload-types'
import { getPayload } from 'payload'
import config from '@/payload.config'

/**
 * Get the current Better Auth session
 */
export async function getBetterAuthSession() {
  const payload = await getPayload({ config })
  const session = await payload.betterAuth.api.getSession({
    headers: await headers() 
  })
  
  return session
}

/**
 * Sync Better Auth user with Payload user
 */
export async function syncBetterAuthToPayload(betterAuthUser: any) {
  const payload = await getPayload({ config })
  
  try {
    // Check if user exists
    const existingUsers = await payload.find({
      collection: 'users',
      where: {
        email: { equals: betterAuthUser.email }
      },
      limit: 1
    })
    
    let payloadUser: PayloadUser
    
    if (existingUsers.docs.length > 0) {
      // Update existing user
      payloadUser = await payload.update({
        collection: 'users',
        id: existingUsers.docs[0].id,
        data: {
          name: betterAuthUser.name || existingUsers.docs[0].name,
          role: betterAuthUser.role || existingUsers.docs[0].role,
        }
      }) as PayloadUser
    } else {
      // Create new user
      const crypto = await import('crypto')
      const tempPassword = crypto.randomBytes(32).toString('hex')
      
      payloadUser = await payload.create({
        collection: 'users',
        data: {
          email: betterAuthUser.email,
          name: betterAuthUser.name || betterAuthUser.email.split('@')[0],
          password: tempPassword, // Required by Payload
          role: betterAuthUser.role || 'authenticated',
        }
      }) as PayloadUser
    }
    
    return payloadUser
  } catch (error) {
    console.error('Error syncing Better Auth user to Payload:', error)
    throw error
  }
}

/**
 * Middleware to inject Better Auth user into Payload requests
 */
export async function withBetterAuthUser(req: any) {
  try {
    const session = await getBetterAuthSession()
    
    if (session?.user) {
      // Sync user with Payload
      const payloadUser = await syncBetterAuthToPayload(session.user)
      
      // Inject user into request
      req.user = payloadUser
      
      // Also set the user in context for Payload auth
      if (!req.context) req.context = {}
      req.context.user = payloadUser
    }
  } catch (error) {
    console.error('Error in Better Auth middleware:', error)
  }
  
  return req
}