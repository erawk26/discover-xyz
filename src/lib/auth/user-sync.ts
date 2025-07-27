import type { User as PayloadUser } from '@/payload-types'

// Better Auth user type (simplified)
export interface BetterAuthUser {
  id: string
  email: string
  name?: string
  emailVerified?: boolean
  image?: string
  createdAt?: Date
  updatedAt?: Date
}

// Role mappings
const ROLE_MAP = {
  // Payload -> Better Auth
  'admin': 'admin',
  'site-builder': 'editor',
  'content-editor': 'editor',
  'authenticated': 'user'
} as const

const REVERSE_ROLE_MAP = {
  // Better Auth -> Payload
  'admin': 'admin',
  'editor': 'content-editor',
  'user': 'authenticated'
} as const

/**
 * Map Better Auth user to Payload user format
 */
export function mapBetterAuthToPayload(betterAuthUser: Partial<BetterAuthUser>) {
  // Check if email is from milespartnership.com domain
  const email = betterAuthUser.email!
  const isMilesPartnership = email.toLowerCase().endsWith('@milespartnership.com')
  
  return {
    email: email,
    name: betterAuthUser.name || email.split('@')[0],
    betterAuthId: betterAuthUser.id!,
    role: isMilesPartnership ? 'content-editor' as const : 'authenticated' as const,
    // For OAuth users, set a random password that won't be used
    password: generateSecurePassword(),
    // Additional fields as needed
  }
}

// Generate a secure random password for OAuth users
function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 32; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

/**
 * Map Payload user to Better Auth format
 */
export function mapPayloadToBetterAuth(payloadUser: Partial<PayloadUser>) {
  return {
    id: payloadUser.betterAuthId as string,
    email: payloadUser.email!,
    name: payloadUser.name || '',
    // Additional fields as needed
  }
}

/**
 * Map Payload role to Better Auth role
 */
export function mapPayloadRoleToBetterAuth(role: string): string {
  return ROLE_MAP[role as keyof typeof ROLE_MAP] || 'user'
}

/**
 * Map Better Auth role to Payload role
 */
export function mapBetterAuthRoleToPayload(role: string): string {
  return REVERSE_ROLE_MAP[role as keyof typeof REVERSE_ROLE_MAP] || 'authenticated'
}

/**
 * Sync Better Auth user to Payload
 */
export async function syncBetterAuthToPayload(
  betterAuthUser: Partial<BetterAuthUser>,
  payload: any // TODO: Type this properly with Payload instance
): Promise<PayloadUser> {
  // Check if user already exists in Payload
  const existingUsers = await payload.find({
    collection: 'users',
    where: {
      betterAuthId: {
        equals: betterAuthUser.id,
      },
    },
  })

  if (existingUsers.docs.length > 0) {
    // Update existing user
    const existingUser = existingUsers.docs[0]
    return await payload.update({
      collection: 'users',
      id: existingUser.id,
      data: {
        email: betterAuthUser.email,
        name: betterAuthUser.name || betterAuthUser.email?.split('@')[0],
      },
    })
  } else {
    // Create new user
    const mappedUser = mapBetterAuthToPayload(betterAuthUser)
    return await payload.create({
      collection: 'users',
      data: mappedUser,
    })
  }
}

/**
 * Sync Payload user to Better Auth
 */
export async function syncPayloadToBetterAuth(
  payloadUser: Partial<PayloadUser>,
  auth: any // TODO: Type this properly with Auth instance
): Promise<BetterAuthUser | null> {
  // For now, return mapped user - will implement actual sync when Better Auth adapter is ready
  const mappedUser = mapPayloadToBetterAuth(payloadUser)
  return mappedUser as BetterAuthUser
}

/**
 * Find or create Payload user from Better Auth user
 */
export async function findOrCreatePayloadUser(
  betterAuthUser: Partial<BetterAuthUser>,
  payload: any
): Promise<PayloadUser> {
  // First try to find by betterAuthId
  let existingUsers = await payload.find({
    collection: 'users',
    where: {
      betterAuthId: {
        equals: betterAuthUser.id,
      },
    },
  })

  if (existingUsers.docs.length === 0 && betterAuthUser.email) {
    // Try to find by email if no betterAuthId match
    existingUsers = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: betterAuthUser.email,
        },
      },
    })

    if (existingUsers.docs.length > 0) {
      // Update existing user with betterAuthId
      const existingUser = existingUsers.docs[0]
      return await payload.update({
        collection: 'users',
        id: existingUser.id,
        data: {
          betterAuthId: betterAuthUser.id,
          name: betterAuthUser.name || existingUser.name,
        },
      })
    }
  }

  // If still no user found, sync will create new one
  return await syncBetterAuthToPayload(betterAuthUser, payload)
}

/**
 * Sync user role between Better Auth and Payload
 */
export async function syncUserRole(
  betterAuthUser: { role?: string } & Partial<BetterAuthUser>,
  payloadUser: PayloadUser,
  payload: any
): Promise<PayloadUser> {
  if (!betterAuthUser.role) {
    return payloadUser
  }

  const mappedRole = mapBetterAuthRoleToPayload(betterAuthUser.role)
  
  // Only update if role is different
  if (payloadUser.role !== mappedRole) {
    return await payload.update({
      collection: 'users',
      id: payloadUser.id,
      data: {
        role: mappedRole,
      },
    })
  }

  return payloadUser
}

/**
 * Preserve admin permissions during sync
 */
export async function preserveAdminPermissions(
  payloadUser: PayloadUser,
  betterAuthUser: { role?: string } & Partial<BetterAuthUser>
): Promise<{ role: string }> {
  // Never downgrade admin users
  if (payloadUser.role === 'admin') {
    return { role: 'admin' }
  }

  // For non-admin users, allow role changes
  if (betterAuthUser.role) {
    return { role: betterAuthUser.role }
  }

  return { role: payloadUser.role }
}

/**
 * Batch sync roles for multiple users
 */
export async function batchSyncRoles(
  users: Array<{ betterAuthId: string; role: string }>,
  payload: any
): Promise<PayloadUser[]> {
  // Get all Payload users with these Better Auth IDs
  const payloadUsers = await payload.find({
    collection: 'users',
    where: {
      betterAuthId: {
        in: users.map(u => u.betterAuthId),
      },
    },
    limit: users.length,
  })

  const updates = []
  
  for (const user of users) {
    const payloadUser = payloadUsers.docs.find(
      (u: PayloadUser) => u.betterAuthId === user.betterAuthId
    )
    
    if (payloadUser) {
      const mappedRole = mapBetterAuthRoleToPayload(user.role)
      
      if (payloadUser.role !== mappedRole) {
        updates.push(
          payload.update({
            collection: 'users',
            id: payloadUser.id,
            data: { role: mappedRole },
          })
        )
      } else {
        updates.push(Promise.resolve(payloadUser))
      }
    }
  }

  return Promise.all(updates)
}