import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { User as PayloadUser } from '@/payload-types'

// Mock email service
const mockEmailService = {
  sendMagicLink: vi.fn(),
  sendEmail: vi.fn(),
}

describe('Magic Links', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Magic Link Generation', () => {
    it('should generate magic link token', async () => {
      const { generateMagicLinkToken } = await import('@/lib/auth/magic-links')
      
      const email = 'user@example.com'
      const token = await generateMagicLinkToken(email)
      
      expect(token).toBeDefined()
      expect(token.token).toMatch(/^[a-zA-Z0-9_-]+$/) // URL-safe token
      expect(token.expires).toBeInstanceOf(Date)
      expect(token.expires.getTime()).toBeGreaterThan(Date.now())
    })

    it('should store magic link token with expiration', async () => {
      const { generateMagicLinkToken, getMagicLinkToken } = await import('@/lib/auth/magic-links')
      
      const email = 'test@example.com'
      const generated = await generateMagicLinkToken(email)
      
      const stored = await getMagicLinkToken(generated.token)
      
      expect(stored).toBeDefined()
      expect(stored?.email).toBe(email)
      expect(stored?.expires).toEqual(generated.expires)
    })

    it('should invalidate expired tokens', async () => {
      const { generateMagicLinkToken, getMagicLinkToken } = await import('@/lib/auth/magic-links')
      
      // Generate token with short expiration
      const email = 'expired@example.com'
      const token = await generateMagicLinkToken(email, { expiresIn: -1 }) // Already expired
      
      const result = await getMagicLinkToken(token.token)
      
      expect(result).toBeNull()
    })
  })

  describe('Email Sending', () => {
    it('should send magic link email', async () => {
      const { sendMagicLinkEmail } = await import('@/lib/auth/magic-links')
      
      mockEmailService.sendEmail.mockResolvedValue({ success: true })
      
      const result = await sendMagicLinkEmail({
        email: 'recipient@example.com',
        token: 'test-token-123',
        baseUrl: 'http://localhost:3000',
        emailService: mockEmailService,
      })
      
      expect(result.success).toBe(true)
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith({
        to: 'recipient@example.com',
        subject: expect.stringContaining('Sign in'),
        html: expect.stringContaining('test-token-123'),
        text: expect.stringContaining('test-token-123'),
      })
    })

    it('should handle email sending failures', async () => {
      const { sendMagicLinkEmail } = await import('@/lib/auth/magic-links')
      
      mockEmailService.sendEmail.mockRejectedValue(new Error('SMTP error'))
      
      const result = await sendMagicLinkEmail({
        email: 'failed@example.com',
        token: 'test-token-456',
        baseUrl: 'http://localhost:3000',
        emailService: mockEmailService,
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to send')
    })

    it('should include custom redirect in magic link', async () => {
      const { sendMagicLinkEmail } = await import('@/lib/auth/magic-links')
      
      mockEmailService.sendEmail.mockResolvedValue({ success: true })
      
      await sendMagicLinkEmail({
        email: 'redirect@example.com',
        token: 'test-token-789',
        baseUrl: 'http://localhost:3000',
        redirectTo: '/dashboard',
        emailService: mockEmailService,
      })
      
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith({
        to: 'redirect@example.com',
        subject: expect.any(String),
        html: expect.stringContaining('redirectTo=%2Fdashboard'),
        text: expect.stringContaining('redirectTo=%2Fdashboard'),
      })
    })
  })

  describe('Token Validation', () => {
    it('should validate valid magic link token', async () => {
      const { generateMagicLinkToken, validateMagicLinkToken } = await import('@/lib/auth/magic-links')
      
      const email = 'valid@example.com'
      const { token } = await generateMagicLinkToken(email)
      
      const result = await validateMagicLinkToken(token)
      
      expect(result.valid).toBe(true)
      expect(result.email).toBe(email)
    })

    it('should reject invalid token format', async () => {
      const { validateMagicLinkToken } = await import('@/lib/auth/magic-links')
      
      const result = await validateMagicLinkToken('invalid-token!')
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid token')
    })

    it('should reject expired tokens', async () => {
      const { generateMagicLinkToken, validateMagicLinkToken } = await import('@/lib/auth/magic-links')
      
      const email = 'expired@example.com'
      const { token } = await generateMagicLinkToken(email, { expiresIn: 1 }) // 1ms expiration
      
      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const result = await validateMagicLinkToken(token)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('expired')
    })

    it('should invalidate token after use', async () => {
      const { generateMagicLinkToken, validateMagicLinkToken, consumeMagicLinkToken } = await import('@/lib/auth/magic-links')
      
      const email = 'oneuse@example.com'
      const { token } = await generateMagicLinkToken(email)
      
      // First use should succeed
      const consumed = await consumeMagicLinkToken(token)
      expect(consumed.success).toBe(true)
      expect(consumed.email).toBe(email)
      
      // Second use should fail
      const result = await validateMagicLinkToken(token)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('already used')
    })
  })

  describe('User Creation', () => {
    it('should create new user from magic link', async () => {
      const { handleMagicLinkSignIn } = await import('@/lib/auth/magic-links')
      
      const result = await handleMagicLinkSignIn({
        email: 'newmagic@example.com',
        token: 'valid-token',
      })
      
      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user?.email).toBe('newmagic@example.com')
      expect(result.user?.emailVerified).toBe(true) // Magic link verifies email
      expect(result.isNewUser).toBe(true)
    })

    it('should sign in existing user with magic link', async () => {
      const { handleMagicLinkSignIn } = await import('@/lib/auth/magic-links')
      
      const result = await handleMagicLinkSignIn({
        email: 'existing@gmail.com', // Existing user from mock
        token: 'valid-token',
      })
      
      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user?.email).toBe('existing@gmail.com')
      expect(result.isNewUser).toBe(false)
    })

    it('should create session after magic link sign in', async () => {
      const { handleMagicLinkSignIn } = await import('@/lib/auth/magic-links')
      
      const result = await handleMagicLinkSignIn({
        email: 'session@example.com',
        token: 'valid-token',
      })
      
      expect(result.success).toBe(true)
      expect(result.session).toBeDefined()
      expect(result.session?.userId).toBeDefined()
      expect(result.session?.expiresAt).toBeInstanceOf(Date)
    })

    it('should set email as verified for new users', async () => {
      const { handleMagicLinkSignIn } = await import('@/lib/auth/magic-links')
      
      const result = await handleMagicLinkSignIn({
        email: 'verified@example.com',
        token: 'valid-token',
      })
      
      expect(result.success).toBe(true)
      expect(result.user?.emailVerified).toBe(true)
    })
  })

  describe('Magic Link Flow', () => {
    it('should complete full magic link flow', async () => {
      const { initiateMagicLinkFlow, completeMagicLinkFlow } = await import('@/lib/auth/magic-links')
      
      const email = 'fullflow@example.com'
      
      // Step 1: Request magic link
      mockEmailService.sendEmail.mockResolvedValue({ success: true })
      
      const requestResult = await initiateMagicLinkFlow({
        email,
        emailService: mockEmailService,
      })
      
      expect(requestResult.success).toBe(true)
      expect(requestResult.message).toContain('Check your email')
      
      // Extract token from mock call
      const emailCall = mockEmailService.sendEmail.mock.calls[0][0]
      const tokenMatch = emailCall.html.match(/token=([a-zA-Z0-9_-]+)/)
      const token = tokenMatch?.[1]
      
      expect(token).toBeDefined()
      
      // Step 2: Use magic link
      const signInResult = await completeMagicLinkFlow({
        token: token!,
      })
      
      expect(signInResult.success).toBe(true)
      expect(signInResult.user).toBeDefined()
      expect(signInResult.session).toBeDefined()
    })
  })
})