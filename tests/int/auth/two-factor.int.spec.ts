import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { User as PayloadUser } from '@/payload-types'

describe('Two-Factor Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('2FA Enrollment', () => {
    it('should generate TOTP secret for user', async () => {
      const { generateTOTPSecret } = await import('@/lib/auth/two-factor')
      
      const userId = 'user-123'
      const result = await generateTOTPSecret(userId)
      
      expect(result.secret).toBeDefined()
      expect(result.secret).toMatch(/^[A-Z0-9]+$/) // Base32 encoded
      expect(result.qrCode).toBeDefined()
      expect(result.qrCode).toContain('data:image/png;base64,')
      expect(result.backupCodes).toBeDefined()
      expect(result.backupCodes).toHaveLength(8)
    })

    it('should generate valid QR code URL', async () => {
      const { generateTOTPSecret } = await import('@/lib/auth/two-factor')
      
      const userId = 'user-456'
      const userEmail = 'user@example.com'
      const result = await generateTOTPSecret(userId, {
        email: userEmail,
        issuer: 'TestApp',
      })
      
      // QR code should contain otpauth URL
      expect(result.otpauthUrl).toBeDefined()
      expect(result.otpauthUrl).toContain('otpauth://totp/')
      expect(result.otpauthUrl).toContain(encodeURIComponent(userEmail))
      expect(result.otpauthUrl).toContain('issuer=TestApp')
      expect(result.otpauthUrl).toContain(`secret=${result.secret}`)
    })

    it('should store 2FA secret for user', async () => {
      const { generateTOTPSecret, getUserTOTPSecret } = await import('@/lib/auth/two-factor')
      
      const userId = 'user-789'
      const generated = await generateTOTPSecret(userId)
      
      const stored = await getUserTOTPSecret(userId)
      
      expect(stored).toBeDefined()
      expect(stored?.secret).toBe(generated.secret)
      expect(stored?.enabled).toBe(false) // Not enabled until verified
    })

    it('should not allow duplicate 2FA enrollment', async () => {
      const { generateTOTPSecret, getUserTOTPSecret } = await import('@/lib/auth/two-factor')
      
      const userId = 'user-duplicate'
      
      // First enrollment
      const first = await generateTOTPSecret(userId)
      
      // Attempt second enrollment
      const second = await generateTOTPSecret(userId)
      
      // Should generate new secret, replacing the old one
      expect(second.secret).not.toBe(first.secret)
      
      const stored = await getUserTOTPSecret(userId)
      expect(stored?.secret).toBe(second.secret)
    })
  })

  describe('TOTP Generation', () => {
    it('should generate valid 6-digit TOTP code', async () => {
      const { generateTOTPCode } = await import('@/lib/auth/two-factor')
      
      const secret = 'JBSWY3DPEHPK3PXP' // Test secret
      const code = await generateTOTPCode(secret)
      
      expect(code).toMatch(/^\d{6}$/)
    })

    it('should generate different codes at different times', async () => {
      const { generateTOTPCode } = await import('@/lib/auth/two-factor')
      
      const secret = 'JBSWY3DPEHPK3PXP'
      
      // Generate code now
      const code1 = await generateTOTPCode(secret)
      
      // Generate code with time offset (30 seconds later)
      const code2 = await generateTOTPCode(secret, { timeOffset: 30000 })
      
      // Codes should be different (unless extremely unlikely collision)
      expect(code1).not.toBe(code2)
    })

    it('should handle custom time window', async () => {
      const { generateTOTPCode } = await import('@/lib/auth/two-factor')
      
      const secret = 'JBSWY3DPEHPK3PXP'
      const now = Date.now()
      
      // Generate code for specific time
      const code = await generateTOTPCode(secret, { timestamp: now })
      
      // Should be 6 digits
      expect(code).toMatch(/^\d{6}$/)
    })
  })

  describe('Verification Flow', () => {
    it('should verify correct TOTP code', async () => {
      const { generateTOTPSecret, verifyTOTPCode } = await import('@/lib/auth/two-factor')
      
      const userId = 'verify-user-1'
      const { secret } = await generateTOTPSecret(userId)
      
      // Generate current code
      const { generateTOTPCode } = await import('@/lib/auth/two-factor')
      const code = await generateTOTPCode(secret)
      
      const result = await verifyTOTPCode(userId, code)
      
      expect(result.valid).toBe(true)
      expect(result.enabled).toBe(true) // Should enable 2FA after first verify
    })

    it('should reject incorrect TOTP code', async () => {
      const { generateTOTPSecret, verifyTOTPCode } = await import('@/lib/auth/two-factor')
      
      const userId = 'verify-user-2'
      await generateTOTPSecret(userId)
      
      const result = await verifyTOTPCode(userId, '000000')
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid code')
    })

    it('should handle time window for TOTP verification', async () => {
      const { generateTOTPSecret, verifyTOTPCode, generateTOTPCode } = await import('@/lib/auth/two-factor')
      
      const userId = 'verify-user-3'
      const { secret } = await generateTOTPSecret(userId)
      
      // Generate code from 30 seconds ago (previous window)
      const oldCode = await generateTOTPCode(secret, { timeOffset: -30000 })
      
      // Should still accept within window (typically ±1 window)
      const result = await verifyTOTPCode(userId, oldCode, { window: 1 })
      
      expect(result.valid).toBe(true)
    })

    it('should rate limit verification attempts', async () => {
      const { generateTOTPSecret, verifyTOTPCode } = await import('@/lib/auth/two-factor')
      
      const userId = 'verify-user-4'
      await generateTOTPSecret(userId)
      
      // Make multiple failed attempts
      for (let i = 0; i < 5; i++) {
        await verifyTOTPCode(userId, '000000')
      }
      
      // Next attempt should be rate limited
      const result = await verifyTOTPCode(userId, '000000')
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Too many attempts')
    })
  })

  describe('Backup Codes', () => {
    it('should generate unique backup codes', async () => {
      const { generateBackupCodes } = await import('@/lib/auth/two-factor')
      
      const codes = await generateBackupCodes()
      
      expect(codes).toHaveLength(8)
      
      // All codes should be unique
      const uniqueCodes = new Set(codes)
      expect(uniqueCodes.size).toBe(8)
      
      // Each code should match format
      codes.forEach(code => {
        expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/)
      })
    })

    it('should verify valid backup code', async () => {
      const { generateTOTPSecret, verifyBackupCode } = await import('@/lib/auth/two-factor')
      
      const userId = 'backup-user-1'
      const { backupCodes } = await generateTOTPSecret(userId)
      
      const result = await verifyBackupCode(userId, backupCodes[0])
      
      expect(result.valid).toBe(true)
      expect(result.remaining).toBe(7) // One code used
    })

    it('should invalidate used backup code', async () => {
      const { generateTOTPSecret, verifyBackupCode } = await import('@/lib/auth/two-factor')
      
      const userId = 'backup-user-2'
      const { backupCodes } = await generateTOTPSecret(userId)
      const codeToUse = backupCodes[0]
      
      // First use should succeed
      const first = await verifyBackupCode(userId, codeToUse)
      expect(first.valid).toBe(true)
      
      // Second use should fail
      const second = await verifyBackupCode(userId, codeToUse)
      expect(second.valid).toBe(false)
      expect(second.error).toContain('already used')
    })

    it('should track remaining backup codes', async () => {
      const { generateTOTPSecret, verifyBackupCode, getRemainingBackupCodes } = await import('@/lib/auth/two-factor')
      
      const userId = 'backup-user-3'
      const { backupCodes } = await generateTOTPSecret(userId)
      
      // Use 3 codes
      for (let i = 0; i < 3; i++) {
        await verifyBackupCode(userId, backupCodes[i])
      }
      
      const remaining = await getRemainingBackupCodes(userId)
      expect(remaining).toBe(5)
    })

    it('should regenerate backup codes', async () => {
      const { generateTOTPSecret, regenerateBackupCodes } = await import('@/lib/auth/two-factor')
      
      const userId = 'backup-user-4'
      const { backupCodes: originalCodes } = await generateTOTPSecret(userId)
      
      const newCodes = await regenerateBackupCodes(userId)
      
      expect(newCodes).toHaveLength(8)
      expect(newCodes).not.toEqual(originalCodes)
      
      // Old codes should no longer work
      const { verifyBackupCode } = await import('@/lib/auth/two-factor')
      const result = await verifyBackupCode(userId, originalCodes[0])
      expect(result.valid).toBe(false)
    })
  })

  describe('2FA Login Flow', () => {
    it('should require 2FA code after password login', async () => {
      const { checkRequires2FA, generateTOTPSecret } = await import('@/lib/auth/two-factor')
      
      const userId = 'user-2fa'
      
      // Setup 2FA for user and enable it
      await generateTOTPSecret(userId)
      
      // Mock enabling 2FA (normally done after first verification)
      const { getUserTOTPSecret } = await import('@/lib/auth/two-factor')
      const userData = await getUserTOTPSecret(userId)
      if (userData) {
        userData.enabled = true
      }
      
      const requires2FA = await checkRequires2FA(userId)
      expect(requires2FA).toBe(true)
    })

    it('should complete login with valid 2FA code', async () => {
      const { complete2FALogin, generateTOTPSecret, generateTOTPCode } = await import('@/lib/auth/two-factor')
      
      const userId = 'user-2fa-login'
      const { secret } = await generateTOTPSecret(userId)
      
      // Enable 2FA
      const { getUserTOTPSecret } = await import('@/lib/auth/two-factor')
      const userData = await getUserTOTPSecret(userId)
      if (userData) {
        userData.enabled = true
      }
      
      // Generate valid code
      const code = await generateTOTPCode(secret)
      
      const result = await complete2FALogin({
        userId,
        code,
      })
      
      expect(result.success).toBe(true)
      expect(result.session).toBeDefined()
    })

    it('should allow backup code for 2FA login', async () => {
      const { complete2FALogin, generateTOTPSecret } = await import('@/lib/auth/two-factor')
      
      const userId = 'user-2fa-backup'
      const { backupCodes } = await generateTOTPSecret(userId)
      
      // Enable 2FA
      const { getUserTOTPSecret } = await import('@/lib/auth/two-factor')
      const userData = await getUserTOTPSecret(userId)
      if (userData) {
        userData.enabled = true
      }
      
      const result = await complete2FALogin({
        userId,
        code: backupCodes[0],
        isBackupCode: true,
      })
      
      expect(result.success).toBe(true)
      expect(result.session).toBeDefined()
      expect(result.backupCodeUsed).toBe(true)
    })
  })
})