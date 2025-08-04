// storage-adapter-import-placeholder
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { betterAuthPlugin } from 'payload-auth/better-auth'

import sharp from 'sharp' // sharp-import
import path from 'path'
import { buildConfig, PayloadRequest, APIError } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { AllowedUsers } from './collections/AllowedUsers'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Articles } from './collections/Articles'
import { Events } from './collections/Events'
import { Profiles } from './collections/Profiles'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'
import {
  importFedSyncEndpoint,
  importFedSyncStatusEndpoint,
} from './payload/endpoints/import-fedsync'
import { createBetterAuthOptions } from './lib/better-auth/auth-options'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const config = buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3026',
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeDashboard: ['@/components/BeforeDashboard'],
      // Custom navigation links
      afterNavLinks: ['@/components/CustomNavLinks'],
      views: {
        fedSyncImport: {
          Component: '@/admin/views/FedSyncImportView#default',
          path: '/fedsync-import',
        },
        importJobStatus: {
          Component: '@/admin/views/ImportJobStatusView#default',
          path: '/import-job-status',
        },
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: 'users',
    // White-label meta configuration
    meta: {
      titleSuffix: `- ${process.env.SITE_NAME || 'Payload CMS'} Admin`,
    },
    // Admin panel theme
    theme: 'all', // 'all', 'light', or 'dark'
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  collections: [Pages, Articles, Media, Categories, AllowedUsers, Events, Profiles],
  cors: (() => {
    const allowedOrigins = [
      getServerSideURL(),
      process.env.NEXT_PUBLIC_APP_URL,
      // Add production domains
      process.env.PRODUCTION_URL,
      // Development origins
      process.env.NODE_ENV === 'development' ? 'http://localhost:3026' : null,
      process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
    ].filter(Boolean) as string[]
    
    // Remove duplicates
    return [...new Set(allowedOrigins)]
  })(),
  globals: [Header, Footer],
  plugins: [
    ...plugins,
    betterAuthPlugin({
      betterAuthOptions: createBetterAuthOptions(),
      hidePluginCollections: true, // Hide system collections by default
      disableDefaultPayloadAuth: true, // Use Better Auth exclusively like example
      users: {
        slug: 'users',
        hidden: false, // Keep users visible in admin like example
        adminRoles: ['admin', 'content-editor'], // Allow content-editor to access admin panel
        allowedFields: ['name', 'role'], // Allow role field but with admin-only access
        blockFirstBetterAuthVerificationEmail: true, // Prevent duplicate emails like example
        collectionOverrides: ({ collection }) => ({
          ...collection,
          // Match example pattern - preserve auth config
          auth: {
            ...(typeof collection?.auth === 'object' ? collection.auth : {}),
          },
          hooks: {
            beforeChange: [
              async ({ data, operation, req }) => {
                // Only check on create (new users)
                if (operation === 'create' && data.email && req.payload) {
                  try {
                    // Check if this is the first user (no users exist yet)
                    const userCount = await req.payload.count({
                      collection: 'users',
                    })

                    // If no users exist, allow the first user to be created as admin
                    if (userCount.totalDocs === 0) {
                      console.log('Creating first admin user:', data.email)
                      data.role = 'admin'
                      return data
                    }


                    const { findMatchingPattern } = await import('@/utils/email-matcher')

                    // Check if email matches any allowed pattern
                    const matchingPattern = await findMatchingPattern(data.email, req.payload)

                    if (!matchingPattern) {
                      throw new APIError(
                        'Access denied. Your email is not authorized for SSO access. ' +
                          'Please contact an administrator to request access.',
                        403,
                      )
                    }

                    // Set role based on the matching pattern
                    data.role = matchingPattern.defaultRole || 'authenticated'
                    data.allowedPattern = matchingPattern.id

                    // Update the pattern's usage stats
                    await req.payload.update({
                      collection: 'allowed-users',
                      id: matchingPattern.id,
                      data: {
                        matchCount: (matchingPattern.matchCount || 0) + 1,
                        lastMatched: new Date(),
                      },
                    })
                  } catch (error) {
                    console.error('Error in beforeChange hook:', error)
                    throw error
                  }
                }

                return data
              },
            ],
            beforeLogin: [
              async ({ user, req }) => {
                if (req.payload && user.email) {
                  try {
                    const { findMatchingPattern } = await import('@/utils/email-matcher')

                    // Double-check on every login that the user is still allowed
                    const stillAllowed = await findMatchingPattern(user.email, req.payload)

                    if (!stillAllowed) {
                      throw new APIError(
                        'Your access has been revoked. Please contact an administrator.',
                        403,
                      )
                    }

                    // Update last matched timestamp
                    await req.payload.update({
                      collection: 'allowed-users',
                      id: stillAllowed.id,
                      data: { lastMatched: new Date() },
                    })
                  } catch (error) {
                    console.error('Error in beforeLogin hook:', error)
                    throw error
                  }
                }

                return user
              },
            ],
          },
          // Restrict access to users collection - admins can manage all, users can manage themselves
          access: {
            create: ({ req: { user } }) => user?.role === 'admin',
            delete: ({ req: { user } }) => {
              if (user?.role === 'admin') return true
              // Users can delete their own account
              return {
                id: {
                  equals: user?.id,
                },
              }
            },
            read: ({ req: { user } }) => {
              if (user?.role === 'admin') return true
              // Users can read their own profile
              return {
                id: {
                  equals: user?.id,
                },
              }
            },
            update: ({ req: { user } }) => {
              if (user?.role === 'admin') return true
              // Users can update their own profile
              return {
                id: {
                  equals: user?.id,
                },
              }
            },
          },
          fields: [
            ...(collection.fields || []).map((field) => {
              // Add admin-only access control to the role field
              if (field.type === 'select' && field.name === 'role') {
                return {
                  ...field,
                  access: {
                    create: ({ req: { user } }) => user?.role === 'admin',
                    update: ({ req: { user } }) => user?.role === 'admin',
                  },
                }
              }
              return field
            }),
            // Add allowedPattern field
            {
              name: 'allowedPattern',
              type: 'relationship',
              relationTo: 'allowed-users',
              admin: {
                readOnly: true,
                description: 'The pattern that authorized this user',
              },
            },
          ],
        }),
      },
      // Define collection slugs and restrict all to admin-only access
      accounts: {
        slug: 'accounts',
        hidden: false,
        collectionOverrides: ({ collection }) => ({
          ...collection,
          access: {
            create: ({ req: { user } }) => user?.role === 'admin',
            read: ({ req: { user } }) => user?.role === 'admin',
            update: ({ req: { user } }) => user?.role === 'admin',
            delete: ({ req: { user } }) => user?.role === 'admin',
          },
          admin: {
            ...collection.admin,
            hidden: ({ user }) => user?.role !== 'admin',
          },
        }),
      },
      sessions: {
        slug: 'sessions',
        hidden: false,
        collectionOverrides: ({ collection }) => ({
          ...collection,
          access: {
            create: ({ req: { user } }) => user?.role === 'admin',
            read: ({ req: { user } }) => user?.role === 'admin',
            update: ({ req: { user } }) => user?.role === 'admin',
            delete: ({ req: { user } }) => user?.role === 'admin',
          },
          admin: {
            ...collection.admin,
            hidden: ({ user }) => user?.role !== 'admin',
          },
        }),
      },
      verifications: {
        slug: 'verifications',
        hidden: false,
        collectionOverrides: ({ collection }) => ({
          ...collection,
          access: {
            create: ({ req: { user } }) => user?.role === 'admin',
            read: ({ req: { user } }) => user?.role === 'admin',
            update: ({ req: { user } }) => user?.role === 'admin',
            delete: ({ req: { user } }) => user?.role === 'admin',
          },
          admin: {
            ...collection.admin,
            hidden: ({ user }) => user?.role !== 'admin',
          },
        }),
      },
      adminInvitations: {
        slug: 'admin-invitations',
        hidden: false,
        collectionOverrides: ({ collection }) => ({
          ...collection,
          access: {
            create: ({ req: { user } }) => user?.role === 'admin',
            read: ({ req: { user } }) => user?.role === 'admin',
            update: ({ req: { user } }) => user?.role === 'admin',
            delete: ({ req: { user } }) => user?.role === 'admin',
          },
          admin: {
            ...collection.admin,
            hidden: ({ user }) => user?.role !== 'admin',
          },
        }),
      },
      // Organizations plugin collections
      organizations: {
        slug: 'organizations',
        hidden: false,
        collectionOverrides: ({ collection }) => ({
          ...collection,
          access: {
            create: ({ req: { user } }) => user?.role === 'admin',
            read: ({ req: { user } }) => user?.role === 'admin',
            update: ({ req: { user } }) => user?.role === 'admin',
            delete: ({ req: { user } }) => user?.role === 'admin',
          },
          admin: {
            ...collection.admin,
            hidden: ({ user }) => user?.role !== 'admin',
          },
        }),
      },
      members: {
        slug: 'members',
        hidden: false,
        collectionOverrides: ({ collection }) => ({
          ...collection,
          access: {
            create: ({ req: { user } }) => user?.role === 'admin',
            read: ({ req: { user } }) => user?.role === 'admin',
            update: ({ req: { user } }) => user?.role === 'admin',
            delete: ({ req: { user } }) => user?.role === 'admin',
          },
          admin: {
            ...collection.admin,
            hidden: ({ user }) => user?.role !== 'admin',
          },
        }),
      },
      invitations: {
        slug: 'invitations',
        hidden: false,
        collectionOverrides: ({ collection }) => ({
          ...collection,
          access: {
            create: ({ req: { user } }) => user?.role === 'admin',
            read: ({ req: { user } }) => user?.role === 'admin',
            update: ({ req: { user } }) => user?.role === 'admin',
            delete: ({ req: { user } }) => user?.role === 'admin',
          },
          admin: {
            ...collection.admin,
            hidden: ({ user }) => user?.role !== 'admin',
          },
        }),
      },
      // Two-factor plugin collection
      twoFactors: {
        slug: 'twoFactors',
        hidden: false,
        collectionOverrides: ({ collection }) => ({
          ...collection,
          access: {
            create: ({ req: { user } }) => user?.role === 'admin',
            read: ({ req: { user } }) => user?.role === 'admin',
            update: ({ req: { user } }) => user?.role === 'admin',
            delete: ({ req: { user } }) => user?.role === 'admin',
          },
          admin: {
            ...collection.admin,
            hidden: ({ user }) => user?.role !== 'admin',
          },
        }),
      },
      // Passkey plugin collection
      passkeys: {
        slug: 'passkeys',
        hidden: false,
        collectionOverrides: ({ collection }) => ({
          ...collection,
          access: {
            create: ({ req: { user } }) => user?.role === 'admin',
            read: ({ req: { user } }) => user?.role === 'admin',
            update: ({ req: { user } }) => user?.role === 'admin',
            delete: ({ req: { user } }) => user?.role === 'admin',
          },
          admin: {
            ...collection.admin,
            hidden: ({ user }) => user?.role !== 'admin',
          },
        }),
      },
    }),
    // storage-adapter-placeholder
  ],
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  endpoints: [importFedSyncEndpoint, importFedSyncStatusEndpoint],
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${process.env.CRON_SECRET}`
      },
    },
    tasks: [],
  },
})

export default config
