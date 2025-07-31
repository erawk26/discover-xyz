import { redirect } from 'next/navigation'
import { getBetterAuthSession } from '@/lib/better-auth/payload-sync'

export default async function DashboardPage() {
  const session = await getBetterAuthSession()

  if (!session) {
    redirect('/sign-in')
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm text-muted-foreground">Email</dt>
              <dd className="font-medium">{session.user.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Name</dt>
              <dd className="font-medium">{session.user.name || 'Not set'}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Role</dt>
              <dd className="font-medium">{session.user.role || 'authenticated'}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Email Verified</dt>
              <dd className="font-medium">{session.user.emailVerified ? 'Yes' : 'No'}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Session Details</h2>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm text-muted-foreground">Session ID</dt>
              <dd className="font-mono text-xs">{session.session.id}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Expires At</dt>
              <dd className="font-medium">
                {new Date(session.session.expiresAt).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Available Features</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>✅ OAuth Login (Google, GitHub)</li>
          <li>✅ Magic Links</li>
          <li>✅ Two-Factor Authentication</li>
          <li>✅ Passkeys</li>
          <li>✅ Phone Number Login</li>
          <li>✅ Email OTP</li>
          <li>✅ Account Linking</li>
          <li>✅ Multi-Session Support</li>
          <li>✅ Organizations & Teams</li>
        </ul>
      </div>
    </div>
  )
}