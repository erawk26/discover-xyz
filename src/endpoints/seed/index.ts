import type { CollectionSlug, GlobalSlug, Payload, PayloadRequest, File } from 'payload'

import { contactForm as contactFormData } from './contact-form'
import { contact as contactPageData } from './contact-page'
import { home } from './home'
import { image1 } from './image-1'
import { image2 } from './image-2'
import { imageHero1 } from './image-hero-1'
import { article1 } from './article-1'
import { article2 } from './article-2'
import { article3 } from './article-3'

const collections: CollectionSlug[] = [
  'categories',
  'media',
  'pages',
  'articles',
  'forms',
  'form-submissions',
  'search',
  'allowed-users',
]
const globals: GlobalSlug[] = ['header', 'footer']

// Next.js revalidation errors are normal when seeding the database without a server running
// i.e. running `yarn seed` locally instead of using the admin UI within an active app
// The app is not running to revalidate the pages and so the API routes are not available
// These error messages can be ignored: `Error hitting revalidate route for...`
export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Seeding database...')

  // we need to clear the media directory before seeding
  // as well as the collections and globals
  // this is because while `yarn seed` drops the database
  // the custom `/api/seed` endpoint does not
  payload.logger.info(`— Clearing collections and globals...`)

  // clear the database
  await Promise.all(
    globals.map((global) =>
      payload.updateGlobal({
        slug: global,
        data: {
          navItems: [],
        },
        depth: 0,
        context: {
          disableRevalidate: true,
        },
      }),
    ),
  )

  // Clear all collections except users to preserve first-user logic
  await Promise.all(
    collections
      .filter((collection) => collection !== 'users')
      .map((collection) => payload.db.deleteMany({ collection, req, where: {} })),
  )

  await Promise.all(
    collections
      .filter((collection) => Boolean(payload.collections[collection].config.versions))
      .map((collection) => payload.db.deleteVersions({ collection, req, where: {} })),
  )

  payload.logger.info(`— Seeding allowed users patterns...`)

  // Seed some default allowed-users patterns
  await Promise.all([
    payload.create({
      collection: 'allowed-users',
      data: {
        pattern: 'erawk26@gmail.com',
        type: 'exact',
        defaultRole: 'admin',
        description: 'Primary admin',
        addedVia: 'system',
        addedAt: new Date().toISOString(),
        notes: 'Seeded admin user',
      },
    }),
    payload.create({
      collection: 'allowed-users',
      data: {
        pattern: '*@milespartnership.com',
        type: 'wildcard',
        defaultRole: 'content-editor',
        description: 'All Miles Partnership employees',
        addedVia: 'system',
        addedAt: new Date().toISOString(),
        notes: 'Company-wide access pattern',
      },
    }),
    payload.create({
      collection: 'allowed-users',
      data: {
        pattern: `*@${process.env.SITE_DOMAIN || 'example.com'}`,
        type: 'wildcard',
        defaultRole: 'content-editor',
        description: 'Example domain for testing',
        addedVia: 'system',
        addedAt: new Date().toISOString(),
        notes: 'Wildcard pattern for site email domain',
      },
    }),
  ])

  payload.logger.info(`— Using authenticated admin as author...`)

  // Use the current admin user as the author for seeded content
  // This is more secure than creating a bypass user
  const currentUser = req.user

  if (!currentUser) {
    throw new Error('No authenticated user found for seeding')
  }

  payload.logger.info(`— Using ${currentUser.email} as content author`)

  payload.logger.info(`— Seeding media...`)

  const [image1Buffer, image2Buffer, image3Buffer, hero1Buffer] = await Promise.all([
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post1.webp',
    ),
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post2.webp',
    ),
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post3.webp',
    ),
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-hero1.webp',
    ),
  ])

  const [image1Doc, image2Doc, image3Doc, imageHomeDoc] = await Promise.all([
    payload.create({
      collection: 'media',
      data: image1,
      file: image1Buffer,
    }),
    payload.create({
      collection: 'media',
      data: image2,
      file: image2Buffer,
    }),
    payload.create({
      collection: 'media',
      data: image2,
      file: image3Buffer,
    }),
    payload.create({
      collection: 'media',
      data: imageHero1,
      file: hero1Buffer,
    }),

    payload.create({
      collection: 'categories',
      data: {
        title: 'Technology',
        type: 'category',
        breadcrumbs: [
          {
            label: 'Technology',
            url: '/technology',
          },
        ],
      },
    }),

    payload.create({
      collection: 'categories',
      data: {
        title: 'News',
        type: 'category',
        breadcrumbs: [
          {
            label: 'News',
            url: '/news',
          },
        ],
      },
    }),

    payload.create({
      collection: 'categories',
      data: {
        title: 'Finance',
        type: 'category',
        breadcrumbs: [
          {
            label: 'Finance',
            url: '/finance',
          },
        ],
      },
    }),
    payload.create({
      collection: 'categories',
      data: {
        title: 'Design',
        type: 'category',
        breadcrumbs: [
          {
            label: 'Design',
            url: '/design',
          },
        ],
      },
    }),

    payload.create({
      collection: 'categories',
      data: {
        title: 'Software',
        type: 'category',
        breadcrumbs: [
          {
            label: 'Software',
            url: '/software',
          },
        ],
      },
    }),

    payload.create({
      collection: 'categories',
      data: {
        title: 'Engineering',
        type: 'category',
        breadcrumbs: [
          {
            label: 'Engineering',
            url: '/engineering',
          },
        ],
      },
    }),
  ])

  payload.logger.info(`— Seeding articles...`)

  // Do not create articles with `Promise.all` because we want the articles to be created in order
  // This way we can sort them by `createdAt` or `publishedAt` and they will be in the expected order
  const _post1Doc = await payload.create({
    collection: 'articles',
    depth: 0,
    context: {
      disableRevalidate: true,
    },
    data: article1({ heroImage: image1Doc, blockImage: image2Doc, author: currentUser }),
  })

  const _post2Doc = await payload.create({
    collection: 'articles',
    depth: 0,
    context: {
      disableRevalidate: true,
    },
    data: article2({ heroImage: image2Doc, blockImage: image3Doc, author: currentUser }),
  })

  const _post3Doc = await payload.create({
    collection: 'articles',
    depth: 0,
    context: {
      disableRevalidate: true,
    },
    data: article3({ heroImage: image3Doc, blockImage: image1Doc, author: currentUser }),
  })

  // Note: Related articles functionality would need to be added to the Articles collection schema
  // if needed in the future

  payload.logger.info(`— Seeding contact form...`)

  const contactForm = await payload.create({
    collection: 'forms',
    depth: 0,
    context: {
      disableRevalidate: true,
    },
    data: contactFormData,
  })

  payload.logger.info(`— Seeding pages...`)

  const [_, contactPage] = await Promise.all([
    payload.create({
      collection: 'pages',
      depth: 0,
      context: {
        disableRevalidate: true,
      },
      data: home({ heroImage: imageHomeDoc, metaImage: image2Doc }),
    }),
    payload.create({
      collection: 'pages',
      depth: 0,
      context: {
        disableRevalidate: true,
      },
      data: contactPageData({ contactForm: contactForm }),
    }),
  ])

  payload.logger.info(`— Seeding globals...`)

  await Promise.all([
    payload.updateGlobal({
      slug: 'header',
      context: {
        disableRevalidate: true,
      },
      data: {
        navItems: [
          {
            link: {
              type: 'custom',
              label: 'Articles',
              url: '/articles',
            },
          },
          {
            link: {
              type: 'reference',
              label: 'Contact',
              reference: {
                relationTo: 'pages',
                value: contactPage.id,
              },
            },
          },
        ],
      },
    }),
    payload.updateGlobal({
      slug: 'footer',
      context: {
        disableRevalidate: true,
      },
      data: {
        navItems: [
          {
            link: {
              type: 'custom',
              label: 'Admin',
              url: '/admin',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Source Code',
              newTab: true,
              url: 'https://github.com/payloadcms/payload/tree/main/templates/website',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Payload',
              newTab: true,
              url: 'https://payloadcms.com/',
            },
          },
        ],
      },
    }),
  ])

  payload.logger.info('Seeded database successfully!')
}

async function fetchFileByURL(url: string): Promise<File> {
  const res = await fetch(url, {
    credentials: 'include',
    method: 'GET',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch file from ${url}, status: ${res.status}`)
  }

  const data = await res.arrayBuffer()

  return {
    name: url.split('/').pop() || `file-${Date.now()}`,
    data: Buffer.from(data),
    mimetype: `image/${url.split('.').pop()}`,
    size: data.byteLength,
  }
}
