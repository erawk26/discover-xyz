import { Resend } from 'resend'

// Initialize Resend client
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// Export for testing
export const resendClient = resend

// Email configuration
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@discover-xyz.com'
const SITE_NAME = process.env.SITE_NAME || 'Discover XYZ'
const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3026'

// Development mode check
const isDevelopment = process.env.NODE_ENV === 'development'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Send an email using Resend
 * In development without API key, logs to console
 */
export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  if (!resend) {
    if (isDevelopment) {
      console.log('\n📧 Email (Development Mode - No Resend API Key):')
      console.log('To:', to)
      console.log('Subject:', subject)
      console.log('Content:', text || html)
      console.log('---\n')
      return { success: true, development: true }
    }
    
    throw new Error('Email service not configured. Please set RESEND_API_KEY environment variable.')
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text,
    })

    return { success: true, data: result }
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}

/**
 * Email templates
 */
export const emailTemplates = {
  verificationEmail: (verificationUrl: string) => ({
    subject: `Verify your email for ${SITE_NAME}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Verify Your Email</h1>
        <p>Thank you for signing up for ${SITE_NAME}. Please verify your email address by clicking the link below:</p>
        <p style="margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email
          </a>
        </p>
        <p>Or copy and paste this URL into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p style="color: #666; font-size: 14px; margin-top: 40px;">
          If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `,
    text: `Verify your email for ${SITE_NAME}\n\nThank you for signing up. Please verify your email address by visiting:\n\n${verificationUrl}\n\nIf you didn't create an account, you can safely ignore this email.`
  }),

  passwordResetEmail: (resetUrl: string) => ({
    subject: `Reset your password for ${SITE_NAME}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Reset Your Password</h1>
        <p>You requested to reset your password for ${SITE_NAME}. Click the link below to create a new password:</p>
        <p style="margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p>Or copy and paste this URL into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p style="color: #666; font-size: 14px; margin-top: 40px;">
          This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
    text: `Reset your password for ${SITE_NAME}\n\nYou requested to reset your password. Visit the following link to create a new password:\n\n${resetUrl}\n\nThis link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.`
  }),

  magicLinkEmail: (magicLinkUrl: string) => ({
    subject: `Your login link for ${SITE_NAME}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Login to ${SITE_NAME}</h1>
        <p>Click the link below to log in to your account:</p>
        <p style="margin: 30px 0;">
          <a href="${magicLinkUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Log In
          </a>
        </p>
        <p>Or copy and paste this URL into your browser:</p>
        <p style="word-break: break-all; color: #666;">${magicLinkUrl}</p>
        <p style="color: #666; font-size: 14px; margin-top: 40px;">
          This link will expire in 15 minutes. If you didn't request this login link, you can safely ignore this email.
        </p>
      </div>
    `,
    text: `Login to ${SITE_NAME}\n\nClick the following link to log in to your account:\n\n${magicLinkUrl}\n\nThis link will expire in 15 minutes. If you didn't request this login link, you can safely ignore this email.`
  }),

  otpEmail: (otp: string, purpose: string) => ({
    subject: `Your ${purpose} code for ${SITE_NAME}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Your ${purpose} Code</h1>
        <p>Enter this code to complete your ${purpose.toLowerCase()}:</p>
        <p style="margin: 30px 0; text-align: center;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; background-color: #f3f4f6; padding: 16px 32px; border-radius: 8px; display: inline-block;">
            ${otp}
          </span>
        </p>
        <p style="color: #666; font-size: 14px; margin-top: 40px;">
          This code will expire in 10 minutes. If you didn't request this code, you can safely ignore this email.
        </p>
      </div>
    `,
    text: `Your ${purpose} code for ${SITE_NAME}\n\nEnter this code to complete your ${purpose.toLowerCase()}:\n\n${otp}\n\nThis code will expire in 10 minutes. If you didn't request this code, you can safely ignore this email.`
  }),

  invitationEmail: (inviteUrl: string, inviterName: string, organizationName: string) => ({
    subject: `You've been invited to join ${organizationName} on ${SITE_NAME}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">You're Invited!</h1>
        <p>${inviterName} has invited you to join ${organizationName} on ${SITE_NAME}.</p>
        <p style="margin: 30px 0;">
          <a href="${inviteUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accept Invitation
          </a>
        </p>
        <p>Or copy and paste this URL into your browser:</p>
        <p style="word-break: break-all; color: #666;">${inviteUrl}</p>
        <p style="color: #666; font-size: 14px; margin-top: 40px;">
          This invitation will expire in 7 days. If you don't want to join, you can safely ignore this email.
        </p>
      </div>
    `,
    text: `You've been invited to join ${organizationName} on ${SITE_NAME}\n\n${inviterName} has invited you to join their organization. Accept the invitation by visiting:\n\n${inviteUrl}\n\nThis invitation will expire in 7 days. If you don't want to join, you can safely ignore this email.`
  }),

  changeEmailVerification: (verificationUrl: string, newEmail: string) => ({
    subject: `Verify your new email address for ${SITE_NAME}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Verify Your New Email Address</h1>
        <p>You requested to change your email address to: <strong>${newEmail}</strong></p>
        <p>Please confirm this change by clicking the link below:</p>
        <p style="margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify New Email
          </a>
        </p>
        <p>Or copy and paste this URL into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p style="color: #666; font-size: 14px; margin-top: 40px;">
          If you didn't request this change, please contact support immediately.
        </p>
      </div>
    `,
    text: `Verify your new email address for ${SITE_NAME}\n\nYou requested to change your email address to: ${newEmail}\n\nPlease confirm this change by visiting:\n\n${verificationUrl}\n\nIf you didn't request this change, please contact support immediately.`
  })
}