'use client'

import { useSessionRefresh } from '@/lib/better-auth/session-refresh'
import { useSession } from '@/lib/better-auth/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SessionTestPage() {
  const session = useSession()
  const { refresh, isRefreshing } = useSessionRefresh({
    onRefreshSuccess: () => {
      console.log('Session refreshed successfully')
    },
    onRefreshError: (error) => {
      console.error('Session refresh failed:', error)
    },
  })

  if (!session.data) {
    return (
      <div className="container max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Session Test</CardTitle>
            <CardDescription>No active session found</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Get expiration time - handle both Date and timestamp formats
  const sessionExpiry = session.data.session?.expiresAt || session.data.session?.updatedAt
  const expiresAt = sessionExpiry instanceof Date 
    ? sessionExpiry 
    : typeof sessionExpiry === 'number' 
      ? new Date(sessionExpiry * 1000)
      : new Date(sessionExpiry)
  
  const now = new Date()
  const timeRemaining = Math.max(0, expiresAt.getTime() - now.getTime())
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60))
  const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Session Test Page</CardTitle>
          <CardDescription>Test session refresh functionality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Current Session</h3>
            <dl className="space-y-1 text-sm">
              <div>
                <dt className="inline font-medium">User:</dt>
                <dd className="inline ml-2">{session.data.user.email}</dd>
              </div>
              <div>
                <dt className="inline font-medium">Role:</dt>
                <dd className="inline ml-2">{session.data.user.role}</dd>
              </div>
              <div>
                <dt className="inline font-medium">Session ID:</dt>
                <dd className="inline ml-2 font-mono text-xs">{session.data.session.id}</dd>
              </div>
            </dl>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Session Expiry</h3>
            <dl className="space-y-1 text-sm">
              <div>
                <dt className="inline font-medium">Expires at:</dt>
                <dd className="inline ml-2">{expiresAt.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="inline font-medium">Time remaining:</dt>
                <dd className="inline ml-2">
                  {hoursRemaining}h {minutesRemaining}m
                </dd>
              </div>
            </dl>
          </div>

          <div className="pt-4">
            <Button 
              onClick={() => refresh()} 
              disabled={isRefreshing}
              className="w-full sm:w-auto"
            >
              {isRefreshing ? 'Refreshing...' : 'Force Refresh Session'}
            </Button>
            <p className="mt-2 text-sm text-muted-foreground">
              Sessions automatically refresh in the background. Use this button to test manual refresh.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}