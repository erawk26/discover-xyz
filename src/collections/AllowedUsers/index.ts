import type { CollectionConfig } from 'payload'

export const AllowedUsers: CollectionConfig = {
  slug: 'allowed-users',
  admin: {
    useAsTitle: 'pattern',
    defaultColumns: ['pattern', 'type', 'description', 'addedByDisplay', 'matchCount'],
    listSearchableFields: ['pattern', 'description', 'addedByEmail'],
    description: 'Manage which email patterns are allowed to sign up',
    group: 'Admin',
    components: {
      beforeList: ['@/components/admin/PatternTester', '@/components/admin/QuickPatterns'],
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
        description: 'User who added this pattern',
      },
    },
    {
      name: 'addedByEmail',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Email of user who added this pattern (fallback)',
      },
    },
    {
      name: 'addedVia',
      type: 'select',
      options: [
        { label: 'Admin Panel', value: 'admin' },
        { label: 'SSO Login', value: 'sso' },
        { label: 'System', value: 'system' },
        { label: 'Import', value: 'import' },
      ],
      defaultValue: 'admin',
      admin: {
        readOnly: true,
        description: 'How this pattern was added',
      },
    },
    {
      name: 'addedAt',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'addedByDisplay',
      label: 'Added By',
      type: 'text',
      virtual: true,
      admin: {
        description: 'Display name for who added this pattern',
        components: {
          Field: '@/collections/AllowedUsers/components/HiddenField#HiddenField',
        },
      },
      hooks: {
        afterRead: [
          ({ data, req }) => {
            if (!data) return null
            
            // If we have a related user with data
            if (data.addedBy?.email) {
              return data.addedBy.name || data.addedBy.email
            }
            
            // Fallback to email
            if (data.addedByEmail) {
              return data.addedByEmail
            }
            
            // Show how it was added
            const viaLabels = {
              sso: 'SSO Auto-created',
              system: 'System',
              import: 'System Import',
              admin: 'Admin Panel',
            }
            
            if (data.addedVia && viaLabels[data.addedVia as keyof typeof viaLabels]) {
              return viaLabels[data.addedVia as keyof typeof viaLabels]
            }
            
            return 'Unknown'
          },
        ],
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ req, operation, data }) => {
        if (operation === 'create') {
          // Set who added this pattern
          if (req.user) {
            data.addedBy = req.user.id
            data.addedByEmail = req.user.email
            data.addedVia = 'admin' // Default to admin panel
          } else {
            // Handle cases where there's no authenticated user (e.g., system imports)
            data.addedVia = 'system'
          }
          
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