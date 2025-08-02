# Authentication Setup Guide

[← Back to Main Documentation](../README.md)

## Quick Start

1. **Visit the Payload admin login**: Navigate to `/admin/login`
2. **OAuth login is available** with the "Continue with Google" button
3. **Domain-based roles**: @milespartnership.com emails get "content-editor" role

## OAuth Configuration

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3026/api/auth/callback/google`
6. For production, add: `https://yourdomain.com/api/auth/callback/google`
7. Copy Client ID and Client Secret to your `.env`:

```env
GOOGLE_CLIENT_ID=your-actual-google-client-id
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret
BETTER_AUTH_URL=http://localhost:3026
```

Note: `BETTER_AUTH_URL` is used for constructing OAuth redirect URIs.

## Authentication Methods Available

### 1. Standard Payload Login
- Email/password authentication via Payload CMS
- Available at `/admin/login`

### 2. Google OAuth Login
- "Continue with Google" button on Payload admin login
- Automatic user creation on first login
- Role assignment based on email domain
- No password required for OAuth users

### 3. Magic Links (Separate Login Page)
- Available at `/login` (custom login page)
- Enter email to receive a one-time login link
- Currently using mock implementation

## File Structure

```
/src/
├── app/
│   ├── login/page.tsx                    # Custom login page (optional)
│   └── api/auth/
│       ├── oauth/
│       │   └── initiate/route.ts         # Start OAuth flow
│       ├── callback/
│       │   └── [provider]/route.ts       # OAuth callback handler
│       ├── oauth-session/route.ts        # Create Payload session
│       └── magic-link/
│           ├── send/route.ts             # Send magic link
│           └── verify/route.ts           # Verify magic link
├── components/
│   ├── BeforeLogin/index.tsx             # OAuth buttons for Payload admin
│   └── auth/
│       ├── oauth-buttons.tsx             # OAuth button component
│       └── magic-link-form.tsx           # Magic link form
├── collections/
│   └── Users/index.ts                    # Modified for OAuth support
└── lib/auth/
    └── oauth-providers.ts                # OAuth provider logic
```

## How It Works

### OAuth Flow
1. User clicks "Continue with Google" on `/admin/login`
2. Redirected to Google for authentication
3. Google redirects back to `/api/auth/callback/google`
4. User is created/updated in Payload with:
   - Auto-generated secure password
   - OAuth provider info saved
   - Role based on email domain
5. Payload session is created with JWT token
6. User is redirected to `/admin` dashboard

### User Creation
- OAuth users are created with `oauth_provider` and `oauth_id` fields
- Passwords are auto-generated (users don't need them)
- Existing users are updated if email matches

## Production Checklist

- [ ] Set real values for OAuth client IDs and secrets
- [ ] Update `BETTER_AUTH_URL` to production domain
- [ ] Update Google OAuth Console with production redirect URIs
- [ ] Ensure HTTPS is enabled (required for OAuth)
- [ ] Set secure `PAYLOAD_SECRET`
- [ ] Review session expiration (currently 7 days)

## Environment Variables

```env
# Required for OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
BETTER_AUTH_URL=http://localhost:3026  # Change to https://yourdomain.com in production

# Required for Payload
PAYLOAD_SECRET=your-payload-secret
DATABASE_URI=mongodb://...
```

## Troubleshooting

### OAuth redirect_uri_mismatch error?
- Ensure the redirect URI in Google Console matches exactly: `http://localhost:3026/api/auth/callback/google`
- Check that `BETTER_AUTH_URL` environment variable is set correctly
- For production, update to use HTTPS and your domain

### Can't see OAuth button?
- Check that you're on the Payload admin login: `/admin/login`
- The button appears below the standard login form

### OAuth login succeeds but can't access admin?
- Check browser cookies for `payload-token`
- Verify the user was created in the database
- Check user role permissions in Payload

### Session expires quickly?
- Sessions are set to 7 days
- Check `tokenExpiration` in Users collection config

## Security Notes

- OAuth users don't have accessible passwords
- All sessions use HTTP-only secure cookies
- CSRF protection via state parameter in OAuth flow
- Automatic secure password generation for OAuth users

## Future Enhancements

- GitHub OAuth support (code exists but not integrated)
- Account linking (connect multiple OAuth providers)
- OAuth disconnect functionality
- User profile management
- Refresh token implementation