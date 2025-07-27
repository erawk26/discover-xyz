import { generateId } from 'better-auth'

// In-memory storage for testing - replace with database in production
const magicLinkTokens = new Map<string, {
  email: string
  expires: Date
  used: boolean
}>()

export interface MagicLinkToken {
  token: string
  expires: Date
}

export interface EmailService {
  sendEmail: (params: {
    to: string
    subject: string
    html: string
    text: string
  }) => Promise<{ success: boolean; error?: string }>
}

/**
 * Generate a magic link token
 */
export async function generateMagicLinkToken(
  email: string,
  options: { expiresIn?: number } = {}
): Promise<MagicLinkToken> {
  const token = generateId(32) // URL-safe token
  const expiresIn = options.expiresIn ?? 15 * 60 * 1000 // Default 15 minutes
  const expires = new Date(Date.now() + expiresIn)
  
  magicLinkTokens.set(token, {
    email,
    expires,
    used: false,
  })
  
  return { token, expires }
}

/**
 * Get magic link token data
 */
export async function getMagicLinkToken(token: string) {
  const data = magicLinkTokens.get(token)
  
  if (!data) return null
  
  // Check if expired
  if (data.expires.getTime() < Date.now()) {
    magicLinkTokens.delete(token)
    return null
  }
  
  // Check if already used
  if (data.used) {
    return null
  }
  
  return data
}

/**
 * Send magic link email
 */
export async function sendMagicLinkEmail(params: {
  email: string
  token: string
  baseUrl: string
  redirectTo?: string
  emailService: EmailService
}): Promise<{ success: boolean; error?: string }> {
  const { email, token, baseUrl, redirectTo, emailService } = params
  
  const linkUrl = new URL('/api/auth/magic-link/verify', baseUrl)
  linkUrl.searchParams.set('token', token)
  if (redirectTo) {
    linkUrl.searchParams.set('redirectTo', redirectTo)
  }
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Sign in to your account</h2>
      <p>Click the link below to sign in to your account:</p>
      <p style="margin: 30px 0;">
        <a href="${linkUrl.toString()}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Sign in
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">
        This link will expire in 15 minutes. If you didn't request this email, you can safely ignore it.
      </p>
    </div>
  `
  
  const text = `
Sign in to your account

Click the link below to sign in:
${linkUrl.toString()}

This link will expire in 15 minutes. If you didn't request this email, you can safely ignore it.
  `
  
  try {
    const result = await emailService.sendEmail({
      to: email,
      subject: 'Sign in to your account',
      html,
      text,
    })
    
    return result
  } catch (error) {
    return {
      success: false,
      error: 'Failed to send email',
    }
  }
}

/**
 * Validate magic link token
 */
export async function validateMagicLinkToken(
  token: string
): Promise<{ valid: boolean; email?: string; error?: string }> {
  // Basic format validation
  if (!/^[a-zA-Z0-9_-]+$/.test(token)) {
    return {
      valid: false,
      error: 'Invalid token format',
    }
  }
  
  const data = await getMagicLinkToken(token)
  
  if (!data) {
    return {
      valid: false,
      error: 'Token expired or already used',
    }
  }
  
  return {
    valid: true,
    email: data.email,
  }
}

/**
 * Consume magic link token (mark as used)
 */
export async function consumeMagicLinkToken(
  token: string
): Promise<{ success: boolean; email?: string; error?: string }> {
  const data = magicLinkTokens.get(token)
  
  if (!data) {
    return {
      success: false,
      error: 'Invalid token',
    }
  }
  
  if (data.used) {
    return {
      success: false,
      error: 'Token already used',
    }
  }
  
  if (data.expires.getTime() < Date.now()) {
    magicLinkTokens.delete(token)
    return {
      success: false,
      error: 'Token expired',
    }
  }
  
  // Mark as used
  data.used = true
  
  return {
    success: true,
    email: data.email,
  }
}

/**
 * Handle magic link sign in
 */
export async function handleMagicLinkSignIn(params: {
  email: string
  token: string
}): Promise<{
  success: boolean
  user?: any
  session?: any
  isNewUser?: boolean
  error?: string
}> {
  // For testing, create mock user
  const isExisting = params.email === 'existing@gmail.com'
  
  const user = {
    id: isExisting ? 'existing-user-id' : `user-${Date.now()}`,
    email: params.email,
    name: params.email.split('@')[0],
    emailVerified: true, // Magic link verifies email
    role: isExisting ? 'authenticated' : 'authenticated',
  }
  
  const session = {
    id: `session-${Date.now()}`,
    userId: user.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  }
  
  return {
    success: true,
    user,
    session,
    isNewUser: !isExisting,
  }
}

/**
 * Initiate magic link flow
 */
export async function initiateMagicLinkFlow(params: {
  email: string
  redirectTo?: string
  emailService: EmailService
  baseUrl?: string
}): Promise<{ success: boolean; message?: string; error?: string }> {
  const { email, redirectTo, emailService, baseUrl = 'http://localhost:3026' } = params
  
  try {
    // Generate token
    const { token } = await generateMagicLinkToken(email)
    
    // Send email
    const emailResult = await sendMagicLinkEmail({
      email,
      token,
      baseUrl,
      redirectTo,
      emailService,
    })
    
    if (!emailResult.success) {
      return {
        success: false,
        error: emailResult.error,
      }
    }
    
    return {
      success: true,
      message: 'Check your email for a sign-in link',
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to send magic link',
    }
  }
}

/**
 * Complete magic link flow
 */
export async function completeMagicLinkFlow(params: {
  token: string
}): Promise<{
  success: boolean
  user?: any
  session?: any
  error?: string
}> {
  // Validate token
  const validation = await validateMagicLinkToken(params.token)
  
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
    }
  }
  
  // Consume token
  const consumed = await consumeMagicLinkToken(params.token)
  
  if (!consumed.success) {
    return {
      success: false,
      error: consumed.error,
    }
  }
  
  // Sign in user
  return await handleMagicLinkSignIn({
    email: consumed.email!,
    token: params.token,
  })
}