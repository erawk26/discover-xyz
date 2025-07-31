'use client'

import React from 'react'
import { Button } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { toast } from '@payloadcms/ui'

export const LogoutButton: React.FC = () => {
  const router = useRouter()
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
        router.push('/admin/login')
        router.refresh()
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