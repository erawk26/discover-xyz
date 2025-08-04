import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignUpForm } from '../SignUpForm'
import { authClient } from '@/lib/better-auth/client'
import { toast } from 'sonner'

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('@/lib/better-auth/client', () => ({
  authClient: {
    signUp: {
      email: vi.fn(),
    },
  },
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

describe('SignUpForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render sign up form with all elements', () => {
    render(<SignUpForm />)

    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    expect(screen.getByText('Create Account')).toBeInTheDocument()
  })

  it('should handle successful sign up', async () => {
    const user = userEvent.setup()
    
    vi.mocked(authClient.signUp.email).mockResolvedValueOnce({
      data: {
        user: {
          id: '1',
          email: 'new@example.com',
          name: 'Test User',
          emailVerified: false,
        },
      },
    })

    render(<SignUpForm />)

    // Fill in form
    await user.type(screen.getByLabelText('Name'), 'Test User')
    await user.type(screen.getByLabelText('Email'), 'new@example.com')
    await user.type(screen.getByLabelText('Password'), 'SecurePass123!')
    await user.type(screen.getByLabelText('Confirm Password'), 'SecurePass123!')

    // Submit
    await user.click(screen.getByText('Create Account'))

    await waitFor(() => {
      expect(authClient.signUp.email).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      })
      expect(toast.success).toHaveBeenCalledWith(
        'Account created! Please check your email to verify your account.'
      )
    })
  })

  it('should validate password match', async () => {
    const user = userEvent.setup()
    
    render(<SignUpForm />)

    await user.type(screen.getByLabelText('Name'), 'Test User')
    await user.type(screen.getByLabelText('Email'), 'new@example.com')
    await user.type(screen.getByLabelText('Password'), 'SecurePass123!')
    await user.type(screen.getByLabelText('Confirm Password'), 'DifferentPass123!')

    await user.click(screen.getByText('Create Account'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Passwords do not match')
      expect(authClient.signUp.email).not.toHaveBeenCalled()
    })
  })

  it('should validate password strength', async () => {
    const user = userEvent.setup()
    
    render(<SignUpForm />)

    await user.type(screen.getByLabelText('Name'), 'Test User')
    await user.type(screen.getByLabelText('Email'), 'new@example.com')
    await user.type(screen.getByLabelText('Password'), 'weak')
    await user.type(screen.getByLabelText('Confirm Password'), 'weak')

    await user.click(screen.getByText('Create Account'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Password must be at least 8 characters long'
      )
      expect(authClient.signUp.email).not.toHaveBeenCalled()
    })
  })

  it('should handle duplicate email error', async () => {
    const user = userEvent.setup()
    
    vi.mocked(authClient.signUp.email).mockRejectedValueOnce(
      new Error('Email already exists')
    )

    render(<SignUpForm />)

    await user.type(screen.getByLabelText('Name'), 'Test User')
    await user.type(screen.getByLabelText('Email'), 'existing@example.com')
    await user.type(screen.getByLabelText('Password'), 'SecurePass123!')
    await user.type(screen.getByLabelText('Confirm Password'), 'SecurePass123!')

    await user.click(screen.getByText('Create Account'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Email already exists')
    })
  })

  it('should disable form while submitting', async () => {
    const user = userEvent.setup()
    
    // Create a promise that we can control
    let resolveSignUp: any
    const signUpPromise = new Promise((resolve) => {
      resolveSignUp = resolve
    })
    
    vi.mocked(authClient.signUp.email).mockReturnValueOnce(signUpPromise as any)

    render(<SignUpForm />)

    await user.type(screen.getByLabelText('Name'), 'Test User')
    await user.type(screen.getByLabelText('Email'), 'new@example.com')
    await user.type(screen.getByLabelText('Password'), 'SecurePass123!')
    await user.type(screen.getByLabelText('Confirm Password'), 'SecurePass123!')

    const submitButton = screen.getByText('Create Account')
    await user.click(submitButton)

    // Button should be disabled while loading
    expect(submitButton).toBeDisabled()
    expect(screen.getByText('Creating account...')).toBeInTheDocument()

    // Resolve the promise
    resolveSignUp({
      data: {
        user: { id: '1', email: 'new@example.com' },
      },
    })

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
      expect(screen.getByText('Create Account')).toBeInTheDocument()
    })
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()
    
    render(<SignUpForm />)

    // Try to submit empty form
    await user.click(screen.getByText('Create Account'))

    // Check that HTML5 validation prevents submission
    expect(authClient.signUp.email).not.toHaveBeenCalled()
  })

  it('should validate email format', async () => {
    const user = userEvent.setup()
    
    render(<SignUpForm />)

    await user.type(screen.getByLabelText('Name'), 'Test User')
    await user.type(screen.getByLabelText('Email'), 'invalid-email')
    await user.type(screen.getByLabelText('Password'), 'SecurePass123!')
    await user.type(screen.getByLabelText('Confirm Password'), 'SecurePass123!')

    // The email input should have validation error due to type="email"
    const emailInput = screen.getByLabelText('Email') as HTMLInputElement
    expect(emailInput.validity.valid).toBe(false)
  })

  it('should trim whitespace from inputs', async () => {
    const user = userEvent.setup()
    
    vi.mocked(authClient.signUp.email).mockResolvedValueOnce({
      data: {
        user: { id: '1', email: 'trimmed@example.com' },
      },
    })

    render(<SignUpForm />)

    // Enter values with whitespace
    await user.type(screen.getByLabelText('Name'), '  Test User  ')
    await user.type(screen.getByLabelText('Email'), '  trimmed@example.com  ')
    await user.type(screen.getByLabelText('Password'), 'SecurePass123!')
    await user.type(screen.getByLabelText('Confirm Password'), 'SecurePass123!')

    await user.click(screen.getByText('Create Account'))

    await waitFor(() => {
      expect(authClient.signUp.email).toHaveBeenCalledWith({
        email: 'trimmed@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      })
    })
  })

  it('should handle network errors gracefully', async () => {
    const user = userEvent.setup()
    
    vi.mocked(authClient.signUp.email).mockRejectedValueOnce(
      new Error('Network error')
    )

    render(<SignUpForm />)

    await user.type(screen.getByLabelText('Name'), 'Test User')
    await user.type(screen.getByLabelText('Email'), 'new@example.com')
    await user.type(screen.getByLabelText('Password'), 'SecurePass123!')
    await user.type(screen.getByLabelText('Confirm Password'), 'SecurePass123!')

    await user.click(screen.getByText('Create Account'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Network error')
    })
  })
})