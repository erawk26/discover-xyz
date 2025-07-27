import { betterAuth } from 'better-auth'

/**
 * Create Better Auth instance
 * Starting with memory adapter for testing
 */
export const auth = betterAuth({
  // TODO: Add MongoDB adapter once import path is resolved
  // For now, using in-memory storage for testing
  
  // Email/password authentication
  emailAndPassword: {
    enabled: true,
  },
  
  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session if older than 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // Cache for 5 minutes
    },
  },
  
  // Cookie configuration
  advanced: {
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      httpOnly: true,
    },
  },
  
  // Base URL for auth endpoints
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3026',
  
  // Secret for signing tokens and cookies
  secret: process.env.BETTER_AUTH_SECRET || process.env.PAYLOAD_SECRET,
  
  // OAuth providers
  socialProviders: {
    google: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectURI: `${process.env.BETTER_AUTH_URL || 'http://localhost:3026'}/api/auth/callback/google`,
    } : undefined,
    github: process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET ? {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      redirectURI: `${process.env.BETTER_AUTH_URL || 'http://localhost:3026'}/api/auth/callback/github`,
    } : undefined,
  },
})

// Export types
export type Auth = typeof auth