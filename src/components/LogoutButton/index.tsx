'use client'

import React from 'react'
import { Button } from '@payloadcms/ui'
import { toast } from '@payloadcms/ui'

export const LogoutButton: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        toast.success('Logged out successfully')
        // Clear any client-side auth state
        window.localStorage.clear()
        window.sessionStorage.clear()
        // Redirect to unified login page
        window.location.href = '/sign-in?redirectTo=/admin'
      } else {
        toast.error('Logout failed')
      }
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Logout failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleLogout}
      disabled={isLoading}
      size="small"
      buttonStyle="secondary"
    >
      {isLoading ? 'Logging out...' : 'Logout'}
    </Button>
  )
}

export default LogoutButton