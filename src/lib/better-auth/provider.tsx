'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthUIProvider } from '@daveyplate/better-auth-ui'
import { ReactNode, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from './client'
import { sessionRefreshManager } from './session-refresh'

export function BetterAuthProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      },
    },
  }))
  
  const router = useRouter()
  
  // Start session refresh manager when provider mounts
  useEffect(() => {
    sessionRefreshManager.start()
    
    return () => {
      sessionRefreshManager.stop()
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <AuthUIProvider
        authClient={authClient}
        basePath="/"
        navigate={(path: string) => router.push(path)}
        viewPaths={{
          settings: '/dashboard',
        }}
      >
        {children}
      </AuthUIProvider>
    </QueryClientProvider>
  )
}