# Railway Environment Variables Required

Set these in your Railway web service's Variables tab:

## Critical (Required for app to start)
- `DATABASE_URI` = `mongodb://mongo:gmeQLxzUUnNnfScbtnVcEDktqzhxzLUN@tramway.proxy.rlwy.net:39556`
- `PAYLOAD_SECRET` = `[generate a secure random string]`
- `BETTER_AUTH_SECRET` = `[generate a secure random string]`
- `NEXT_PUBLIC_SERVER_URL` = `https://[your-app-name].up.railway.app`

## OAuth (Required if using social login)
- `GOOGLE_CLIENT_ID` = `[your Google OAuth client ID]`
- `GOOGLE_CLIENT_SECRET` = `[your Google OAuth secret]`
- `GITHUB_CLIENT_ID` = `[your GitHub OAuth client ID]`
- `GITHUB_CLIENT_SECRET` = `[your GitHub OAuth secret]`

## Email (Optional - for email features)
- `RESEND_API_KEY` = `[your Resend API key if using email]`

## Other
- `SITE_NAME` = `Discover XYZ`
- `NODE_ENV` = `production` (Railway might set this automatically)

## Automatically provided by Railway (don't set these)
- `PORT` - Railway provides this
- `RAILWAY_PUBLIC_DOMAIN` - Railway provides this

## Build Arguments (set in railway.toml, already configured)
- These are passed during Docker build via railway.toml