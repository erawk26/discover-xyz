'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/better-auth/client'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    async function handleCallback() {
      try {
        // Check if we have a session
        const session = await authClient.useSession()
        
        if (session.data) {
          // We have a session, redirect to admin
          router.push('/admin')
        } else {
          // No session, redirect to sign-in
          router.push('/sign-in?error=no_session')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        router.push('/sign-in?error=callback_failed')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Authenticating...</h2>
        <p className="text-gray-600">Please wait while we complete your sign-in.</p>
      </div>
    </div>
  )
}