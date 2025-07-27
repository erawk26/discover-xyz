'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OAuthRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // After OAuth, Better Auth has created a session
    // We need to tell Payload to check for it
    router.push('/admin')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Completing sign in...</h2>
        <p className="text-gray-600">Please wait while we redirect you.</p>
      </div>
    </div>
  )
}