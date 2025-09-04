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

    let adminUser

    if (adminUsers.totalDocs === 0) {
      console.log('📝 No admin users found. Creating default admin user...')

      // Create a default admin user
      // The first user automatically becomes admin per the beforeOperation hook
      const email = `admin@${process.env.SITE_DOMAIN}` || 'admin@example.com'

      adminUser = await payload.create({
        collection: 'users',
        data: {
          email,
          emailVerified: false, // Required field for User type
          role: 'admin', // Will be set automatically if first user
          name: 'Admin User',
        },
      })

      console.log(`✅ Created admin user: ${adminUser.email}`)
      console.log('   Note: User created without password.')
      console.log('   Please set password through the UI or auth system!')
    } else {
      adminUser = adminUsers.docs[0]
      console.log(`🔐 Using existing admin user: ${adminUser.email}`)
    }

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
