import type { BetterAuthOptions } from 'better-auth'
import { emailHarmony, phoneHarmony } from 'better-auth-harmony'
import { nextCookies } from 'better-auth/next-js'
import {
  admin,
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
import { sendEmail, emailTemplates } from '@/lib/email/resend'

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
          const template = emailTemplates.otpEmail(otp, 'Two-Factor Authentication')
          await sendEmail({
            to: user.email,
            ...template
          })
        },
      },
    }),
    phoneNumber({
      sendOTP: async () => {
        // TODO: Implement actual SMS sending
        // For now, silently skip - do not log sensitive codes
      },
    }),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        const template = emailTemplates.magicLinkEmail(url)
        await sendEmail({
          to: email,
          ...template
        })
      },
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        const template = emailTemplates.otpEmail(otp, 'Email Verification')
        await sendEmail({
          to: email,
          ...template
        })
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
        const inviteUrl = `${appUrl}/accept-invitation/${data.id}`
        const inviterName = data.inviter.user.name || data.inviter.user.email
        const template = emailTemplates.invitationEmail(
          inviteUrl,
          inviterName,
          data.organization.name
        )
        await sendEmail({
          to: data.email,
          ...template
        })
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
    secret: (() => {
      const secret = process.env.BETTER_AUTH_SECRET || process.env.PAYLOAD_SECRET
      if (!secret || secret.length < 32) {
        throw new Error(
          'BETTER_AUTH_SECRET must be set and at least 32 characters long. ' +
          'Generate a secure secret with: openssl rand -base64 32'
        )
      }
      return secret
    })(),
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
        const template = emailTemplates.passwordResetEmail(url)
        await sendEmail({
          to: user.email,
          ...template
        })
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
        const template = emailTemplates.verificationEmail(url)
        await sendEmail({
          to: user.email,
          ...template
        })
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
        sendChangeEmailVerification: async ({ url, newEmail }) => {
          const template = emailTemplates.changeEmailVerification(url, newEmail)
          await sendEmail({
            to: newEmail,
            ...template
          })
        },
      },
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // 5 minutes - short-lived cache for performance
      },
      expiresIn: 60 * 60 * 24 * 7, // 7 days - main session lifetime
      updateAge: 60 * 60 * 24, // 1 day - refresh session if older than this
      // freshAge helps determine when to proactively refresh
      freshAge: 60 * 60 * 4, // 4 hours - consider session fresh if newer than this
    },
    rateLimit: {
      enabled: true,
      window: 60, // 1 minute window
      max: 10, // Max 10 requests per minute
      customRules: {
        '/api/auth/sign-in': { max: 5, window: 300 }, // 5 login attempts per 5 minutes
        '/api/auth/sign-up': { max: 3, window: 300 }, // 3 signups per 5 minutes
        '/api/auth/forgot-password': { max: 3, window: 300 }, // 3 resets per 5 minutes
      },
    },
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ['google', 'github', 'email-password'],
      },
    },
  }
}
