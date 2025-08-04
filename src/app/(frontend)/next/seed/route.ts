import { createLocalReq, getPayload } from 'payload'
import { seed } from '@/endpoints/seed'
import config from '@payload-config'
import { headers, cookies } from 'next/headers'
import { auth } from '@/lib/better-auth'

export const maxDuration = 60 // This function can run for a maximum of 60 seconds

export async function POST(): Promise<Response> {
  const payload = await getPayload({ config })
  
  // Check Better Auth session
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  let authenticatedUser = null

  if (session?.user) {
    // Get the full user from Payload using Better Auth session
    const users = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: session.user.email,
        },
      },
    })
    authenticatedUser = users.docs[0]
  } else {
    // Fallback to Payload auth check
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })
    authenticatedUser = user
  }
  
  if (!authenticatedUser) {
    return new Response('Action forbidden.', { status: 403 })
  }

  try {
    // Create a Payload request object to pass to the Local API for transactions
    // At this point you should pass in a user, locale, and any other context you need for the Local API
    const payloadReq = await createLocalReq({ user: authenticatedUser }, payload)

    await seed({ payload, req: payloadReq })

    return Response.json({ success: true })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Error seeding data' })
    return new Response('Error seeding data.', { status: 500 })
  }
}
