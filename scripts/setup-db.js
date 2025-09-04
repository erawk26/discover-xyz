#!/usr/bin/env node

import { spawn } from 'child_process';
import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

const execCommand = (command, args = []) => {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { 
      stdio: 'inherit',
      shell: true 
    });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with code ${code}`));
    });
  });
};


async function checkDatabaseState() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URI,
  });

  try {
    console.log('🔍 Checking database state...');
    
    // Simple check: count tables
    const tablesResult = await pool.query(`
      SELECT COUNT(*) as count FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    const tableCount = parseInt(tablesResult.rows[0].count);
    
    if (tableCount === 0) {
      console.log('📭 Database is empty');
      return 'empty';
    }
    
    // Check for Payload tables
    const payloadTablesResult = await pool.query(`
      SELECT COUNT(*) as count FROM pg_tables 
      WHERE schemaname = 'public' 
      AND (tablename LIKE 'payload_%' OR tablename IN ('users', 'pages', 'articles', 'media'))
    `);
    
    const payloadTableCount = parseInt(payloadTablesResult.rows[0].count);
    
    if (payloadTableCount > 0) {
      console.log(`✅ Found ${payloadTableCount} Payload tables`);
      return 'has_payload_tables';
    } else {
      console.log('⚠️  Database has tables but no Payload tables');
      return 'has_non_payload_tables';
    }
  } catch (err) {
    console.error('❌ Error checking database:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function setupDatabase() {
  console.log('\n🚀 Database Setup Script');
  console.log('========================\n');
  
  const dbState = await checkDatabaseState();
  
  switch(dbState) {
    case 'empty':
      console.log('🏗️  Setting up fresh database...\n');
      await runMigrations();
      break;
      
    case 'has_payload_tables':
      console.log('\n✨ Database already has Payload tables!');
      console.log('   Run "pnpm db:reset" if you want to start fresh');
      break;
      
    case 'has_non_payload_tables':
      console.log('\n⚠️  Warning: Database contains non-Payload tables');
      console.log('   This might cause conflicts.');
      console.log('   Consider running "pnpm db:reset" first');
      console.log('\n   Attempting to run migrations anyway...\n');
      await runMigrations();
      break;
  }
}

async function runMigrations() {
  try {
    console.log('📦 Running Payload migrations...\n');
    // Force migration with --skip-confirmation flag
    await execCommand('pnpm', ['payload', 'migrate', '--skip-confirmation']);
    console.log('\n✅ Migrations completed successfully!');
    
    // Don't run seed automatically - it should be explicit
    console.log('\n✅ Database ready!');
    console.log('   Run "pnpm db:seed:admin" to seed with sample data');
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

// Add safety check for production databases
function isProductionDatabase() {
  const dbUrl = process.env.DATABASE_URI || '';
  const productionHosts = [
    'neon.tech',
    'railway.app',
    'supabase.co',
    'amazonaws.com',
    'azure.com',
    'googlecloud.com'
  ];
  
  return productionHosts.some(host => dbUrl.includes(host));
}

async function main() {
  const isProd = isProductionDatabase();
  if (isProd && !process.argv.includes('--force')) {
    console.log('⚠️  Detected production database!');
    console.log('   Add --force flag to continue');
    process.exit(1);
  }
  
  await setupDatabase();
}

main().catch(console.error);