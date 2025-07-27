
export interface OAuthProvider {
  id: string
  name: string
  icon?: string
}

export interface OAuthConfig {
  isValid: boolean
  clientId?: string
  clientSecret?: string
  error?: string
}

export interface OAuthFlowResult {
  url: string
  state: string
}

export interface OAuthCallbackResult {
  success: boolean
  user?: any
  error?: string
}

export interface OAuthUserData {
  provider: string
  providerId: string
  email: string
  name?: string
  emailVerified?: boolean
  image?: string
}

export interface CreateUserResult {
  user: any
  isNewUser: boolean
  linkedAccount?: boolean
}

/**
 * Get configured OAuth providers
 */
export function getOAuthProviders(): OAuthProvider[] {
  const providers: OAuthProvider[] = []

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push({
      id: 'google',
      name: 'Google',
      icon: 'google',
    })
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    providers.push({
      id: 'github',
      name: 'GitHub',
      icon: 'github',
    })
  }

  return providers
}

/**
 * Validate OAuth configuration for a provider
 */
export function validateOAuthConfig(provider: string): OAuthConfig {
  switch (provider) {
    case 'google':
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return {
          isValid: false,
          error: 'Missing Google OAuth configuration',
        }
      }
      return {
        isValid: true,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }
    
    case 'github':
      if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
        return {
          isValid: false,
          error: 'Missing GitHub OAuth configuration',
        }
      }
      return {
        isValid: true,
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      }
    
    default:
      return {
        isValid: false,
        error: `Unknown provider: ${provider}`,
      }
  }
}

/**
 * Initiate OAuth flow
 */
export async function initiateOAuthFlow(
  provider: string,
  options: {
    redirectTo?: string
    request: Request
  }
): Promise<OAuthFlowResult> {
  const config = validateOAuthConfig(provider)
  if (!config.isValid) {
    throw new Error(config.error)
  }

  // Generate state for CSRF protection
  const state = generateState(options.redirectTo)

  // Build OAuth URL based on provider
  let authUrl: string
  const redirectUri = `${process.env.BETTER_AUTH_URL || 'http://localhost:3026'}/api/auth/callback/${provider}`

  switch (provider) {
    case 'google':
      const googleParams = new URLSearchParams({
        client_id: config.clientId!,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'email profile',
        state,
        access_type: 'offline',
        prompt: 'consent',
      })
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${googleParams}`
      break

    case 'github':
      const githubParams = new URLSearchParams({
        client_id: config.clientId!,
        redirect_uri: redirectUri,
        scope: 'user:email',
        state,
      })
      authUrl = `https://github.com/login/oauth/authorize?${githubParams}`
      break

    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }

  return {
    url: authUrl,
    state,
  }
}

/**
 * Handle OAuth callback
 */
export async function handleOAuthCallback(
  provider: string,
  params: {
    code?: string
    state?: string
    error?: string
    error_description?: string
    request: Request
  }
): Promise<OAuthCallbackResult> {
  // Check for errors
  if (params.error) {
    return {
      success: false,
      error: `${params.error}: ${params.error_description || 'OAuth error'}`,
    }
  }

  if (!params.code) {
    return {
      success: false,
      error: 'Missing authorization code',
    }
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(provider, params.code)
    
    // Get user info from provider
    let userData: OAuthUserData
    
    switch (provider) {
      case 'google':
        const googleUser = await fetchGoogleUserInfo(tokens.access_token)
        userData = {
          provider: 'google',
          providerId: googleUser.id,
          email: googleUser.email,
          name: googleUser.name,
          emailVerified: googleUser.verified_email,
          image: googleUser.picture,
        }
        break

      case 'github':
        const githubUser = await fetchGitHubUserInfo(tokens.access_token)
        userData = {
          provider: 'github',
          providerId: githubUser.id.toString(),
          email: githubUser.email,
          name: githubUser.name || githubUser.login,
          emailVerified: true, // GitHub verifies emails
          image: githubUser.avatar_url,
        }
        break

      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }

    return {
      success: true,
      user: userData,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'OAuth callback failed',
    }
  }
}

/**
 * Create or update user from OAuth data
 */
export async function createUserFromOAuth(
  oauthData: OAuthUserData
): Promise<CreateUserResult> {
  // For now, return mock data - will integrate with Better Auth
  const mockUser = {
    id: `${oauthData.provider}-${oauthData.providerId}`,
    email: oauthData.email,
    name: oauthData.name || oauthData.email.split('@')[0],
    emailVerified: oauthData.emailVerified || false,
    image: oauthData.image,
    role: 'authenticated',
  }

  // Check if user exists
  const existingUser = await findUserByEmail(oauthData.email)
  
  if (existingUser) {
    return {
      user: {
        ...existingUser,
        // Preserve existing role
        role: existingUser.role,
      },
      isNewUser: false,
      linkedAccount: true,
    }
  }

  return {
    user: mockUser,
    isNewUser: true,
  }
}

/**
 * Handle OAuth login - create session
 */
export async function handleOAuthLogin(
  user: any,
  options: {
    request: Request
    response: Response
  }
): Promise<{ session: any }> {
  // Create session
  const session = {
    id: `session-${Date.now()}`,
    userId: user.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  }

  // In real implementation, use Better Auth's session management
  // For now, return mock session
  return { session }
}

// Helper functions

function generateState(redirectTo?: string): string {
  const random = Math.random().toString(36).substring(2, 15)
  const data = redirectTo ? `${random}:${redirectTo}` : random
  return Buffer.from(data).toString('base64url')
}

async function exchangeCodeForTokens(provider: string, code: string): Promise<any> {
  const config = validateOAuthConfig(provider)
  if (!config.isValid) {
    throw new Error(config.error)
  }

  const redirectUri = `${process.env.BETTER_AUTH_URL || 'http://localhost:3026'}/api/auth/callback/${provider}`

  switch (provider) {
    case 'google': {
      const params = new URLSearchParams({
        code,
        client_id: config.clientId!,
        client_secret: config.clientSecret!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      })

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Token exchange failed: ${error}`)
      }

      return response.json()
    }

    case 'github': {
      const params = new URLSearchParams({
        code,
        client_id: config.clientId!,
        client_secret: config.clientSecret!,
        redirect_uri: redirectUri,
      })

      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: params.toString(),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Token exchange failed: ${error}`)
      }

      return response.json()
    }

    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }
}

async function fetchGoogleUserInfo(accessToken: string): Promise<any> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch user info from Google')
  }

  return response.json()
}

async function fetchGitHubUserInfo(accessToken: string): Promise<any> {
  // Mock implementation - in real app, make HTTP request to GitHub
  return {
    id: 123,
    login: 'testuser',
    email: 'user@github.com',
    name: 'Test User',
    avatar_url: 'https://github.com/avatar.jpg',
  }
}

async function findUserByEmail(email: string): Promise<any> {
  // Mock implementation - will use Payload find
  if (email === 'existing@gmail.com') {
    return {
      id: 'existing-user-id',
      email: 'existing@gmail.com',
      name: 'Existing User',
      role: 'authenticated',
    }
  }
  
  if (email === 'admin@gmail.com') {
    return {
      id: 'admin-id',
      email: 'admin@gmail.com',
      name: 'Admin User',
      role: 'admin',
    }
  }
  
  return null
}

export async function fetchGitHubUserWithEmail(accessToken: string): Promise<any> {
  // Mock implementation - in real app, would fetch user and emails from GitHub API
  return {
    id: 789,
    login: 'privateuser',
    name: 'Private User',
    email: 'private@example.com',
    avatar_url: 'https://github.com/avatar.jpg',
  }
}