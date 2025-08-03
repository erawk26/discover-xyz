import { SignInForm } from '@/components/auth/SignInForm'
import Link from 'next/link'
import { Suspense } from 'react'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto h-full w-full max-w-md self-center px-4 sm:px-0">
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="text-muted-foreground">Choose how you&apos;d like to continue</p>
        </div>
        <div className="bg-card p-8 rounded-lg shadow-lg border">
          <Suspense fallback={null}>
            <SignInForm />
          </Suspense>
          <p className="mt-4 text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}