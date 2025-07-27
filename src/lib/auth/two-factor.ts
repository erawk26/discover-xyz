import { generateId } from 'better-auth'
import * as crypto from 'crypto'

// In-memory storage for testing - replace with database in production
const userTOTPSecrets = new Map<string, {
  secret: string
  enabled: boolean
  backupCodes: string[]
  usedBackupCodes: Set<string>
  failedAttempts: number
  lastAttempt: number
}>()

export interface TOTPGenerationResult {
  secret: string
  qrCode: string
  otpauthUrl: string
  backupCodes: string[]
}

/**
 * Generate TOTP secret for user
 */
export async function generateTOTPSecret(
  userId: string,
  options?: { email?: string; issuer?: string }
): Promise<TOTPGenerationResult> {
  // Generate random secret (16 bytes = 32 base32 chars)
  const buffer = crypto.randomBytes(16)
  const secret = base32Encode(buffer)
  
  // Generate backup codes
  const backupCodes = await generateBackupCodes()
  
  // Store for user
  userTOTPSecrets.set(userId, {
    secret,
    enabled: false, // Not enabled until first successful verification
    backupCodes,
    usedBackupCodes: new Set(),
    failedAttempts: 0,
    lastAttempt: 0,
  })
  
  // Generate otpauth URL
  const issuer = options?.issuer || 'App'
  const email = options?.email || userId
  const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`
  
  // Generate QR code (mock for testing)
  const qrCode = `data:image/png;base64,${Buffer.from(otpauthUrl).toString('base64')}`
  
  return {
    secret,
    qrCode,
    otpauthUrl,
    backupCodes,
  }
}

/**
 * Get user's TOTP secret
 */
export async function getUserTOTPSecret(userId: string) {
  return userTOTPSecrets.get(userId)
}

/**
 * Generate TOTP code
 */
export async function generateTOTPCode(
  secret: string,
  options?: { timestamp?: number; timeOffset?: number }
): Promise<string> {
  const timestamp = options?.timestamp || Date.now()
  const timeOffset = options?.timeOffset || 0
  const time = Math.floor((timestamp + timeOffset) / 30000) // 30 second windows
  
  // Convert time to buffer
  const timeBuffer = Buffer.alloc(8)
  timeBuffer.writeBigInt64BE(BigInt(time))
  
  // Decode secret from base32
  const secretBuffer = base32Decode(secret)
  
  // Generate HMAC
  const hmac = crypto.createHmac('sha1', secretBuffer)
  hmac.update(timeBuffer)
  const hash = hmac.digest()
  
  // Dynamic truncation
  const offset = hash[hash.length - 1] & 0x0f
  const code = (
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff)
  ) % 1000000
  
  // Pad with zeros if needed
  return code.toString().padStart(6, '0')
}

/**
 * Verify TOTP code
 */
export async function verifyTOTPCode(
  userId: string,
  code: string,
  options?: { window?: number }
): Promise<{ valid: boolean; enabled?: boolean; error?: string }> {
  const userData = userTOTPSecrets.get(userId)
  
  if (!userData) {
    return { valid: false, error: 'No 2FA setup for user' }
  }
  
  // Rate limiting
  const now = Date.now()
  if (userData.failedAttempts >= 5 && now - userData.lastAttempt < 60000) {
    return { valid: false, error: 'Too many attempts. Try again later.' }
  }
  
  userData.lastAttempt = now
  
  // Check code format
  if (!/^\d{6}$/.test(code)) {
    userData.failedAttempts++
    return { valid: false, error: 'Invalid code format' }
  }
  
  // Verify code with time window
  const window = options?.window || 1
  let valid = false
  
  for (let i = -window; i <= window; i++) {
    const expectedCode = await generateTOTPCode(userData.secret, { timeOffset: i * 30000 })
    if (expectedCode === code) {
      valid = true
      break
    }
  }
  
  if (valid) {
    userData.failedAttempts = 0
    
    // Enable 2FA on first successful verification
    if (!userData.enabled) {
      userData.enabled = true
    }
    
    return { valid: true, enabled: userData.enabled }
  } else {
    userData.failedAttempts++
    return { valid: false, error: 'Invalid code' }
  }
}

/**
 * Generate backup codes
 */
export async function generateBackupCodes(): Promise<string[]> {
  const codes: string[] = []
  
  for (let i = 0; i < 8; i++) {
    const part1 = generateId(4).toUpperCase()
    const part2 = generateId(4).toUpperCase()
    codes.push(`${part1}-${part2}`)
  }
  
  return codes
}

/**
 * Verify backup code
 */
export async function verifyBackupCode(
  userId: string,
  code: string
): Promise<{ valid: boolean; remaining?: number; error?: string }> {
  const userData = userTOTPSecrets.get(userId)
  
  if (!userData) {
    return { valid: false, error: 'No 2FA setup for user' }
  }
  
  // Check format
  if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
    return { valid: false, error: 'Invalid backup code format' }
  }
  
  // Check if already used
  if (userData.usedBackupCodes.has(code)) {
    return { valid: false, error: 'Backup code already used' }
  }
  
  // Check if valid
  if (!userData.backupCodes.includes(code)) {
    return { valid: false, error: 'Invalid backup code' }
  }
  
  // Mark as used
  userData.usedBackupCodes.add(code)
  
  const remaining = userData.backupCodes.length - userData.usedBackupCodes.size
  
  return { valid: true, remaining }
}

/**
 * Get remaining backup codes count
 */
export async function getRemainingBackupCodes(userId: string): Promise<number> {
  const userData = userTOTPSecrets.get(userId)
  
  if (!userData) {
    return 0
  }
  
  return userData.backupCodes.length - userData.usedBackupCodes.size
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(userId: string): Promise<string[]> {
  const userData = userTOTPSecrets.get(userId)
  
  if (!userData) {
    throw new Error('No 2FA setup for user')
  }
  
  const newCodes = await generateBackupCodes()
  userData.backupCodes = newCodes
  userData.usedBackupCodes.clear()
  
  return newCodes
}

/**
 * Check if user requires 2FA
 */
export async function checkRequires2FA(userId: string): Promise<boolean> {
  const userData = userTOTPSecrets.get(userId)
  return userData?.enabled || false
}

/**
 * Complete 2FA login
 */
export async function complete2FALogin(params: {
  userId: string
  code: string
  isBackupCode?: boolean
}): Promise<{
  success: boolean
  session?: any
  backupCodeUsed?: boolean
  error?: string
}> {
  const { userId, code, isBackupCode } = params
  
  let valid = false
  let backupCodeUsed = false
  
  if (isBackupCode) {
    const result = await verifyBackupCode(userId, code)
    valid = result.valid
    backupCodeUsed = true
  } else {
    const result = await verifyTOTPCode(userId, code)
    valid = result.valid
  }
  
  if (!valid) {
    return {
      success: false,
      error: 'Invalid 2FA code',
    }
  }
  
  // Create session (mock)
  const session = {
    id: `session-${Date.now()}`,
    userId,
    twoFactorVerified: true,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  }
  
  return {
    success: true,
    session,
    backupCodeUsed,
  }
}

// Helper functions

function base32Encode(buffer: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let result = ''
  let bits = 0
  let value = 0
  
  for (const byte of buffer) {
    value = (value << 8) | byte
    bits += 8
    
    while (bits >= 5) {
      bits -= 5
      result += alphabet[(value >>> bits) & 31]
    }
  }
  
  if (bits > 0) {
    result += alphabet[(value << (5 - bits)) & 31]
  }
  
  return result
}

function base32Decode(encoded: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const bytes: number[] = []
  let bits = 0
  let value = 0
  
  for (const char of encoded) {
    const index = alphabet.indexOf(char)
    if (index === -1) continue
    
    value = (value << 5) | index
    bits += 5
    
    if (bits >= 8) {
      bits -= 8
      bytes.push((value >>> bits) & 255)
    }
  }
  
  return Buffer.from(bytes)
}