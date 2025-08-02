# Session Refresh Token Implementation

[← Back to Main Documentation](./README.md)

## Overview

This document describes the session refresh token implementation for Better Auth in the DiscoverXYZ project. The implementation provides automatic session renewal to prevent user logouts during active use.

## Implementation Details

### Architecture

Better Auth uses a database-backed session approach rather than traditional JWT refresh tokens. The implementation includes:

1. **Session Cookie Management**: Secure HTTP-only cookies with automatic renewal
2. **Cookie Caching**: Short-lived cache to reduce database queries
3. **Automatic Refresh**: Sessions refresh when accessed after the `updateAge` threshold
4. **Background Refresh**: Proactive refresh before expiration

### Configuration

The session configuration in `auth-options.ts`:

```typescript
session: {
  cookieCache: {
    enabled: true,
    maxAge: 5 * 60, // 5 minutes - short-lived cache
  },
  expiresIn: 60 * 60 * 24 * 7, // 7 days - main session lifetime
  updateAge: 60 * 60 * 24, // 1 day - refresh if older
  cookieName: 'better-auth.session',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  httpOnly: true,
  freshAge: 60 * 60 * 4, // 4 hours - consider fresh
  staleAge: 60 * 60 * 24 * 3, // 3 days - consider stale
}
```

### Session Refresh Manager

The `SessionRefreshManager` class provides:

- **Automatic Scheduling**: Refreshes sessions before expiry
- **Retry Logic**: Exponential backoff for failed refreshes
- **Concurrent Prevention**: Prevents multiple refresh attempts
- **React Integration**: Hook for component-level refresh control

### Usage

#### Basic Usage

The session refresh manager starts automatically when the app loads:

```typescript
// In BetterAuthProvider
useEffect(() => {
  sessionRefreshManager.start()
  return () => sessionRefreshManager.stop()
}, [])
```

#### Manual Refresh

Force a session refresh:

```typescript
const session = await sessionRefreshManager.forceRefresh()
```

#### React Hook

Use in components:

```typescript
function MyComponent() {
  const { refresh, isRefreshing } = useSessionRefresh({
    onRefreshSuccess: (session) => {
      console.log('Session refreshed')
    },
    onRefreshError: (error) => {
      console.error('Refresh failed:', error)
    }
  })

  return (
    <button onClick={refresh} disabled={isRefreshing}>
      Refresh Session
    </button>
  )
}
```

## Security Considerations

1. **HTTP-Only Cookies**: Prevents XSS attacks
2. **Secure Flag**: HTTPS-only in production
3. **SameSite Protection**: CSRF prevention
4. **Automatic Expiry**: Sessions expire after 7 days
5. **Rate Limiting**: Prevents refresh spam

## Testing

Run the session refresh tests:

```bash
pnpm test src/lib/better-auth/__tests__/session-refresh.test.ts
```

### Test Coverage

- ✅ Scheduled refresh before expiry
- ✅ Retry logic with exponential backoff
- ✅ Concurrent refresh prevention
- ✅ Immediate refresh for expired sessions
- ✅ Maximum retry limit

## Monitoring

### Logs

The implementation logs:
- Successful refreshes
- Failed refresh attempts
- Retry attempts

### Metrics to Track

1. Session refresh success rate
2. Average time between refreshes
3. Failed refresh attempts
4. User logout frequency

## Troubleshooting

### Common Issues

1. **Session Not Refreshing**
   - Check browser cookies are enabled
   - Verify `BETTER_AUTH_URL` matches domain
   - Ensure HTTPS in production

2. **Frequent Logouts**
   - Increase `expiresIn` duration
   - Check for clock skew between client/server
   - Verify database connectivity

3. **Refresh Loops**
   - Check `updateAge` vs `refreshThreshold`
   - Verify session data integrity
   - Look for middleware conflicts

## Future Enhancements

1. **Sliding Sessions**: Reset expiry on each activity
2. **Device Management**: Track sessions per device
3. **Revocation**: Admin ability to revoke sessions
4. **Analytics**: Session duration tracking

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `refreshThreshold` | 1 hour | Time before expiry to trigger refresh |
| `maxRetries` | 3 | Maximum refresh retry attempts |
| `expiresIn` | 7 days | Total session lifetime |
| `updateAge` | 1 day | Age threshold for automatic refresh |

## Migration from v3

If migrating from standard OAuth to Better Auth:

1. Sessions are now database-backed (not JWT)
2. Refresh happens automatically (not via refresh tokens)
3. Configure cookie settings appropriately
4. Test session persistence thoroughly

---

*Implementation Date: [Current Date]*
*Status: Implemented and Tested*