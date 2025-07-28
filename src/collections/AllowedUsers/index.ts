import type { CollectionConfig } from 'payload'
import { PatternTester } from '@/components/admin/PatternTester'
import { QuickPatterns } from '@/components/admin/QuickPatterns'

export const AllowedUsers: CollectionConfig = {
  slug: 'allowed-users',
  admin: {
    useAsTitle: 'pattern',
    defaultColumns: ['pattern', 'type', 'description', 'addedBy', 'matchCount'],
    group: 'Admin',
    components: {
      beforeList: [PatternTester, QuickPatterns],
    },
  },
  access: {
    // Only admins can manage the allowlist
    read: ({ req: { user } }) => user?.role === 'admin',
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'pattern',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Email or pattern (e.g., user@example.com, *@company.com, team-*@company.com)',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'exact',
      options: [
        { label: 'Exact Email', value: 'exact' },
        { label: 'Wildcard Pattern', value: 'wildcard' },
      ],
      admin: {
        description: 'Whether this is an exact email or a wildcard pattern',
      },
    },
    {
      name: 'defaultRole',
      type: 'select',
      required: true,
      defaultValue: 'authenticated',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Content Editor', value: 'content-editor' },
        { label: 'Authenticated', value: 'authenticated' },
      ],
      admin: {
        description: 'Role to assign to users matching this pattern',
      },
    },
    {
      name: 'description',
      type: 'text',
      admin: {
        description: 'Description of who this allows (e.g., "All employees", "Engineering team")',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes',
      },
    },
    {
      name: 'matchCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: 'Number of users who have signed up matching this pattern',
      },
    },
    {
      name: 'lastMatched',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'Last time this pattern was matched',
      },
    },
    {
      name: 'addedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'addedAt',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ req, operation, data }) => {
        if (operation === 'create') {
          data.addedBy = req.user?.id
          data.addedAt = new Date()
          
          // Auto-detect type based on pattern
          if (data.pattern && !data.type) {
            data.type = data.pattern.includes('*') ? 'wildcard' : 'exact'
          }
        }
        return data
      },
    ],
  },
}