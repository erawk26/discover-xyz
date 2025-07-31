'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthUIProvider } from '@daveyplate/better-auth-ui'
import { ReactNode, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from './client'

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

  return (
    <QueryClientProvider client={queryClient}>
      <AuthUIProvider
        authClient={authClient}
        basePath="/"
        navigation={{
          router: {
            push: router.push,
            replace: router.replace,
          },
        }}
        viewPaths={{
          settings: '/dashboard',
        }}
      >
        {children}
      </AuthUIProvider>
    </QueryClientProvider>
  )
}