'use client'

import React from 'react'
import Link from 'next/link'

const BeforeLogin: React.FC = () => {
  return (
    <div className="space-y-4">
      <div>
        <p>
          <b>Welcome to your dashboard!</b>
          {' This is where site admins will log in to manage your website.'}
        </p>
      </div>
      
      <div className="space-y-3">
        <Link 
          href="/sign-in" 
          className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Sign in with Better Auth
        </Link>
        <p className="text-center text-xs text-muted-foreground">
          Supports Google, Magic Links, 2FA, and more!
        </p>
      </div>
    </div>
  )
}

export default BeforeLogin