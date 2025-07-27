import { auth } from '@/lib/auth'

export interface AuthResult {
  success: boolean
  user?: {
    id: string
    email: string
    name?: string
  }
  session?: {
    token: string
    expiresAt: Date
  }
  error?: string
}

/**
 * Login with email and password
 */
export async function login(credentials: { email: string; password: string }): Promise<AuthResult> {
  try {
    // For now, using mock authentication
    // TODO: Integrate with Better Auth's signInEmail method
    
    // Mock validation
    if (credentials.email === 'admin@test.com' && credentials.password === 'Admin123!') {
      return {
        success: true,
        user: {
          id: 'test-admin-id',
          email: credentials.email,
          name: 'Test Admin'
        },
        session: {
          token: `session-${Date.now()}`,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      }
    }

    return {
      success: false,
      error: 'Invalid credentials'
    }
  } catch (error) {
    return {
      success: false,
      error: 'Authentication failed'
    }
  }
}

/**
 * Logout and clear session
 */
export async function logout(sessionToken: string): Promise<{ success: boolean }> {
  try {
    // TODO: Integrate with Better Auth's session clearing
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}

/**
 * Register new user
 */
export async function register(userData: {
  email: string
  password: string
  name: string
}): Promise<AuthResult> {
  try {
    // Validate password
    if (userData.password.length < 8) {
      return {
        success: false,
        error: 'Password must be at least 8 characters'
      }
    }

    // Check if email exists (mock)
    if (userData.email === 'admin@test.com') {
      return {
        success: false,
        error: 'Email already exists'
      }
    }

    // TODO: Integrate with Better Auth's signUpEmail method
    return {
      success: true,
      user: {
        id: `user-${Date.now()}`,
        email: userData.email,
        name: userData.name
      }
    }
  } catch (error) {
    return {
      success: false,
      error: 'Registration failed'
    }
  }
}