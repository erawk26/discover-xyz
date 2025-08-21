import { resendClient } from './resend'

// Define Session type locally
interface Session {
  user: {
    email: string
    name?: string
  }
}

export interface EmailResult {
  success: boolean
  error?: string
}

/**
 * Email service for sending transactional emails
 */
export class EmailService {
  private readonly from = 'DiscoverXYZ <onboarding@resend.dev>'
  private readonly brandColor = '#10b981'

  /**
   * Send email verification link
   */
  async sendVerificationEmail(email: string, verificationUrl: string): Promise<EmailResult> {
    try {
      if (!resendClient) {
        console.log('Email service not configured - would send verification email to:', email)
        return { success: true }
      }
      const { data, error } = await resendClient.emails.send({
        from: this.from,
        to: email,
        subject: 'Verify your email address',
        html: this.getEmailTemplate({
          title: 'Verify Your Email',
          content: `
            <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="display: inline-block; background-color: ${this.brandColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              If you didn't create an account, you can safely ignore this email.
            </p>
          `,
        }),
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      }
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, resetUrl: string): Promise<EmailResult> {
    try {
      if (!resendClient) {
        console.log('Email service not configured - would send password reset email to:', email)
        return { success: true }
      }
      const { data, error } = await resendClient.emails.send({
        from: this.from,
        to: email,
        subject: 'Reset your password',
        html: this.getEmailTemplate({
          title: 'Reset Your Password',
          content: `
            <p>We received a request to reset your password. Click the button below to choose a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; background-color: ${this.brandColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </p>
          `,
        }),
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      }
    }
  }

  /**
   * Send magic link sign-in email
   */
  async sendMagicLinkEmail(email: string, magicLink: string): Promise<EmailResult> {
    try {
      if (!resendClient) {
        console.log('Email service not configured - would send magic link email to:', email)
        return { success: true }
      }
      const { data, error } = await resendClient.emails.send({
        from: this.from,
        to: email,
        subject: 'Sign in to DiscoverXYZ',
        html: this.getEmailTemplate({
          title: 'Sign In Request',
          content: `
            <p>Click the button below to sign in to your DiscoverXYZ account:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${magicLink}" 
                 style="display: inline-block; background-color: ${this.brandColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Sign In
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              This link expires in 15 minutes. If you didn't request this, please ignore this email.
            </p>
          `,
        }),
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      }
    }
  }

  /**
   * Send OTP verification code
   */
  async sendOTPEmail(email: string, otp: string): Promise<EmailResult> {
    try {
      if (!resendClient) {
        console.log('Email service not configured - would send OTP to:', email)
        return { success: true }
      }
      const { data, error } = await resendClient.emails.send({
        from: this.from,
        to: email,
        subject: 'Your DiscoverXYZ verification code',
        html: this.getEmailTemplate({
          title: 'Verification Code',
          content: `
            <p>Your verification code is:</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; background-color: #f3f4f6; padding: 20px; border-radius: 8px; display: inline-block;">
                ${otp}
              </div>
            </div>
            <p style="color: #666; font-size: 14px;">
              This code expires in 10 minutes. Never share this code with anyone.
            </p>
          `,
        }),
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      }
    }
  }

  /**
   * Send welcome email after successful registration
   */
  async sendWelcomeEmail(session: Session): Promise<EmailResult> {
    try {
      if (!resendClient) {
        console.log('Email service not configured - would send welcome email to:', session.user.email)
        return { success: true }
      }
      const { data, error } = await resendClient.emails.send({
        from: this.from,
        to: session.user.email!,
        subject: 'Welcome to DiscoverXYZ!',
        html: this.getEmailTemplate({
          title: 'Welcome to DiscoverXYZ!',
          content: `
            <p>Hi ${session.user.name || 'there'},</p>
            <p>Welcome to DiscoverXYZ! We're excited to have you join our community.</p>
            <p>Here are some things you can do to get started:</p>
            <ul style="margin: 20px 0; padding-left: 20px;">
              <li style="margin: 10px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/events" style="color: ${this.brandColor}; text-decoration: none;">
                  Browse Events
                </a> - Discover local events happening in your area
              </li>
              <li style="margin: 10px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/businesses" style="color: ${this.brandColor}; text-decoration: none;">
                  Explore Businesses
                </a> - Find local businesses and services
              </li>
              <li style="margin: 10px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/account" style="color: ${this.brandColor}; text-decoration: none;">
                  Manage Profile
                </a> - Complete your profile and preferences
              </li>
            </ul>
            <p>If you have any questions, feel free to reach out to our support team.</p>
          `,
        }),
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      }
    }
  }

  /**
   * Send account deletion confirmation
   */
  async sendAccountDeletedEmail(email: string): Promise<EmailResult> {
    try {
      if (!resendClient) {
        console.log('Email service not configured - would send account deleted email to:', email)
        return { success: true }
      }
      const { data, error } = await resendClient.emails.send({
        from: this.from,
        to: email,
        subject: 'Your DiscoverXYZ account has been deleted',
        html: this.getEmailTemplate({
          title: 'Account Deleted',
          content: `
            <p>Your DiscoverXYZ account has been successfully deleted.</p>
            <p>We're sorry to see you go. All your personal data has been removed from our systems.</p>
            <p style="margin-top: 20px;">
              If you change your mind, you can always create a new account at any time:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/sign-up" 
                 style="display: inline-block; background-color: ${this.brandColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Sign Up
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              Thank you for being part of our community.
            </p>
          `,
        }),
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      }
    }
  }

  /**
   * Get base email template
   */
  private getEmailTemplate({ title, content }: { title: string; content: string }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: ${this.brandColor}; margin: 0;">DiscoverXYZ</h1>
              </div>
              ${content}
            </div>
            <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
              <p>© 2024 DiscoverXYZ. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }
}

// Export singleton instance
export const emailService = new EmailService()