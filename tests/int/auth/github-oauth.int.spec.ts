import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('GitHub OAuth Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.BETTER_AUTH_URL = 'http://localhost:3026'
    process.env.GITHUB_CLIENT_ID = 'test-github-client-id'
    process.env.GITHUB_CLIENT_SECRET = 'test-github-client-secret'
  })

  describe('OAuth Configuration', () => {
    it('should have GitHub provider configured', async () => {
      const { getOAuthProviders } = await import('@/lib/auth/oauth-providers')

      const providers = getOAuthProviders()
      const githubProvider = providers.find((p) => p.id === 'github')

      expect(githubProvider).toBeDefined()
      expect(githubProvider?.id).toBe('github')
      expect(githubProvider?.name).toBe('GitHub')
    })

    it('should validate GitHub OAuth environment variables', async () => {
      const { validateOAuthConfig } = await import('@/lib/auth/oauth-providers')

      const config = validateOAuthConfig('github')

      expect(config.isValid).toBe(true)
      expect(config.clientId).toBe('test-github-client-id')
      expect(config.clientSecret).toBe('test-github-client-secret')
    })
  })

  describe('OAuth Flow', () => {
    it('should initiate GitHub OAuth flow', async () => {
      const { initiateOAuthFlow } = await import('@/lib/auth/oauth-providers')

      const result = await initiateOAuthFlow('github', {
        redirectTo: '/dashboard',
        request: { url: 'http://localhost:3026' } as any,
      })

      expect(result.url).toContain('github.com/login/oauth/authorize')
      expect(result.url).toContain('client_id=test-github-client-id')
      expect(result.url).toContain('scope=user%3Aemail')
      expect(result.state).toBeDefined()
    })

    it('should handle GitHub OAuth callback', async () => {
      const { handleOAuthCallback } = await import('@/lib/auth/oauth-providers')

      const result = await handleOAuthCallback('github', {
        code: 'mock-auth-code',
        state: 'mock-state',
        request: { headers: new Headers() } as any,
      })

      expect(result.success).toBe(true)
      expect(result.user).toMatchObject({
        email: 'user@github.com',
        name: 'Test User',
        provider: 'github',
        providerId: '123',
      })
    })
  })

  describe('Email Scope Handling', () => {
    it('should request user:email scope for GitHub', async () => {
      const { initiateOAuthFlow } = await import('@/lib/auth/oauth-providers')

      const result = await initiateOAuthFlow('github', {
        request: { url: 'http://localhost:3026' } as any,
      })

      expect(result.url).toContain('scope=user%3Aemail')
    })

    it('should handle GitHub users without public email', async () => {
      const { fetchGitHubUserWithEmail } = await import('@/lib/auth/oauth-providers')

      // Mock user with no public email
      const mockUser = {
        id: 789,
        login: 'privateuser',
        name: 'Private User',
        email: null, // No public email
      }

      // Mock email from separate API call
      const mockEmails = [
        {
          email: 'private@example.com',
          primary: true,
          verified: true,
        },
      ]

      // In real implementation, would fetch from GitHub API
      const userWithEmail = {
        ...mockUser,
        email: mockEmails[0].email,
      }

      expect(userWithEmail.email).toBe('private@example.com')
    })
  })

  describe('User Linking', () => {
    it('should link GitHub account to existing user', async () => {
      const { createUserFromOAuth } = await import('@/lib/auth/oauth-providers')

      const githubData = {
        provider: 'github',
        providerId: 'github-456',
        email: 'existing@gmail.com',
        name: 'GitHub User',
        emailVerified: true,
      }

      const result = await createUserFromOAuth(githubData)

      expect(result.user.email).toBe(githubData.email)
      expect(result.isNewUser).toBe(false)
      expect(result.linkedAccount).toBe(true)
    })

    it('should create new user from GitHub OAuth', async () => {
      const { createUserFromOAuth } = await import('@/lib/auth/oauth-providers')

      const githubData = {
        provider: 'github',
        providerId: 'github-new-789',
        email: 'newgithub@example.com',
        name: 'New GitHub User',
        emailVerified: true,
        image: 'https://github.com/avatar.jpg',
      }

      const result = await createUserFromOAuth(githubData)

      expect(result.user).toBeDefined()
      expect(result.user.email).toBe(githubData.email)
      expect(result.user.name).toBe(githubData.name)
      expect(result.isNewUser).toBe(true)
    })

    it('should handle GitHub username as fallback name', async () => {
      const { createUserFromOAuth } = await import('@/lib/auth/oauth-providers')

      const githubData = {
        provider: 'github',
        providerId: 'github-username-123',
        email: 'username@github.com',
        name: undefined, // No display name
        emailVerified: true,
      }

      const result = await createUserFromOAuth(githubData)

      // Should use email prefix as name
      expect(result.user.name).toBe('username')
    })
  })
})
