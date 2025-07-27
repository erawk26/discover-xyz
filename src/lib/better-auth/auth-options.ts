import type { BetterAuthOptions } from 'better-auth'
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
  twoFactor
} from 'better-auth/plugins'
import { passkey } from 'better-auth/plugins/passkey'

export function createBetterAuthPlugins() {
  return [
    emailHarmony(),
    phoneHarmony({
      defaultCountry: 'US'
    }),
    username(),
    twoFactor({
      issuer: 'Discover XYZ',
      otpOptions: {
        async sendOTP({ user, otp }) {
          console.log('Send OTP for user: ', user, otp)
          // TODO: Implement actual email sending
        }
      }
    }),
    phoneNumber({
      sendOTP: async ({ phoneNumber, code }, req) => {
        console.log('Send OTP for phone: ', phoneNumber, code)
        // TODO: Implement actual SMS sending
      }
    }),
    magicLink({
      sendMagicLink: async ({ email, token, url }, request) => {
        console.log('Send magic link for user: ', email, url)
        // TODO: Implement actual email sending
      }
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        console.log('Send verification OTP for user: ', email, otp, type)
        // TODO: Implement actual email sending
      }
    }),
    passkey({
      rpID: process.env.NEXT_PUBLIC_APP_URL?.replace(/https?:\/\//, '') || 'localhost',
      rpName: 'Discover XYZ',
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3026'
    }),
    admin(),
    apiKey(),
    organization({
      teams: {
        enabled: false
      },
      async sendInvitationEmail(data) {
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3026'}/accept-invitation/${data.id}`
        console.log('Send invite for org: ', data, inviteLink)
        // TODO: Implement actual email sending
      }
    }),
    multiSession(),
    openAPI(),
    nextCookies()
  ]
}

// Email domain configuration for team access and roles
const EMAIL_DOMAIN_CONFIG = [
  {
    pattern: /^.*@milespartnership\.com$/i,
    role: 'content-editor',
    description: 'Miles Partnership team members'
  },
  // Add more domain configurations as needed
  // Example:
  // {
  //   pattern: /^.*@example\.com$/i,
  //   role: 'authenticated',
  //   description: 'Example company users'
  // },
]

function isEmailAllowed(email: string): boolean {
  return EMAIL_DOMAIN_CONFIG.some(config => config.pattern.test(email))
}

function getRoleForEmail(email: string): string {
  const config = EMAIL_DOMAIN_CONFIG.find(c => c.pattern.test(email))
  return config?.role || 'authenticated'
}

export function createBetterAuthOptions(): BetterAuthOptions {
  return {
    appName: 'Discover XYZ',
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3026',
    trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3026'],
    secret: process.env.BETTER_AUTH_SECRET || process.env.PAYLOAD_SECRET || 'default-dev-secret',
    advanced: {
      database: {
        generateId: () => {
          // Generate a random ID that's compatible with MongoDB ObjectId format (24 hex chars)
          return Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
        }
      },
      hooks: {
        // Validate email before sign up
        beforeSignUp: async (user) => {
          if (!isEmailAllowed(user.email)) {
            throw new Error('Registration is restricted to team members only')
          }
          return user
        }
      }
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true, // Match example - require verification
      async sendResetPassword({ user, url }) {
        console.log('Send reset password for user: ', user, url)
        // TODO: Implement actual email sending
      }
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        // Map email domain to role using centralized config
        mapProfileToUser: (profile) => {
          return {
            email: profile.email,
            name: profile.name,
            image: profile.picture,
            emailVerified: profile.email_verified,
            role: getRoleForEmail(profile.email || '')
          }
        }
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID || '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
        enabled: !!process.env.GITHUB_CLIENT_ID,
        // Map email domain to role using centralized config
        mapProfileToUser: (profile) => {
          return {
            email: profile.email,
            name: profile.name,
            image: profile.avatar_url,
            emailVerified: true, // GitHub doesn't provide email verification status
            role: getRoleForEmail(profile.email || '')
          }
        }
      }
    },
    emailVerification: {
      async sendVerificationEmail({ user, url }) {
        console.log('Send verification email for user: ', user, url)
        // TODO: Implement actual email sending
      }
    },
    plugins: createBetterAuthPlugins(),
    user: {
      additionalFields: {
        role: {
          type: 'string',
          defaultValue: 'authenticated',
          required: true,
          input: false, // Prevent users from changing their own role
          // Define enum values for role
          enum: ['admin', 'content-editor', 'authenticated'] as const
        }
      },
      changeEmail: {
        enabled: true,
        sendChangeEmailVerification: async ({ user, newEmail, url, token }) => {
          console.log('Send change email verification for user: ', user, newEmail, url, token)
          // TODO: Implement actual email sending
        }
      }
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60 // 5 minutes
      },
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24 // Update session if older than 1 day
    },
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ['google', 'github', 'email-password']
      }
    }
  }
}