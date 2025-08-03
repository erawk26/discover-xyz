'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from '@/lib/better-auth/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const maxRetries = 3
  const hasChecked = useRef(false)

  // Use the session hook properly
  const session = useSession()

  useEffect(() => {
    // Skip if we've already checked or session is still loading
    if (hasChecked.current || session.isPending) return

    // If we have a session, redirect immediately
    if (session.data) {
      hasChecked.current = true
      const redirectTo = searchParams.get('redirectTo') || '/admin'
      router.push(redirectTo)
      return
    }

    // If error occurred, handle it
    if (session.error) {
      console.error('Session error:', session.error)
      if (retryCount >= maxRetries) {
        hasChecked.current = true
        router.push('/sign-in?error=callback_failed')
        return
      }
    }

    // No session yet and haven't exceeded retries
    if (!session.data && retryCount < maxRetries) {
      setIsRetrying(true)
      const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 5000)

      setTimeout(() => {
        setRetryCount((prev) => prev + 1)
        setIsRetrying(false)
        // Force re-check by calling refetch if available
        if (session.refetch) {
          session.refetch()
        }
      }, backoffDelay)
    } else if (retryCount >= maxRetries) {
      // Max retries reached
      hasChecked.current = true
      router.push('/sign-in?error=oauth_failed&retry=true')
    }
  }, [session, router, searchParams, retryCount])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Authenticating...</h2>
        <p className="text-gray-600">
          {isRetrying
            ? `Retrying authentication (attempt ${retryCount + 1} of ${maxRetries + 1})...`
            : 'Please wait while we complete your sign-in.'}
        </p>
        {retryCount > 0 && (
          <p className="text-sm text-gray-500 mt-2">
            This sometimes takes a few attempts on first login.
          </p>
        )}
      </div>
    </div>
  )
}
