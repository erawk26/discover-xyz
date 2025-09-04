import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

// Using pg directly is acceptable for database reset
// This is a destructive admin operation, not application logic
async function resetDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URI,
  });

  try {
    console.log('🗑️  Database Reset Script');
    console.log('======================');
    console.log('Dropping all tables...');
    
    // Get all tables
    const tablesResult = await pool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    // Drop all tables
    for (const row of tablesResult.rows) {
      await pool.query(`DROP TABLE IF EXISTS "${row.tablename}" CASCADE`);
      console.log(`   ✅ Dropped table: ${row.tablename}`);
    }
    
    // Drop all types/enums
    const typesResult = await pool.query(`
      SELECT typname FROM pg_type 
      WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      AND typtype = 'e'
    `);
    
    for (const row of typesResult.rows) {
      await pool.query(`DROP TYPE IF EXISTS "${row.typname}" CASCADE`);
      console.log(`   ✅ Dropped type: ${row.typname}`);
    }
    
    console.log('\n✨ Database reset complete ✨');
  } catch (err) {
    console.error('❌ Error resetting database:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
  
  process.exit(0);
}

resetDatabase();