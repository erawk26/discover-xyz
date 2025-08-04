import { vi } from 'vitest'

// Create mock auth client
export const mockAuthClient = {
  signIn: {
    email: vi.fn(),
    social: vi.fn(),
    magicLink: vi.fn(),
    emailOTP: vi.fn(),
  },
  signUp: {
    email: vi.fn(),
    social: vi.fn(),
  },
  signOut: vi.fn(),
  getSession: vi.fn(),
  twoFactor: {
    verifyTotp: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
  },
  magicLink: {
    signIn: vi.fn(),
    verify: vi.fn(),
  },
  passkey: {
    register: vi.fn(),
    authenticate: vi.fn(),
  },
  phoneNumber: {
    sendOtp: vi.fn(),
    verifyOtp: vi.fn(),
  },
  organization: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  useSession: vi.fn(),
  useListOrganizations: vi.fn(),
  useActiveOrganization: vi.fn(),
}

// Mock the module BEFORE any other imports
vi.mock('@/lib/better-auth/client', () => ({
  authClient: mockAuthClient,
  signIn: mockAuthClient.signIn,
  signUp: mockAuthClient.signUp,
  signOut: mockAuthClient.signOut,
  twoFactor: mockAuthClient.twoFactor,
  magicLink: mockAuthClient.magicLink,
  passkey: mockAuthClient.passkey,
  phoneNumber: mockAuthClient.phoneNumber,
  organization: mockAuthClient.organization,
  useSession: mockAuthClient.useSession,
  useListOrganizations: mockAuthClient.useListOrganizations,
  useActiveOrganization: mockAuthClient.useActiveOrganization,
}))