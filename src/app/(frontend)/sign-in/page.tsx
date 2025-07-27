import { SignInForm } from '@/components/auth/SignInForm'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="mx-auto h-full w-full max-w-md self-center px-4 sm:px-0">
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground">Choose how you&apos;d like to continue</p>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <SignInForm />
          <p className="mt-4 text-sm text-center text-gray-600">
            Don&apos;t have an account?{' '}
            <a href="/sign-up" className="text-blue-600 hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}