declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URI: string
    PAYLOAD_SECRET: string
    PAYLOAD_URL: string
    NEXT_PUBLIC_SERVER_URL: string
    NEXT_PUBLIC_IS_LIVE: string
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string
    STRIPE_SECRET_KEY: string
    STRIPE_WEBHOOKS_SIGNING_SECRET: string
    PAYLOAD_PUBLIC_DRAFT_SECRET: string
    REVALIDATION_KEY: string
    // Better Auth
    BETTER_AUTH_SECRET: string
    GOOGLE_CLIENT_ID: string
    GOOGLE_CLIENT_SECRET: string
    GITHUB_CLIENT_ID?: string
    GITHUB_CLIENT_SECRET?: string
  }
}