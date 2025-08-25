#!/usr/bin/env node

import { spawn } from 'node:child_process'

const env = { ...process.env }

// If running the web server then run migrations only
if (process.argv.slice(-3).join(' ') === 'pnpm run start') {
  // Run migrations first (will skip if already run)
  console.log('Running database migrations...')
  await exec('npx payload migrate --skip-confirmation --yes')
  
  // Don't build in production - it's already built in the Docker image
  console.log('Starting server...')
}

// launch application
await exec(process.argv.slice(2).join(' '))

function exec(command) {
  const child = spawn(command, { shell: true, stdio: 'inherit', env })
  return new Promise((resolve, reject) => {
    child.on('exit', code => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${command} failed rc=${code}`))
      }
    })
  })
}
