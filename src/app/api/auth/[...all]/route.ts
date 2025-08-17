import { toNextJsHandler } from 'better-auth/next-js'
import { getPayload } from 'payload'
import type { Auth } from 'better-auth'
import config from '@/payload.config'

// Extend Payload type to include betterAuth
interface PayloadWithAuth extends Awaited<ReturnType<typeof getPayload>> {
  betterAuth?: Auth
}

// Lazy-load handlers to avoid module-level database connection
export async function POST(req: any) {
  const payload = await getPayload({ config }) as PayloadWithAuth
  if (!payload.betterAuth) {
    throw new Error('betterAuth is not initialized on Payload instance')
  }
  const { POST: handler } = toNextJsHandler(payload.betterAuth)
  return handler(req)
}

export async function GET(req: any) {
  const payload = await getPayload({ config }) as PayloadWithAuth
  if (!payload.betterAuth) {
    throw new Error('betterAuth is not initialized on Payload instance')
  }
  const { GET: handler } = toNextJsHandler(payload.betterAuth)
  return handler(req)
}