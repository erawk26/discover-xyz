import type { BetterAuthOptions, User } from 'better-auth'
import { emailHarmony, phoneHarmony } from 'better-auth-harmony'
import { nextCookies } from 'better-auth/next-js'
import {
  admin,
  anonymous,
  apiKey,
  emailOTP,
  magicLink,
  multiSession,
  username,
  openAPI,
  organization,
  phoneNumber,
  twoFactor,
} from 'better-auth/plugins'
import { passkey } from 'better-auth/plugins/passkey'

export function createBetterAuthPlugins(appUrl: string) {
  return [
    emailHarmony(),
    phoneHarmony({
      defaultCountry: 'US',
    }),
    username(),
    twoFactor({
      issuer: process.env.SITE_NAME ?? 'Discover XYZ',
      otpOptions: {
        async sendOTP({ user, otp }) {
          console.log('Send OTP for user: ', user, otp)
          // TODO: Implement actual email sending
        },
      },
    }),
    phoneNumber({
      sendOTP: async ({ phoneNumber, code }, req) => {
        console.log('Send OTP for phone: ', phoneNumber, code)
        // TODO: Implement actual SMS sending
      },
    }),
    magicLink({
      sendMagicLink: async ({ email, token, url }, request) => {
        console.log('Send magic link for user: ', email, url)
        // TODO: Implement actual email sending
      },
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        console.log('Send verification OTP for user: ', email, otp, type)
        // TODO: Implement actual email sending
      },
    }),
    passkey({
      rpID: appUrl.replace(/https?:\/\//, ''),
      rpName: process.env.SITE_NAME ?? 'Discover XYZ',
      origin: appUrl,
    }),
    admin(),
    apiKey(),
    organization({
      teams: {
        enabled: false,
      },
      async sendInvitationEmail(data) {
        const inviteLink = `${appUrl}/accept-invitation/${data.id}`
        console.log('Send invite for org: ', data, inviteLink)
        // TODO: Implement actual email sending
      },
    }),
    multiSession(),
    openAPI(),
    nextCookies(),
  ]
}

// Email validation is now handled through the AllowedUsers collection
// This provides a better admin interface for managing access

export function createBetterAuthOptions(): BetterAuthOptions {
  const appUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3026'

  return {
    appName: process.env.SITE_NAME ?? 'Discover XYZ',
    baseURL: appUrl,
    trustedOrigins: [appUrl],
    secret: process.env.BETTER_AUTH_SECRET || process.env.PAYLOAD_SECRET || 'default-dev-secret',
    advanced: {
      database: {
        generateId: () => {
          // Generate a random ID that's compatible with MongoDB ObjectId format (24 hex chars)
          return Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join(
            '',
          )
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true, // Match example - require verification
      async sendResetPassword({ user, url }) {
        console.log('Send reset password for user: ', user, url)
        // TODO: Implement actual email sending
      },
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID || '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
        enabled: !!process.env.GITHUB_CLIENT_ID,
      },
    },
    emailVerification: {
      async sendVerificationEmail({ user, url }) {
        console.log('Send verification email for user: ', user, url)
        // TODO: Implement actual email sending
      },
    },
    plugins: createBetterAuthPlugins(appUrl),
    user: {
      additionalFields: {
        role: {
          type: 'string',
          defaultValue: 'authenticated',
          input: false, // Prevent users from changing their own role
        },
      },
      changeEmail: {
        enabled: true,
        sendChangeEmailVerification: async ({ user, newEmail, url, token }) => {
          console.log('Send change email verification for user: ', user, newEmail, url, token)
          // TODO: Implement actual email sending
        },
      },
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // 5 minutes
      },
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // Update session if older than 1 day
    },
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ['google', 'github', 'email-password'],
      },
    },
  }
}
