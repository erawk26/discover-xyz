import { SignUpForm } from '@/components/auth/SignUpForm'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="mx-auto h-full w-full max-w-md self-center px-4 sm:px-0">
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-2xl font-bold tracking-tight">Create an account</h1>
          <p className="text-muted-foreground">Get started with your new account</p>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <SignUpForm />
          <p className="mt-4 text-sm text-center text-gray-600">
            Already have an account?{' '}
            <a href="/sign-in" className="text-blue-600 hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}