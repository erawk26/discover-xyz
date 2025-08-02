# Authentication Setup Guide

[← Back to Main Documentation](./README.md)

## Overview

This project uses **Better Auth** with **payload-auth** plugin for authentication, providing a seamless integration between Better Auth and Payload CMS v3. This replaces the standard OAuth implementation with a more flexible and modern authentication system.

## Tech Stack

- **Better Auth** v1.3.4 - Modern authentication library
- **payload-auth** v1.6.4 - Integration plugin for Payload CMS
- **Payload CMS** v3.45.0
- **Next.js** v15.3.3
- **React** v19.1.0
- **TypeScript** with strict mode

## Quick Start

1. **Visit the login page**: Navigate to `/sign-in` or `/admin/login`
2. **Authentication options**:
   - Email/password registration and login
   - Google OAuth (if configured)
   - Magic link authentication
3. **Role-based access**: Users are assigned roles based on configuration

## Better Auth Configuration

### Environment Variables

```env
# Database (required)
DATABASE_URI=mongodb://localhost:27017/discover-xyz

# Payload Secret (required)
PAYLOAD_SECRET=your-secure-payload-secret

# Better Auth URL
BETTER_AUTH_URL=http://localhost:3026  # Change to https://yourdomain.com in production

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Provider (for magic links)
EMAIL_FROM=noreply@yourdomain.com
RESEND_API_KEY=your-resend-api-key  # or configure other email providers
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3026/api/auth/callback/google`
6. For production, add: `https://yourdomain.com/api/auth/callback/google`

## File Structure

```
/src/
├── app/
│   ├── (frontend)/
│   │   ├── sign-in/page.tsx              # Better Auth sign-in page
│   │   ├── sign-up/page.tsx              # Better Auth sign-up page
│   │   ├── dashboard/page.tsx            # Protected dashboard
│   │   ├── auth-callback/page.tsx        # OAuth callback handler
│   │   └── logout/page.tsx               # Logout handler
│   └── api/
│       └── auth/[...all]/route.ts        # Better Auth API routes
├── components/
│   └── auth/
│       ├── SignInForm.tsx                # Sign-in form component
│       ├── SignUpForm.tsx                # Sign-up form component
│       └── oauth-buttons.tsx             # OAuth provider buttons
├── lib/
│   ├── better-auth/
│   │   ├── index.ts                      # Better Auth instance
│   │   ├── client.ts                     # Client-side auth utilities
│   │   ├── auth-options.ts               # Auth configuration
│   │   ├── payload-sync.ts               # User sync with Payload
│   │   └── provider.tsx                  # React context provider
│   └── payload-auth-strategy.ts          # Custom auth strategy
└── payload.config.ts                     # Payload with auth plugin
```

## How It Works

### Authentication Flow

1. **User Registration/Login**:
   - Users can register with email/password via Better Auth
   - OAuth providers (Google) handle authentication externally
   - Magic links provide passwordless authentication

2. **Session Management**:
   - Better Auth manages sessions with secure cookies
   - Sessions are synchronized with Payload CMS
   - JWT tokens are used for API authentication

3. **User Synchronization**:
   - Better Auth users are automatically synced to Payload
   - User roles and permissions are managed in Payload
   - OAuth provider data is stored securely

### Protected Routes

Routes are protected using Better Auth's session management:

```typescript
// Example: Protected API route
import { auth } from '@/lib/better-auth'

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // Route logic here
}
```

## Security Features

- **TypeScript Strict Mode**: Ensures type safety across the authentication system
- **Secure Session Cookies**: HTTP-only, secure cookies for session management
- **CSRF Protection**: Built-in CSRF protection for all auth endpoints
- **Rate Limiting**: Configurable rate limiting for auth endpoints
- **Password Security**: Bcrypt hashing with configurable rounds

## API Endpoints

Better Auth provides these endpoints under `/api/auth`:

- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-in` - User login
- `POST /api/auth/sign-out` - User logout
- `GET /api/auth/session` - Get current session
- `POST /api/auth/magic-link/send` - Send magic link
- `GET /api/auth/callback/:provider` - OAuth callbacks

## Frontend Components

### Sign-In Form
Located at `/sign-in`, provides:
- Email/password login
- OAuth provider buttons
- Magic link option
- Link to registration

### Sign-Up Form
Located at `/sign-up`, provides:
- Email/password registration
- OAuth provider buttons
- Terms acceptance
- Link to login

## Troubleshooting

### Session Issues
- Check that cookies are enabled in the browser
- Verify `BETTER_AUTH_URL` matches your domain
- Ensure HTTPS in production (secure cookies)

### OAuth Problems
- Verify redirect URIs match exactly
- Check client ID and secret are correct
- Ensure provider APIs are enabled

### TypeScript Errors
- Project uses strict mode - all types must be explicit
- Run `pnpm typecheck` to verify type safety
- Check for `any` types and replace with proper types

## Migration from Standard OAuth

If migrating from standard OAuth to Better Auth:

1. Update environment variables
2. Install Better Auth dependencies
3. Configure payload-auth plugin
4. Update login/signup pages
5. Migrate existing user sessions

## Production Checklist

- [ ] Set production URLs in environment variables
- [ ] Configure proper email provider for magic links
- [ ] Enable HTTPS for secure cookies
- [ ] Set strong secrets for all auth tokens
- [ ] Configure rate limiting for auth endpoints
- [ ] Review and adjust session expiration
- [ ] Test all authentication flows
- [ ] Verify TypeScript strict mode compliance

## Additional Resources

- [Better Auth Documentation](https://www.better-auth.com)
- [Payload CMS v3 Documentation](https://payloadcms.com/docs)
- [Next.js 15 Auth Patterns](https://nextjs.org/docs/app/building-your-application/authentication)