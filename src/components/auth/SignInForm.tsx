'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/better-auth/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [isOtpMode, setIsOtpMode] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  
  // Get redirect URL from query params
  const redirectTo = searchParams.get('redirectTo') || '/admin'

  useEffect(() => {
    // Detect and apply theme preference
    const detectTheme = async () => {
      try {
        // First check localStorage
        const localTheme = localStorage.getItem('payload-theme')
        
        // Fetch theme from API (which checks cookies)
        const response = await fetch('/api/theme', {
          headers: {
            'x-theme-preference': localTheme || 'light'
          }
        })
        
        if (response.ok) {
          const { theme } = await response.json()
          document.documentElement.setAttribute('data-theme', theme)
          
          // Also set class for Tailwind dark mode
          if (theme === 'dark') {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }
      } catch (error) {
        console.error('Failed to detect theme:', error)
        // Default to light theme on error
        document.documentElement.setAttribute('data-theme', 'light')
      }
    }

    detectTheme()

    // Show error messages from OAuth callback
    const error = searchParams.get('error')
    const retry = searchParams.get('retry')
    
    if (error === 'oauth_failed' && retry === 'true') {
      toast.error('OAuth sign-in failed after multiple attempts. Please try again or use a different method.')
    } else if (error === 'callback_failed') {
      toast.error('Authentication failed. Please try again.')
    } else if (error === 'no_session') {
      toast.error('Session could not be established. Please try again.')
    }
  }, [searchParams])

  const handleEmailPasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await authClient.signIn.email({
        email,
        password,
        callbackURL: redirectTo
      })
      router.push(redirectTo)
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: `/auth-callback?redirectTo=${encodeURIComponent(redirectTo)}`
      })
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in with Google')
      setLoading(false)
    }
  }

  const handleGithubSignIn = async () => {
    setLoading(true)
    try {
      await authClient.signIn.social({
        provider: 'github',
        callbackURL: `/auth-callback?redirectTo=${encodeURIComponent(redirectTo)}`
      })
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in with GitHub')
      setLoading(false)
    }
  }

  const handleMagicLink = async () => {
    if (!email) {
      toast.error('Please enter your email first')
      return
    }
    
    setLoading(true)
    try {
      await authClient.signIn.magicLink({
        email,
        callbackURL: redirectTo
      })
      toast.success('Magic link sent! Check your email.')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send magic link')
    } finally {
      setLoading(false)
    }
  }

  const handleSendOtp = async () => {
    if (!email) {
      toast.error('Please enter your email first')
      return
    }

    setLoading(true)
    try {
      await authClient.emailOTP.sendVerificationOtp({
        email,
        type: 'sign-in'
      })
      setOtpSent(true)
      toast.success('Verification code sent! Check your email.')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send verification code')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !otpCode) {
      toast.error('Please enter your email and verification code')
      return
    }

    setLoading(true)
    try {
      await authClient.signIn.emailOTP({
        email,
        otp: otpCode
      })
      router.push(redirectTo)
    } catch (error: any) {
      toast.error(error.message || 'Invalid verification code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      {/* OAuth Buttons */}
      <div className="space-y-3">
        <Button
          onClick={handleGoogleSignIn}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>

        <Button
          onClick={handleGithubSignIn}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
              clipRule="evenodd"
            />
          </svg>
          Continue with GitHub
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      {/* Sign-in method tabs */}
      <div className="flex border-b">
        <button
          type="button"
          onClick={() => { setIsOtpMode(false); setOtpSent(false); }}
          className={`flex-1 py-2 px-4 text-sm font-medium ${
            !isOtpMode
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => { setIsOtpMode(true); setPassword(''); }}
          className={`flex-1 py-2 px-4 text-sm font-medium ${
            isOtpMode
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Email Code
        </button>
      </div>

      {/* Email/Password/OTP Form */}
      <form onSubmit={isOtpMode ? handleOtpSignIn : handleEmailPasswordSignIn} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isOtpMode && otpSent}
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {!isOtpMode ? (
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        ) : (
          otpSent && (
            <div>
              <label htmlFor="otp" className="block text-sm font-medium">
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Enter 6-digit code"
                required
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="mt-1 text-sm text-muted-foreground">Check your email for the verification code</p>
            </div>
          )
        )}

        <div className="flex items-center justify-between gap-2">
          {!isOtpMode ? (
            <>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                Sign In
              </Button>
              <Button
                type="button"
                onClick={handleMagicLink}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                Send Magic Link
              </Button>
            </>
          ) : (
            <>  
              {!otpSent ? (
                <Button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading || !email}
                  className="w-full"
                >
                  Send Code
                </Button>
              ) : (
                <>
                  <Button
                    type="submit"
                    disabled={loading || !otpCode}
                    className="flex-1"
                  >
                    Verify & Sign In
                  </Button>
                  <Button
                    type="button"
                    onClick={() => { handleSendOtp(); setOtpCode(''); }}
                    disabled={loading}
                    variant="link"
                    className="text-sm"
                  >
                    Resend
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </form>
    </div>
  )
}