import type { BasePayload } from 'payload'
import type { Auth } from 'better-auth'

declare module 'payload' {
  export interface Payload extends BasePayload {
    betterAuth: Auth
  }
}