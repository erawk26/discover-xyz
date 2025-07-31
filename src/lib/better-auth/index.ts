// Better Auth is configured through the payload-auth plugin
// We should get the auth instance from Payload instead of creating our own

import { getPayload } from 'payload'
import config from '@/payload.config'

export async function getAuth() {
  const payload = await getPayload({ config })
  return payload.betterAuth
}

// For backwards compatibility, export auth as a promise
export const auth = await getAuth()