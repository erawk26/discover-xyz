'use client'

import { useSession, signOut } from '@/lib/better-auth/client'
import Link from 'next/link'

export function AuthStatus() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return <div className="text-sm text-muted-foreground">Loading...</div>
  }

  if (!session) {
    return (
      <div className="flex items-center gap-4">
        <Link 
          href="/sign-in" 
          className="text-sm font-medium hover:underline"
        >
          Sign In
        </Link>
        <Link 
          href="/sign-up" 
          className="text-sm font-medium hover:underline"
        >
          Sign Up
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-muted-foreground">
        {session.user.email}
      </span>
      {session.user.role && (
        <span className="text-xs bg-muted px-2 py-1 rounded">
          {session.user.role}
        </span>
      )}
      <button
        onClick={() => signOut()}
        className="text-sm font-medium hover:underline"
      >
        Sign Out
      </button>
    </div>
  )
}