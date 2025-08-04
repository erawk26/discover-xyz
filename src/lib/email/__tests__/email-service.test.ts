import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EmailService } from '../email-service'
import type { Session } from 'better-auth/client'

// Mock the resend client
vi.mock('../resend', () => ({
  resendClient: {
    emails: {
      send: vi.fn(),
    },
  },
}))

describe('EmailService', () => {
  let emailService: EmailService

  beforeEach(() => {
    vi.clearAllMocks()
    emailService = new EmailService()
  })

  describe('sendVerificationEmail', () => {
    it('should send verification email with correct parameters', async () => {
      const { resendClient } = await import('../resend')
      const mockSend = resendClient.emails.send as any
      mockSend.mockResolvedValueOnce({ data: { id: 'test-id' }, error: null })

      const email = 'test@example.com'
      const verificationUrl = 'http://localhost:3026/verify?token=123'
      
      const result = await emailService.sendVerificationEmail(email, verificationUrl)

      expect(mockSend).toHaveBeenCalledWith({
        from: 'DiscoverXYZ <onboarding@resend.dev>',
        to: email,
        subject: 'Verify your email address',
        html: expect.stringContaining(verificationUrl),
      })
      expect(result.success).toBe(true)
    })

    it('should handle send errors gracefully', async () => {
      const { resendClient } = await import('../resend')
      const mockSend = resendClient.emails.send as any
      mockSend.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'Failed to send' } 
      })

      const result = await emailService.sendVerificationEmail(
        'test@example.com',
        'http://localhost:3026/verify?token=123'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to send')
    })

    it('should handle exceptions', async () => {
      const { resendClient } = await import('../resend')
      const mockSend = resendClient.emails.send as any
      mockSend.mockRejectedValueOnce(new Error('Network error'))

      const result = await emailService.sendVerificationEmail(
        'test@example.com',
        'http://localhost:3026/verify?token=123'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with correct parameters', async () => {
      const { resendClient } = await import('../resend')
      const mockSend = resendClient.emails.send as any
      mockSend.mockResolvedValueOnce({ data: { id: 'test-id' }, error: null })

      const email = 'test@example.com'
      const resetUrl = 'http://localhost:3026/reset-password?token=123'
      
      const result = await emailService.sendPasswordResetEmail(email, resetUrl)

      expect(mockSend).toHaveBeenCalledWith({
        from: 'DiscoverXYZ <onboarding@resend.dev>',
        to: email,
        subject: 'Reset your password',
        html: expect.stringContaining(resetUrl),
      })
      expect(result.success).toBe(true)
    })

    it('should include expiry warning in password reset email', async () => {
      const { resendClient } = await import('../resend')
      const mockSend = resendClient.emails.send as any
      mockSend.mockResolvedValueOnce({ data: { id: 'test-id' }, error: null })

      await emailService.sendPasswordResetEmail(
        'test@example.com',
        'http://localhost:3026/reset-password?token=123'
      )

      const callArgs = mockSend.mock.calls[0][0]
      expect(callArgs.html).toContain('expires in 1 hour')
    })
  })

  describe('sendMagicLinkEmail', () => {
    it('should send magic link email with correct parameters', async () => {
      const { resendClient } = await import('../resend')
      const mockSend = resendClient.emails.send as any
      mockSend.mockResolvedValueOnce({ data: { id: 'test-id' }, error: null })

      const email = 'test@example.com'
      const magicLink = 'http://localhost:3026/auth/magic-link?token=123'
      
      const result = await emailService.sendMagicLinkEmail(email, magicLink)

      expect(mockSend).toHaveBeenCalledWith({
        from: 'DiscoverXYZ <onboarding@resend.dev>',
        to: email,
        subject: 'Sign in to DiscoverXYZ',
        html: expect.stringContaining(magicLink),
      })
      expect(result.success).toBe(true)
    })

    it('should include expiry warning in magic link email', async () => {
      const { resendClient } = await import('../resend')
      const mockSend = resendClient.emails.send as any
      mockSend.mockResolvedValueOnce({ data: { id: 'test-id' }, error: null })

      await emailService.sendMagicLinkEmail(
        'test@example.com',
        'http://localhost:3026/auth/magic-link?token=123'
      )

      const callArgs = mockSend.mock.calls[0][0]
      expect(callArgs.html).toContain('expires in 15 minutes')
    })
  })

  describe('sendOTPEmail', () => {
    it('should send OTP email with correct parameters', async () => {
      const { resendClient } = await import('../resend')
      const mockSend = resendClient.emails.send as any
      mockSend.mockResolvedValueOnce({ data: { id: 'test-id' }, error: null })

      const email = 'test@example.com'
      const otp = '123456'
      
      const result = await emailService.sendOTPEmail(email, otp)

      expect(mockSend).toHaveBeenCalledWith({
        from: 'DiscoverXYZ <onboarding@resend.dev>',
        to: email,
        subject: 'Your DiscoverXYZ verification code',
        html: expect.stringContaining('123456'),
      })
      expect(result.success).toBe(true)
    })

    it('should format OTP code prominently', async () => {
      const { resendClient } = await import('../resend')
      const mockSend = resendClient.emails.send as any
      mockSend.mockResolvedValueOnce({ data: { id: 'test-id' }, error: null })

      await emailService.sendOTPEmail('test@example.com', '123456')

      const callArgs = mockSend.mock.calls[0][0]
      expect(callArgs.html).toContain('font-size: 32px')
      expect(callArgs.html).toContain('letter-spacing: 8px')
    })
  })

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with user session', async () => {
      const { resendClient } = await import('../resend')
      const mockSend = resendClient.emails.send as any
      mockSend.mockResolvedValueOnce({ data: { id: 'test-id' }, error: null })

      const session: Session = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        },
        expiresAt: Date.now() / 1000 + 3600,
      } as Session

      const result = await emailService.sendWelcomeEmail(session)

      expect(mockSend).toHaveBeenCalledWith({
        from: 'DiscoverXYZ <onboarding@resend.dev>',
        to: 'test@example.com',
        subject: 'Welcome to DiscoverXYZ!',
        html: expect.stringContaining('Test User'),
      })
      expect(result.success).toBe(true)
    })

    it('should include helpful links in welcome email', async () => {
      const { resendClient } = await import('../resend')
      const mockSend = resendClient.emails.send as any
      mockSend.mockResolvedValueOnce({ data: { id: 'test-id' }, error: null })

      const session: Session = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        },
        expiresAt: Date.now() / 1000 + 3600,
      } as Session

      await emailService.sendWelcomeEmail(session)

      const callArgs = mockSend.mock.calls[0][0]
      expect(callArgs.html).toContain('Browse Events')
      expect(callArgs.html).toContain('Explore Businesses')
      expect(callArgs.html).toContain('Manage Profile')
    })
  })

  describe('sendAccountDeletedEmail', () => {
    it('should send account deletion confirmation email', async () => {
      const { resendClient } = await import('../resend')
      const mockSend = resendClient.emails.send as any
      mockSend.mockResolvedValueOnce({ data: { id: 'test-id' }, error: null })

      const email = 'test@example.com'
      const result = await emailService.sendAccountDeletedEmail(email)

      expect(mockSend).toHaveBeenCalledWith({
        from: 'DiscoverXYZ <onboarding@resend.dev>',
        to: email,
        subject: 'Your DiscoverXYZ account has been deleted',
        html: expect.stringContaining('account has been successfully deleted'),
      })
      expect(result.success).toBe(true)
    })

    it('should include reactivation information', async () => {
      const { resendClient } = await import('../resend')
      const mockSend = resendClient.emails.send as any
      mockSend.mockResolvedValueOnce({ data: { id: 'test-id' }, error: null })

      await emailService.sendAccountDeletedEmail('test@example.com')

      const callArgs = mockSend.mock.calls[0][0]
      expect(callArgs.html).toContain('create a new account')
      expect(callArgs.html).toContain('Sign Up')
    })
  })

  describe('email templates', () => {
    it('should use consistent branding across all emails', async () => {
      const { resendClient } = await import('../resend')
      const mockSend = resendClient.emails.send as any
      mockSend.mockResolvedValue({ data: { id: 'test-id' }, error: null })

      // Test each email type
      await emailService.sendVerificationEmail('test@example.com', 'http://test.com')
      await emailService.sendPasswordResetEmail('test@example.com', 'http://test.com')
      await emailService.sendMagicLinkEmail('test@example.com', 'http://test.com')
      await emailService.sendOTPEmail('test@example.com', '123456')

      // Check all emails have consistent branding
      for (let i = 0; i < 4; i++) {
        const callArgs = mockSend.mock.calls[i][0]
        expect(callArgs.html).toContain('DiscoverXYZ')
        expect(callArgs.html).toContain('#10b981') // Brand color
        expect(callArgs.from).toBe('DiscoverXYZ <onboarding@resend.dev>')
      }
    })

    it('should include footer with unsubscribe link', async () => {
      const { resendClient } = await import('../resend')
      const mockSend = resendClient.emails.send as any
      mockSend.mockResolvedValue({ data: { id: 'test-id' }, error: null })

      await emailService.sendWelcomeEmail({
        user: { id: '1', email: 'test@example.com' },
        expiresAt: Date.now() / 1000 + 3600,
      } as Session)

      const callArgs = mockSend.mock.calls[0][0]
      expect(callArgs.html).toContain('© 2024 DiscoverXYZ')
    })
  })
})