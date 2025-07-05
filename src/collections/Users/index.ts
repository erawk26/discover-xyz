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
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
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
