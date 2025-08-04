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
    signIn: {
      social: vi.fn(),
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
    
    // Clear DOM between tests
    document.body.innerHTML = ''
  })

  it('should render sign up form with all elements', () => {
    render(<SignUpForm />)

    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    const submitButtons = screen.getAllByRole('button', { name: /sign up/i })
    expect(submitButtons.length).toBeGreaterThan(0)
    expect(screen.getByText('Sign up with Google')).toBeInTheDocument()
    expect(screen.getByText('Sign up with GitHub')).toBeInTheDocument()
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

    // Submit
    const submitButtons = screen.getAllByRole('button', { name: /sign up/i })
    const submitButton = submitButtons.find(btn => btn.getAttribute('type') === 'submit')
    await user.click(submitButton!)

    await waitFor(() => {
      expect(authClient.signUp.email).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
        callbackURL: '/admin'
      })
    })
  })

  it('should handle sign up errors', async () => {
    const user = userEvent.setup()
    
    vi.mocked(authClient.signUp.email).mockRejectedValueOnce(
      new Error('Email already exists')
    )

    render(<SignUpForm />)

    await user.type(screen.getByLabelText('Name'), 'Test User')
    await user.type(screen.getByLabelText('Email'), 'existing@example.com')
    await user.type(screen.getByLabelText('Password'), 'SecurePass123!')

    const submitButtons = screen.getAllByRole('button', { name: /sign up/i })
    const submitButton = submitButtons.find(btn => btn.getAttribute('type') === 'submit')
    await user.click(submitButton!)

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

    const submitButtons = screen.getAllByRole('button', { name: /sign up/i })
    const submitButton = submitButtons.find(btn => btn.getAttribute('type') === 'submit')!
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
      expect(submitButton.disabled).toBe(false)
      expect(screen.getByText('Sign Up')).toBeInTheDocument()
    })
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()
    
    render(<SignUpForm />)

    // Try to submit empty form
    const submitButtons = screen.getAllByRole('button', { name: /sign up/i })
    const submitButton = submitButtons.find(btn => btn.getAttribute('type') === 'submit')
    await user.click(submitButton!)

    // Check that HTML5 validation prevents submission
    expect(authClient.signUp.email).not.toHaveBeenCalled()
  })

  it('should validate email format', async () => {
    const user = userEvent.setup()
    
    render(<SignUpForm />)

    await user.type(screen.getByLabelText('Name'), 'Test User')
    await user.type(screen.getByLabelText('Email'), 'invalid-email')
    await user.type(screen.getByLabelText('Password'), 'SecurePass123!')

    // The email input should have validation error due to type="email"
    const emailInput = screen.getByLabelText('Email') as HTMLInputElement
    expect(emailInput.validity.valid).toBe(false)
  })

  it('should enforce minimum password length', async () => {
    const user = userEvent.setup()
    
    render(<SignUpForm />)

    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement
    await user.type(passwordInput, 'short')

    // Check that the input has the minimum length attribute
    expect(passwordInput.minLength).toBe(8)
    expect(passwordInput.value).toBe('short')
    expect(passwordInput.value.length).toBeLessThan(8)
  })
})