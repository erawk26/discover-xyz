import { toNextJsHandler } from 'better-auth/next-js'
import { getPayload } from 'payload'
import type { Auth } from 'better-auth'
import config from '@/payload.config'

// Extend Payload type to include betterAuth
interface PayloadWithAuth extends Awaited<ReturnType<typeof getPayload>> {
  betterAuth?: Auth
}

const payload = await getPayload({ config }) as PayloadWithAuth

if (!payload.betterAuth) {
  throw new Error('betterAuth is not initialized on Payload instance')
}

export const { POST, GET } = toNextJsHandler(payload.betterAuth)