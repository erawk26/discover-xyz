import { toNextJsHandler } from 'better-auth/next-js'
import { getPayload } from 'payload'
import config from '@/payload.config'

const payload = await getPayload({ config })

export const { POST, GET } = toNextJsHandler(payload.betterAuth)