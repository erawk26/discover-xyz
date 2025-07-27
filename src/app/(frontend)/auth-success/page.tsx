import { redirect } from 'next/navigation'
import { getBetterAuthSession, syncBetterAuthToPayload } from '@/lib/better-auth/payload-sync'

export default async function AuthSuccessPage() {
  // Get Better Auth session
  const session = await getBetterAuthSession()
  
  if (!session?.user) {
    redirect('/sign-in')
  }

  try {
    // Sync with Payload
    await syncBetterAuthToPayload(session.user)
  } catch (error) {
    console.error('Failed to sync user with Payload:', error)
    // Continue anyway - the user exists in Better Auth
  }

  // Redirect to admin - the beforeOperation hook will handle authentication
  redirect('/admin')
}