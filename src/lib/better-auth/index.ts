// Better Auth is configured through the payload-auth plugin
// We should get the auth instance from Payload instead of creating our own

import { getPayload } from 'payload'
import config from '@/payload.config'

export async function getAuth() {
  const payload = await getPayload({ config })
  return (payload as any).betterAuth
}

// Create lazy-loaded auth to avoid module-level database connection
export const auth = {
  api: {
    getSession: async (...args: any[]) => {
      const authInstance = await getAuth()
      return authInstance.api.getSession(...args)
    },
    signOut: async (...args: any[]) => {
      const authInstance = await getAuth()
      return authInstance.api.signOut(...args)
    },
  }
}