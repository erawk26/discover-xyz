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
  
  // SECURE: Only allow admins to seed the database
  if (!authenticatedUser || authenticatedUser.role !== 'admin') {
    return new Response('Only administrators can seed the database.', { status: 403 })
  }

  try {
    // Create a Payload request object with admin context for seeding
    const payloadReq = await createLocalReq({ 
      user: { ...authenticatedUser, collection: 'users' },
      context: { internal: true }  // Mark as internal operation
    }, payload)

    await seed({ payload, req: payloadReq })

    return Response.json({ success: true })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Error seeding data' })
    return new Response('Error seeding data.', { status: 500 })
  }
}
