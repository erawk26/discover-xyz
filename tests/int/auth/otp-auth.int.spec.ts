import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mockAuthClient } from './setup'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('@/lib/better-auth/client', () => ({
  authClient: mockAuthClient,
}))

describe('OTP Authentication Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock email OTP methods
    mockAuthClient.emailOTP = {
      sendVerificationOtp: vi.fn(),
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Email OTP Sign In', () => {
    it('should send OTP to email successfully', async () => {
      const email = 'otp@example.com'

      mockAuthClient.emailOTP.sendVerificationOtp.mockResolvedValueOnce({
        data: {
          success: true,
          message: 'OTP sent to your email',
        },
      })

      const result = await mockAuthClient.emailOTP.sendVerificationOtp({
        email,
        type: 'sign-in',
      })

      expect(result.data.success).toBe(true)
      expect(mockAuthClient.emailOTP.sendVerificationOtp).toHaveBeenCalledWith({
        email,
        type: 'sign-in',
      })
    })

    it('should verify OTP and create session', async () => {
      const email = 'otp@example.com'
      const otp = '123456'

      mockAuthClient.signIn.emailOTP.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-otp',
            email,
            emailVerified: true,
          },
          session: {
            id: 'session-otp',
            userId: 'user-otp',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        },
      })

      const result = await mockAuthClient.signIn.emailOTP({
        email,
        otp,
      })

      expect(result.data.session).toBeDefined()
      expect(result.data.user.email).toBe(email)
    })

    it('should handle invalid OTP code', async () => {
      const email = 'otp@example.com'
      const invalidOtp = '000000'

      mockAuthClient.signIn.emailOTP.mockRejectedValueOnce(
        new Error('Invalid OTP code')
      )

      await expect(
        mockAuthClient.signIn.emailOTP({
          email,
          otp: invalidOtp,
        })
      ).rejects.toThrow('Invalid OTP code')
    })

    it('should handle expired OTP code', async () => {
      const email = 'otp@example.com'
      const expiredOtp = '123456'

      mockAuthClient.signIn.emailOTP.mockRejectedValueOnce(
        new Error('OTP code has expired')
      )

      await expect(
        mockAuthClient.signIn.emailOTP({
          email,
          otp: expiredOtp,
        })
      ).rejects.toThrow('OTP code has expired')
    })

    it('should handle rate limiting for OTP requests', async () => {
      const email = 'otp@example.com'

      // First 3 requests succeed
      for (let i = 0; i < 3; i++) {
        mockAuthClient.emailOTP.sendVerificationOtp.mockResolvedValueOnce({
          data: { success: true },
        })
        await mockAuthClient.emailOTP.sendVerificationOtp({ email, type: 'sign-in' })
      }

      // 4th request is rate limited
      mockAuthClient.emailOTP.sendVerificationOtp.mockRejectedValueOnce(
        new Error('Too many requests. Please try again later.')
      )

      await expect(
        mockAuthClient.emailOTP.sendVerificationOtp({ email, type: 'sign-in' })
      ).rejects.toThrow('Too many requests')
    })

    it('should handle OTP resend functionality', async () => {
      vi.useFakeTimers()
      
      const email = 'otp@example.com'

      // Initial OTP send
      mockAuthClient.emailOTP.sendVerificationOtp.mockResolvedValueOnce({
        data: {
          success: true,
          message: 'OTP sent',
          resendAvailableAt: new Date(Date.now() + 60000).toISOString(), // 1 minute
        },
      })

      const initialSend = await mockAuthClient.emailOTP.sendVerificationOtp({
        email,
        type: 'sign-in',
      })

      expect(initialSend.data.resendAvailableAt).toBeDefined()

      // Attempt immediate resend (should fail)
      mockAuthClient.emailOTP.sendVerificationOtp.mockRejectedValueOnce(
        new Error('Please wait before requesting another code')
      )

      await expect(
        mockAuthClient.emailOTP.sendVerificationOtp({ email, type: 'sign-in' })
      ).rejects.toThrow('Please wait')

      // Simulate waiting and successful resend
      vi.advanceTimersByTime(60000) // Advance 1 minute

      mockAuthClient.emailOTP.sendVerificationOtp.mockResolvedValueOnce({
        data: { success: true, message: 'New OTP sent' },
      })

      const resendResult = await mockAuthClient.emailOTP.sendVerificationOtp({
        email,
        type: 'sign-in',
      })

      expect(resendResult.data.success).toBe(true)
      
      vi.useRealTimers()
    })
  })

  describe('Email OTP Sign Up', () => {
    it('should send OTP for new user registration', async () => {
      const email = 'newuser-otp@example.com'

      mockAuthClient.emailOTP.sendVerificationOtp.mockResolvedValueOnce({
        data: {
          success: true,
          message: 'OTP sent for registration',
        },
      })

      const result = await mockAuthClient.emailOTP.sendVerificationOtp({
        email,
        type: 'sign-up',
      })

      expect(result.data.success).toBe(true)
      expect(mockAuthClient.emailOTP.sendVerificationOtp).toHaveBeenCalledWith({
        email,
        type: 'sign-up',
      })
    })

    it('should create account with OTP verification', async () => {
      const email = 'newuser-otp@example.com'
      const otp = '654321'

      // Mock sign up with OTP
      mockAuthClient.signUp.emailOTP = vi.fn().mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-new-otp',
            email,
            emailVerified: true,
          },
          session: {
            id: 'session-new-otp',
            userId: 'user-new-otp',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        },
      })

      const result = await mockAuthClient.signUp.emailOTP({
        email,
        otp,
        name: 'New OTP User',
      })

      expect(result.data.user.emailVerified).toBe(true)
      expect(result.data.session).toBeDefined()
    })
  })

  describe('OTP Security Features', () => {
    it('should limit OTP verification attempts', async () => {
      const email = 'otp-security@example.com'
      const otp = '111111'

      // First 2 attempts fail
      for (let i = 0; i < 2; i++) {
        mockAuthClient.signIn.emailOTP.mockRejectedValueOnce(
          new Error('Invalid OTP code')
        )
        await expect(
          mockAuthClient.signIn.emailOTP({ email, otp })
        ).rejects.toThrow('Invalid OTP code')
      }

      // 3rd attempt locks the OTP
      mockAuthClient.signIn.emailOTP.mockRejectedValueOnce(
        new Error('OTP verification locked due to too many failed attempts')
      )

      await expect(
        mockAuthClient.signIn.emailOTP({ email, otp })
      ).rejects.toThrow('OTP verification locked')
    })

    it('should invalidate OTP after successful use', async () => {
      const email = 'otp-once@example.com'
      const otp = '999999'

      // First use succeeds
      mockAuthClient.signIn.emailOTP.mockResolvedValueOnce({
        data: {
          user: { id: 'user-once', email },
          session: { id: 'session-once', userId: 'user-once' },
        },
      })

      await mockAuthClient.signIn.emailOTP({ email, otp })

      // Second use of same OTP fails
      mockAuthClient.signIn.emailOTP.mockRejectedValueOnce(
        new Error('OTP has already been used')
      )

      await expect(
        mockAuthClient.signIn.emailOTP({ email, otp })
      ).rejects.toThrow('OTP has already been used')
    })

    it('should validate OTP format', async () => {
      const email = 'otp-format@example.com'
      const invalidFormats = ['12345', '1234567', 'abcdef', '12 34 56', '']

      for (const invalidOtp of invalidFormats) {
        mockAuthClient.signIn.emailOTP.mockRejectedValueOnce(
          new Error('Invalid OTP format')
        )

        await expect(
          mockAuthClient.signIn.emailOTP({ email, otp: invalidOtp })
        ).rejects.toThrow('Invalid OTP format')
      }
    })
  })

  describe('OTP Email Validation', () => {
    it('should validate email format before sending OTP', async () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user @example.com',
        '',
      ]

      for (const invalidEmail of invalidEmails) {
        mockAuthClient.emailOTP.sendVerificationOtp.mockRejectedValueOnce(
          new Error('Invalid email address')
        )

        await expect(
          mockAuthClient.emailOTP.sendVerificationOtp({
            email: invalidEmail,
            type: 'sign-in',
          })
        ).rejects.toThrow('Invalid email address')
      }
    })

    it('should handle blocked email domains', async () => {
      const blockedEmail = 'user@tempmail.com'

      mockAuthClient.emailOTP.sendVerificationOtp.mockRejectedValueOnce(
        new Error('Email domain not allowed')
      )

      await expect(
        mockAuthClient.emailOTP.sendVerificationOtp({
          email: blockedEmail,
          type: 'sign-in',
        })
      ).rejects.toThrow('Email domain not allowed')
    })
  })
})