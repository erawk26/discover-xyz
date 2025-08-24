# Fly.io Secrets and Environment Variables Guide

## Overview

This document explains how environment variables and secrets are managed for this application on Fly.io, following best practices.

## Types of Configuration

### 1. Public Build-Time Variables (fly.toml)

These are non-sensitive configuration values that need to be available during the Docker build process. They are defined in `fly.toml` under `[build.args]`:

```toml
[build.args]
  NEXT_PUBLIC_SERVER_URL = "https://mpblueprint.xyz"
  NEXT_PUBLIC_APP_URL = "https://mpblueprint.xyz"
  NEXT_PUBLIC_GOOGLE_CLIENT_ID = "your-public-client-id"
```

**Characteristics:**
- NOT secrets - these values are public
- Baked into the client-side JavaScript bundle
- Visible to anyone who inspects the code
- Used for: public API endpoints, public OAuth client IDs, app URLs

### 2. Runtime Secrets (fly secrets)

Sensitive values that should only be available at runtime, never exposed in code or builds:

```bash
fly secrets set DATABASE_URI="postgresql://..." 
fly secrets set BETTER_AUTH_SECRET="..."
fly secrets set GOOGLE_CLIENT_SECRET="..."
```

**Characteristics:**
- Encrypted and stored in Fly.io's vault
- Only available as environment variables at runtime
- Never exposed in builds or client code
- Used for: database credentials, private API keys, OAuth secrets

### 3. Build-Time Secrets (--build-secret)

For sensitive values needed during Docker build (rare for this app):

```bash
fly deploy --build-secret MY_PRIVATE_KEY=value
```

In Dockerfile:
```dockerfile
RUN --mount=type=secret,id=MY_PRIVATE_KEY \
    MY_PRIVATE_KEY="$(cat /run/secrets/MY_PRIVATE_KEY)" \
    npm run build
```

**Characteristics:**
- Only available during build, not in final image
- Never committed to code
- Used for: private npm registry tokens, build-time API keys

## Current Configuration

### Public Variables (in fly.toml)
- `NEXT_PUBLIC_SERVER_URL`: The public URL of the application
- `NEXT_PUBLIC_APP_URL`: The public app URL for auth redirects
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Public Google OAuth client ID

### Runtime Secrets (via fly secrets)
View current secrets: `fly secrets list`

Required secrets:
- `DATABASE_URI`: PostgreSQL connection string
- `PAYLOAD_SECRET`: JWT signing secret
- `BETTER_AUTH_SECRET`: Authentication secret key
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GITHUB_CLIENT_ID`: GitHub OAuth client ID (optional)
- `GITHUB_CLIENT_SECRET`: GitHub OAuth client secret (optional)

## Best Practices

1. **Never put secrets in fly.toml** - Only public configuration
2. **Use fly secrets for sensitive data** - Database URLs, API keys, etc.
3. **NEXT_PUBLIC_* are not secrets** - They're meant to be public
4. **Document what's public vs secret** - Clear separation helps security
5. **Rotate secrets regularly** - Use `fly secrets set` to update

## Deployment Commands

### Standard deployment (uses fly.toml build args):
```bash
fly deploy
```

### Deployment with build-time secret (if needed):
```bash
fly deploy --build-secret SOME_BUILD_SECRET=value
```

### Update runtime secret:
```bash
fly secrets set SECRET_NAME="new-value"
```

### List all secrets:
```bash
fly secrets list
```

## Troubleshooting

- **Build fails due to missing variable**: Check if it should be in fly.toml (public) or passed via --build-secret
- **Runtime error about missing env var**: Use `fly secrets set` to add it
- **Client can't access API**: Ensure NEXT_PUBLIC_* vars are in fly.toml and rebuild