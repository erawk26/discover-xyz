import { describe, it, expect, beforeEach } from 'vitest'
import { testUsers } from './fixtures/users'

describe('Authentication', () => {
  describe('Login', () => {
    it('should login with valid credentials', async () => {
      const { login } = await import('@/lib/auth/authentication')
      
      const result = await login({
        email: testUsers.admin.email,
        password: testUsers.admin.password
      })

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user?.email).toBe(testUsers.admin.email)
      expect(result.session).toBeDefined()
    })

    it('should fail login with invalid password', async () => {
      const { login } = await import('@/lib/auth/authentication')
      
      const result = await login({
        email: testUsers.admin.email,
        password: 'wrong-password'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.user).toBeUndefined()
    })

    it('should fail login with non-existent email', async () => {
      const { login } = await import('@/lib/auth/authentication')
      
      const result = await login({
        email: 'nonexistent@test.com',
        password: 'any-password'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('Logout', () => {
    it('should clear session on logout', async () => {
      const { logout } = await import('@/lib/auth/authentication')
      
      const result = await logout('test-session-token')
      
      expect(result.success).toBe(true)
    })
  })

  describe('Registration', () => {
    it('should register new user with valid data', async () => {
      const { register } = await import('@/lib/auth/authentication')
      
      const newUser = {
        email: 'newuser@test.com',
        password: 'NewUser123!',
        name: 'New User'
      }

      const result = await register(newUser)

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user?.email).toBe(newUser.email)
    })

    it('should fail registration with existing email', async () => {
      const { register } = await import('@/lib/auth/authentication')
      
      const result = await register({
        email: testUsers.admin.email,
        password: 'AnyPassword123!',
        name: 'Duplicate User'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('exists')
    })

    it('should validate password requirements', async () => {
      const { register } = await import('@/lib/auth/authentication')
      
      const result = await register({
        email: 'weak@test.com',
        password: 'weak',
        name: 'Weak Password'
      })

      expect(result.success).toBe(false)
      expect(result.error?.toLowerCase()).toContain('password')
    })
  })
})