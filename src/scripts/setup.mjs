#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.resolve(process.cwd(), 'data/fedsync')
const logsDir = path.resolve(process.cwd(), 'logs')

// Create data directory
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
  console.log(`✅ Created data directory: ${dataDir}`)
} else {
  console.log(`📁 Data directory already exists: ${dataDir}`)
}

// Create logs directory
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
  console.log(`✅ Created logs directory: ${logsDir}`)
} else {
  console.log(`📁 Logs directory already exists: ${logsDir}`)
}

// Check if .env exists
const envPath = path.resolve(process.cwd(), '.env')
const envExamplePath = path.resolve(process.cwd(), '.env.example')

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath)
  console.log(`✅ Created .env from .env.example`)
  console.log(`⚠️  Please update .env with your actual values`)
} else if (fs.existsSync(envPath)) {
  console.log(`📁 .env file already exists`)
} else {
  console.log(`⚠️  No .env.example found - please create .env manually`)
}

console.log('\n🚀 Setup complete! Next steps:')
console.log('1. Update .env with your configuration')
console.log('2. Run: docker compose up -d mongo')
console.log('3. Run: pnpm sync (to fetch FedSync data)')
console.log('4. Run: pnpm dev')