import { getPayload } from 'payload'
import config from '@payload-config'
import { seed } from '@/endpoints/seed'

async function runSeed() {
  try {
    const payload = await getPayload({ config })

    // Check if there's at least one admin user
    const adminUsers = await payload.find({
      collection: 'users',
      where: {
        role: {
          equals: 'admin',
        },
      },
      limit: 1,
    })

    if (adminUsers.totalDocs === 0) {
      console.error('❌ No admin users found. Please create an admin user first.')
      process.exit(1)
    }

    const adminUser = adminUsers.docs[0]
    console.log(`🔐 Using admin user: ${adminUser.email}`)

    // Create a mock request with the admin user
    const req = {
      user: adminUser,
      payload,
      headers: new Headers(),
      context: {
        internal: true,
      },
    } as any

    console.log('🌱 Starting database seed...')
    await seed({ payload, req })
    
    console.log('✅ Database seeded successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

// Run the seed function
runSeed()