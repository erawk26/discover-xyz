import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { adminOnly } from '../../access/adminOnly'
import { adminOnlyField } from '../../access/fieldAccess'
import { UserRole } from '../../access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: authenticated,
    create: adminOnly,
    delete: adminOnly,
    read: authenticated,
    update: ({ req: { user } }) => {
      // Users can update their own profile, admins can update anyone
      if (user?.role === UserRole.ADMIN) return true
      return {
        id: {
          equals: user?.id,
        },
      }
    },
  },
  admin: {
    defaultColumns: ['name', 'email', 'role'],
    useAsTitle: 'name',
  },
  auth: {
    // Allow OAuth users without passwords
    disableLocalStrategy: false,
    tokenExpiration: 7 * 24 * 60 * 60, // 7 days
    verify: false, // Disable email verification for OAuth users
    maxLoginAttempts: 0, // Disable brute force protection for OAuth
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: undefined,
    },
  },
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        if (data) {
          // Check if this is the first user being created
          const userCount = await req.payload.count({
            collection: 'users',
          })
          
          // If no users exist, make this user an admin
          if (userCount.totalDocs === 0) {
            data.role = UserRole.ADMIN
          }
          
          // For OAuth users, generate a secure password if not provided
          if (data.oauth_provider && !data.password) {
            const crypto = await import('crypto')
            data.password = crypto.randomBytes(32).toString('hex')
          }
        }
        
        return data
      },
    ],
    afterLogin: [
      async ({ user, token }) => {
        console.log('User logged in:', { email: user.email, role: user.role, hasToken: !!token })
        return { user, token }
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    // Make password optional for OAuth users
    {
      name: 'password',
      type: 'text',
      required: false,
      admin: {
        condition: ({ data }) => !data?.oauth_provider,
      },
    },
    {
      name: 'oauth_provider',
      type: 'text',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'oauth_id',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: UserRole.AUTHENTICATED,
      access: {
        create: adminOnlyField,
        update: adminOnlyField,
      },
      options: [
        {
          label: 'Admin',
          value: UserRole.ADMIN,
        },
        {
          label: 'Site Builder',
          value: UserRole.SITE_BUILDER,
        },
        {
          label: 'Content Editor',
          value: UserRole.CONTENT_EDITOR,
        },
        {
          label: 'Authenticated User',
          value: UserRole.AUTHENTICATED,
        },
      ],
    },
  ],
  timestamps: true,
}
