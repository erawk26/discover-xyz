'use client'

import { createAuthClient } from 'better-auth/react'
import {
  organizationClient,
  passkeyClient,
  twoFactorClient,
  adminClient,
  multiSessionClient,
  usernameClient,
  anonymousClient,
  phoneNumberClient,
  magicLinkClient,
  emailOTPClient,
  apiKeyClient,
  inferAdditionalFields
} from 'better-auth/client/plugins'
import { toast } from 'sonner'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3026',
  plugins: [
    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = '/two-factor'
      }
    }),
    usernameClient(),
    anonymousClient(),
    phoneNumberClient(),
    magicLinkClient(),
    emailOTPClient(),
    passkeyClient(),
    adminClient(),
    apiKeyClient(),
    organizationClient(),
    multiSessionClient(),
    inferAdditionalFields({
      user: {
        role: {
          type: 'string',
          required: true
        }
      }
    })
  ],
  fetchOptions: {
    onError(e) {
      if (e.error.status === 429) {
        toast.error('Too many requests. Please try again later.')
      }
    }
  }
})

export const { 
  signUp, 
  signIn, 
  signOut, 
  useSession, 
  organization, 
  useListOrganizations, 
  useActiveOrganization,
  magicLink,
  twoFactor,
  passkey,
  phoneNumber,
  emailOTP
} = authClient