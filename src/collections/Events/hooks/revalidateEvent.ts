import type { Event } from '@/payload-types'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { CollectionAfterChangeHook } from 'payload'

export const revalidateEvent: CollectionAfterChangeHook<Event> = ({
  doc,
  previousDoc,
  req: { payload },
}) => {
  // Skip revalidation if not in Next.js runtime context
  if (!process.env.NEXT_RUNTIME) {
    return doc
  }

  if (doc._status === 'published') {
    const path = `/events/${doc.slug}`

    payload.logger.info(`Revalidating event at path: ${path}`)

    revalidatePath(path)
    revalidateTag('events-sitemap')
  }

  // If the event was previously published, we need to revalidate the old path
  if (previousDoc?._status === 'published' && doc._status !== 'published') {
    const oldPath = `/events/${previousDoc.slug}`

    payload.logger.info(`Revalidating old event at path: ${oldPath}`)

    revalidatePath(oldPath)
    revalidateTag('events-sitemap')
  }

  return doc
}