'use client'

import React from 'react'
import { OAuthButtons } from '../auth/oauth-buttons'

const BeforeLogin: React.FC = () => {
  // Get OAuth providers from environment (passed from server)
  const providers = [
    {
      id: 'google',
      name: 'Google',
      icon: 'google',
      demo: false,
    }
  ]

  return (
    <div className="space-y-4">
      <div>
        <p>
          <b>Welcome to your dashboard!</b>
          {' This is where site admins will log in to manage your website.'}
        </p>
      </div>
      
      {/* OAuth login options */}
      <div className="space-y-3">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        
        <OAuthButtons providers={providers} redirectTo="/admin" />
      </div>
    </div>
  )
}

export default BeforeLogin