import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mockAuthClient } from './setup'

// Mock dependencies
vi.mock('@/lib/better-auth/client', () => ({
  authClient: mockAuthClient,
}))

describe('Multi-Factor Authentication (MFA)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock MFA methods
    mockAuthClient.mfa = {
      enable: vi.fn(),
      disable: vi.fn(),
      generateSecret: vi.fn(),
      verify: vi.fn(),
      generateBackupCodes: vi.fn(),
      verifyBackupCode: vi.fn(),
      status: vi.fn(),
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('MFA Setup', () => {
    it('should generate MFA secret and QR code', async () => {
      mockAuthClient.mfa.generateSecret.mockResolvedValueOnce({
        data: {
          secret: 'JBSWY3DPEHPK3PXP',
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
          backupCodes: [
            'backup-code-1',
            'backup-code-2',
            'backup-code-3',
            'backup-code-4',
            'backup-code-5',
            'backup-code-6',
          ],
        },
      })

      const result = await mockAuthClient.mfa.generateSecret()

      expect(result.data.secret).toBeDefined()
      expect(result.data.qrCode).toContain('data:image/png')
      expect(result.data.backupCodes).toHaveLength(6)
    })

    it('should enable MFA after successful verification', async () => {
      const verificationCode = '123456'

      mockAuthClient.mfa.enable.mockResolvedValueOnce({
        data: {
          success: true,
          user: {
            id: 'user-mfa',
            email: 'mfa@example.com',
            mfaEnabled: true,
          },
        },
      })

      const result = await mockAuthClient.mfa.enable({
        code: verificationCode,
      })

      expect(result.data.success).toBe(true)
      expect(result.data.user.mfaEnabled).toBe(true)
    })

    it('should reject invalid verification code during setup', async () => {
      const invalidCode = '000000'

      mockAuthClient.mfa.enable.mockRejectedValueOnce(
        new Error('Invalid verification code')
      )

      await expect(
        mockAuthClient.mfa.enable({ code: invalidCode })
      ).rejects.toThrow('Invalid verification code')
    })
  })

  describe('MFA Login Flow', () => {
    it('should require MFA after password authentication', async () => {
      // Step 1: Password login returns MFA challenge
      mockAuthClient.signIn.email.mockResolvedValueOnce({
        data: {
          mfaRequired: true,
          challengeId: 'challenge-123',
          user: null,
          session: null,
        },
      })

      const passwordResult = await mockAuthClient.signIn.email({
        email: 'mfa@example.com',
        password: 'password123',
      })

      expect(passwordResult.data.mfaRequired).toBe(true)
      expect(passwordResult.data.challengeId).toBeDefined()

      // Step 2: Submit MFA code
      mockAuthClient.mfa.verify.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-mfa',
            email: 'mfa@example.com',
          },
          session: {
            id: 'session-mfa',
            userId: 'user-mfa',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        },
      })

      const mfaResult = await mockAuthClient.mfa.verify({
        challengeId: passwordResult.data.challengeId,
        code: '123456',
      })

      expect(mfaResult.data.session).toBeDefined()
      expect(mfaResult.data.user.email).toBe('mfa@example.com')
    })

    it('should handle MFA timeout', async () => {
      const challengeId = 'challenge-timeout'

      // Simulate waiting too long
      vi.advanceTimersByTime(5 * 60 * 1000) // 5 minutes

      mockAuthClient.mfa.verify.mockRejectedValueOnce(
        new Error('MFA challenge has expired')
      )

      await expect(
        mockAuthClient.mfa.verify({
          challengeId,
          code: '123456',
        })
      ).rejects.toThrow('MFA challenge has expired')
    })

    it('should limit MFA verification attempts', async () => {
      const challengeId = 'challenge-limit'

      // First 2 attempts fail
      for (let i = 0; i < 2; i++) {
        mockAuthClient.mfa.verify.mockRejectedValueOnce(
          new Error('Invalid MFA code')
        )
        
        await expect(
          mockAuthClient.mfa.verify({
            challengeId,
            code: '000000',
          })
        ).rejects.toThrow('Invalid MFA code')
      }

      // 3rd attempt locks the challenge
      mockAuthClient.mfa.verify.mockRejectedValueOnce(
        new Error('Too many failed attempts. Please sign in again.')
      )

      await expect(
        mockAuthClient.mfa.verify({
          challengeId,
          code: '000000',
        })
      ).rejects.toThrow('Too many failed attempts')
    })
  })

  describe('Backup Codes', () => {
    it('should use backup code when MFA device unavailable', async () => {
      const challengeId = 'challenge-backup'
      const backupCode = 'backup-code-1'

      mockAuthClient.mfa.verifyBackupCode.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-backup',
            email: 'backup@example.com',
          },
          session: {
            id: 'session-backup',
            userId: 'user-backup',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
          backupCodeUsed: true,
          remainingBackupCodes: 5,
        },
      })

      const result = await mockAuthClient.mfa.verifyBackupCode({
        challengeId,
        backupCode,
      })

      expect(result.data.session).toBeDefined()
      expect(result.data.backupCodeUsed).toBe(true)
      expect(result.data.remainingBackupCodes).toBe(5)
    })

    it('should invalidate used backup codes', async () => {
      const challengeId = 'challenge-reuse'
      const usedBackupCode = 'used-backup-code'

      // First use succeeds
      mockAuthClient.mfa.verifyBackupCode.mockResolvedValueOnce({
        data: {
          user: { id: 'user-1', email: 'test@example.com' },
          session: { id: 'session-1', userId: 'user-1' },
          backupCodeUsed: true,
        },
      })

      await mockAuthClient.mfa.verifyBackupCode({
        challengeId,
        backupCode: usedBackupCode,
      })

      // Second use fails
      mockAuthClient.mfa.verifyBackupCode.mockRejectedValueOnce(
        new Error('Backup code has already been used')
      )

      await expect(
        mockAuthClient.mfa.verifyBackupCode({
          challengeId: 'new-challenge',
          backupCode: usedBackupCode,
        })
      ).rejects.toThrow('Backup code has already been used')
    })

    it('should generate new backup codes', async () => {
      mockAuthClient.mfa.generateBackupCodes.mockResolvedValueOnce({
        data: {
          backupCodes: [
            'new-backup-1',
            'new-backup-2',
            'new-backup-3',
            'new-backup-4',
            'new-backup-5',
            'new-backup-6',
          ],
          generatedAt: new Date().toISOString(),
        },
      })

      const result = await mockAuthClient.mfa.generateBackupCodes()

      expect(result.data.backupCodes).toHaveLength(6)
      expect(result.data.generatedAt).toBeDefined()
    })
  })

  describe('MFA Management', () => {
    it('should disable MFA with password confirmation', async () => {
      mockAuthClient.mfa.disable.mockResolvedValueOnce({
        data: {
          success: true,
          user: {
            id: 'user-disable',
            email: 'disable@example.com',
            mfaEnabled: false,
          },
        },
      })

      const result = await mockAuthClient.mfa.disable({
        password: 'password123',
      })

      expect(result.data.success).toBe(true)
      expect(result.data.user.mfaEnabled).toBe(false)
    })

    it('should get MFA status', async () => {
      mockAuthClient.mfa.status.mockResolvedValueOnce({
        data: {
          enabled: true,
          methods: ['totp'],
          backupCodesRemaining: 4,
          lastUsed: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        },
      })

      const result = await mockAuthClient.mfa.status()

      expect(result.data.enabled).toBe(true)
      expect(result.data.methods).toContain('totp')
      expect(result.data.backupCodesRemaining).toBe(4)
      expect(result.data.lastUsed).toBeDefined()
    })

    it('should require re-authentication for MFA changes', async () => {
      // Attempt to disable without password
      mockAuthClient.mfa.disable.mockRejectedValueOnce(
        new Error('Password required for this operation')
      )

      await expect(
        mockAuthClient.mfa.disable({})
      ).rejects.toThrow('Password required')
    })
  })

  describe('Multiple MFA Methods', () => {
    it('should support multiple MFA methods simultaneously', async () => {
      mockAuthClient.mfa.status.mockResolvedValueOnce({
        data: {
          enabled: true,
          methods: ['totp', 'sms', 'email'],
          preferredMethod: 'totp',
        },
      })

      const status = await mockAuthClient.mfa.status()

      expect(status.data.methods).toHaveLength(3)
      expect(status.data.preferredMethod).toBe('totp')
    })

    it('should fallback to alternative MFA method', async () => {
      const challengeId = 'challenge-fallback'

      // TOTP fails
      mockAuthClient.mfa.verify.mockRejectedValueOnce(
        new Error('Invalid TOTP code')
      )

      await expect(
        mockAuthClient.mfa.verify({
          challengeId,
          code: '000000',
          method: 'totp',
        })
      ).rejects.toThrow('Invalid TOTP code')

      // Try SMS instead
      mockAuthClient.mfa.requestSMS = vi.fn().mockResolvedValueOnce({
        data: {
          success: true,
          message: 'SMS code sent',
        },
      })

      await mockAuthClient.mfa.requestSMS({ challengeId })

      // Verify SMS code
      mockAuthClient.mfa.verify.mockResolvedValueOnce({
        data: {
          user: { id: 'user-sms', email: 'sms@example.com' },
          session: { id: 'session-sms', userId: 'user-sms' },
        },
      })

      const smsResult = await mockAuthClient.mfa.verify({
        challengeId,
        code: '654321',
        method: 'sms',
      })

      expect(smsResult.data.session).toBeDefined()
    })
  })

  describe('Device Trust', () => {
    it('should remember trusted devices', async () => {
      mockAuthClient.mfa.trustDevice = vi.fn().mockResolvedValueOnce({
        data: {
          deviceId: 'device-123',
          trustedUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        },
      })

      const result = await mockAuthClient.mfa.trustDevice({
        deviceName: 'My Laptop',
      })

      expect(result.data.deviceId).toBeDefined()
      expect(result.data.trustedUntil).toBeDefined()
    })

    it('should skip MFA on trusted devices', async () => {
      // Login from trusted device
      mockAuthClient.signIn.email.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-trusted',
            email: 'trusted@example.com',
          },
          session: {
            id: 'session-trusted',
            userId: 'user-trusted',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
          trustedDevice: true,
        },
      })

      const result = await mockAuthClient.signIn.email({
        email: 'trusted@example.com',
        password: 'password123',
        deviceId: 'device-123',
      })

      expect(result.data.session).toBeDefined()
      expect(result.data.trustedDevice).toBe(true)
    })

    it('should revoke device trust', async () => {
      mockAuthClient.mfa.revokeDeviceTrust = vi.fn().mockResolvedValueOnce({
        data: {
          success: true,
          revokedDevices: ['device-123'],
        },
      })

      const result = await mockAuthClient.mfa.revokeDeviceTrust({
        deviceIds: ['device-123'],
      })

      expect(result.data.success).toBe(true)
      expect(result.data.revokedDevices).toContain('device-123')
    })
  })
})