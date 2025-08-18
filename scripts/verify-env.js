#!/usr/bin/env node

console.log('🔍 Environment Verification');
console.log('==========================');

const requiredVars = [
  'DATABASE_URI',
  'PAYLOAD_SECRET',
  'BETTER_AUTH_SECRET',
  'NEXT_PUBLIC_SERVER_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET'
];

const missing = [];
const present = [];

requiredVars.forEach(varName => {
  if (process.env[varName]) {
    present.push(varName);
    console.log(`✅ ${varName}: Set`);
  } else {
    missing.push(varName);
    console.log(`❌ ${varName}: Missing`);
  }
});

console.log('\n📊 Summary:');
console.log(`   Present: ${present.length}/${requiredVars.length}`);
console.log(`   Missing: ${missing.length}/${requiredVars.length}`);

if (missing.length > 0) {
  console.log('\n⚠️  Missing environment variables:');
  missing.forEach(v => console.log(`   - ${v}`));
  process.exit(1);
}

console.log('\n✨ All required environment variables are set!');
process.exit(0);