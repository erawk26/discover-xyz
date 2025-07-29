import type { Profile } from '@/payload-types'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { CollectionAfterChangeHook } from 'payload'

export const revalidateProfile: CollectionAfterChangeHook<Profile> = ({
  doc,
  previousDoc,
  req: { payload },
}) => {
  // Skip revalidation if not in Next.js runtime context
  if (!process.env.NEXT_RUNTIME) {
    return doc
  }

  if (doc._status === 'published') {
    const path = `/profiles/${doc.slug}`

    payload.logger.info(`Revalidating profile at path: ${path}`)

    revalidatePath(path)
    revalidateTag('profiles-sitemap')
  }

  // If the profile was previously published, we need to revalidate the old path
  if (previousDoc?._status === 'published' && doc._status !== 'published') {
    const oldPath = `/profiles/${previousDoc.slug}`

    payload.logger.info(`Revalidating old profile at path: ${oldPath}`)

    revalidatePath(oldPath)
    revalidateTag('profiles-sitemap')
  }

  return doc
}