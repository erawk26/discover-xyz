import type { PayloadRequest } from 'payload'
import { auth } from './better-auth'

export async function payloadAuthStrategy(args: {
  headers: Headers
  payload: any
}): Promise<{ user: any } | null> {
  try {
    // Get Better Auth session
    const session = await auth.api.getSession({
      headers: args.headers
    })
    
    if (!session?.user) {
      return null
    }
    
    // Find the user in Payload
    const users = await args.payload.find({
      collection: 'users',
      where: {
        email: { equals: session.user.email }
      },
      limit: 1,
      depth: 0
    })
    
    if (users.docs.length > 0) {
      return { user: users.docs[0] }
    }
    
    return null
  } catch (error) {
    console.error('Payload auth strategy error:', error)
    return null
  }
}