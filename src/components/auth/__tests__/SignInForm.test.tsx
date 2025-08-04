import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignInForm } from '../SignInForm'
import { authClient } from '@/lib/better-auth/client'
import { toast } from 'sonner'

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
  }),
}))

vi.mock('@/lib/better-auth/client', () => ({
  authClient: {
    signIn: {
      email: vi.fn(),
      social: vi.fn(),
      magicLink: vi.fn(),
      emailOTP: vi.fn(),
    },
    emailOTP: {
      sendVerificationOtp: vi.fn(),
    },
  },
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

// Mock global fetch for theme detection
global.fetch = vi.fn()

describe('SignInForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful theme fetch
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ theme: 'light' }),
    } as Response)
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn().mockReturnValue(null),
        setItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    })
  })

  it('should render sign in form with all elements', () => {
    render(<SignInForm />)

    // Check for OAuth buttons
    expect(screen.getByText('Continue with Google')).toBeInTheDocument()
    expect(screen.getByText('Continue with GitHub')).toBeInTheDocument()

    // Check for form inputs
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()

    // Check for action buttons
    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByText('Send Magic Link')).toBeInTheDocument()

    // Check for tabs
    expect(screen.getByText('Password')).toBeInTheDocument()
    expect(screen.getByText('Email Code')).toBeInTheDocument()
  })

  it('should handle email/password sign in', async () => {
    const user = userEvent.setup()
    const mockPush = vi.fn()
    
    vi.mocked(authClient.signIn.email).mockResolvedValueOnce({
      data: {
        user: { id: '1', email: 'test@example.com' },
        session: { id: 'session-1' },
      },
    })

    render(<SignInForm />)

    // Fill in credentials
    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')

    // Submit form
    await user.click(screen.getByText('Sign In'))

    await waitFor(() => {
      expect(authClient.signIn.email).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        callbackURL: '/admin',
      })
    })
  })

  it('should handle sign in errors', async () => {
    const user = userEvent.setup()
    
    vi.mocked(authClient.signIn.email).mockRejectedValueOnce(
      new Error('Invalid credentials')
    )

    render(<SignInForm />)

    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrong')
    await user.click(screen.getByText('Sign In'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials')
    })
  })

  it('should handle Google OAuth sign in', async () => {
    const user = userEvent.setup()
    
    vi.mocked(authClient.signIn.social).mockResolvedValueOnce({
      data: { url: 'https://accounts.google.com/oauth' },
    })

    render(<SignInForm />)

    await user.click(screen.getByText('Continue with Google'))

    await waitFor(() => {
      expect(authClient.signIn.social).toHaveBeenCalledWith({
        provider: 'google',
        callbackURL: '/auth-callback?redirectTo=%2Fadmin',
      })
    })
  })

  it('should handle GitHub OAuth sign in', async () => {
    const user = userEvent.setup()
    
    vi.mocked(authClient.signIn.social).mockResolvedValueOnce({
      data: { url: 'https://github.com/login/oauth' },
    })

    render(<SignInForm />)

    await user.click(screen.getByText('Continue with GitHub'))

    await waitFor(() => {
      expect(authClient.signIn.social).toHaveBeenCalledWith({
        provider: 'github',
        callbackURL: '/auth-callback?redirectTo=%2Fadmin',
      })
    })
  })

  it('should send magic link', async () => {
    const user = userEvent.setup()
    
    vi.mocked(authClient.signIn.magicLink).mockResolvedValueOnce({
      data: { success: true },
    })

    render(<SignInForm />)

    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.click(screen.getByText('Send Magic Link'))

    await waitFor(() => {
      expect(authClient.signIn.magicLink).toHaveBeenCalledWith({
        email: 'test@example.com',
        callbackURL: '/admin',
      })
      expect(toast.success).toHaveBeenCalledWith('Magic link sent! Check your email.')
    })
  })

  it('should handle magic link without email', async () => {
    const user = userEvent.setup()
    
    render(<SignInForm />)

    await user.click(screen.getByText('Send Magic Link'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please enter your email first')
      expect(authClient.signIn.magicLink).not.toHaveBeenCalled()
    })
  })

  it('should switch to OTP mode', async () => {
    const user = userEvent.setup()
    
    render(<SignInForm />)

    // Click on Email Code tab
    await user.click(screen.getByText('Email Code'))

    // Password field should be hidden
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()
    
    // Send Code button should be visible
    expect(screen.getByText('Send Code')).toBeInTheDocument()
  })

  it('should send OTP code', async () => {
    const user = userEvent.setup()
    
    vi.mocked(authClient.emailOTP.sendVerificationOtp).mockResolvedValueOnce({
      data: { success: true },
    })

    render(<SignInForm />)

    // Switch to OTP mode
    await user.click(screen.getByText('Email Code'))
    
    // Enter email
    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    
    // Send OTP
    await user.click(screen.getByText('Send Code'))

    await waitFor(() => {
      expect(authClient.emailOTP.sendVerificationOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        type: 'sign-in',
      })
      expect(toast.success).toHaveBeenCalledWith('Verification code sent! Check your email.')
    })
  })

  it('should verify OTP code', async () => {
    const user = userEvent.setup()
    
    // First send OTP
    vi.mocked(authClient.emailOTP.sendVerificationOtp).mockResolvedValueOnce({
      data: { success: true },
    })

    // Then verify OTP
    vi.mocked(authClient.signIn.emailOTP).mockResolvedValueOnce({
      data: {
        user: { id: '1', email: 'test@example.com' },
        session: { id: 'session-1' },
      },
    })

    render(<SignInForm />)

    // Switch to OTP mode
    await user.click(screen.getByText('Email Code'))
    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.click(screen.getByText('Send Code'))

    // Wait for OTP input to appear
    await waitFor(() => {
      expect(screen.getByLabelText('Verification Code')).toBeInTheDocument()
    })

    // Enter OTP
    await user.type(screen.getByLabelText('Verification Code'), '123456')
    await user.click(screen.getByText('Verify & Sign In'))

    await waitFor(() => {
      expect(authClient.signIn.emailOTP).toHaveBeenCalledWith({
        email: 'test@example.com',
        otp: '123456',
      })
    })
  })

  it('should apply theme on mount', async () => {
    // Mock localStorage and fetch
    const mockGetItem = vi.fn().mockReturnValue('dark')
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ theme: 'dark' }),
    })

    Object.defineProperty(window, 'localStorage', {
      value: { getItem: mockGetItem },
      writable: true,
    })
    global.fetch = mockFetch

    render(<SignInForm />)

    await waitFor(() => {
      expect(mockGetItem).toHaveBeenCalledWith('payload-theme')
      expect(mockFetch).toHaveBeenCalledWith('/api/theme', {
        headers: {
          'x-theme-preference': 'dark',
        },
      })
    })
  })
})