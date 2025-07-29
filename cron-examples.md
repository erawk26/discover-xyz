# FedSync Cron Setup Examples

## Option 1: System Cron (Linux/Mac)

### Basic Daily Sync at 2 AM
```bash
# Edit crontab
crontab -e

# Add this line for daily sync at 2 AM
0 2 * * * cd /path/to/discover-xyz && /usr/local/bin/pnpm cron:fedsync >> /var/log/fedsync-cron.log 2>&1
```

### Every 6 Hours
```bash
0 */6 * * * cd /path/to/discover-xyz && /usr/local/bin/pnpm cron:fedsync >> /var/log/fedsync-cron.log 2>&1
```

### Weekdays Only at 3 AM
```bash
0 3 * * 1-5 cd /path/to/discover-xyz && /usr/local/bin/pnpm cron:fedsync >> /var/log/fedsync-cron.log 2>&1
```

## Option 2: GitHub Actions

Create `.github/workflows/fedsync-cron.yml`:

```yaml
name: FedSync Data Sync

on:
  schedule:
    # Runs at 2 AM UTC every day
    - cron: '0 2 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        
    - name: Install pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 8
        
    - name: Install dependencies
      run: pnpm install
      
    - name: Run FedSync Cron
      env:
        FEDERATOR_BEARER_TOKEN: ${{ secrets.FEDERATOR_BEARER_TOKEN }}
        FEDERATOR_API_URL: ${{ secrets.FEDERATOR_API_URL }}
        DATABASE_URI: ${{ secrets.DATABASE_URI }}
        PAYLOAD_SECRET: ${{ secrets.PAYLOAD_SECRET }}
      run: pnpm cron:fedsync
```

## Option 3: Vercel Cron Jobs

Add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/fedsync",
    "schedule": "0 2 * * *"
  }]
}
```

Create `app/api/cron/fedsync/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = headers().get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    await execAsync('pnpm cron:fedsync')
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

## Option 4: PM2 Cron

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'fedsync-cron',
    script: 'pnpm',
    args: 'cron:fedsync',
    cron_restart: '0 2 * * *',
    autorestart: false,
    watch: false,
    max_memory_restart: '1G',
    error_file: 'logs/pm2/fedsync-error.log',
    out_file: 'logs/pm2/fedsync-out.log',
    log_file: 'logs/pm2/fedsync-combined.log',
    time: true
  }]
}
```

Start with PM2:
```bash
pm2 start ecosystem.config.js --only fedsync-cron
pm2 save
pm2 startup
```

## Environment Variables for Cron

Add these optional variables to `.env`:

```bash
# Delay between sync and import (seconds)
FEDSYNC_CRON_DELAY=5

# Webhook notifications (optional)
FEDSYNC_WEBHOOK_SUCCESS=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
FEDSYNC_WEBHOOK_FAILURE=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

## Monitoring

The cron script creates logs in `logs/cron/` directory with daily rotation:
- `fedsync-cron-2024-01-18.log`

You can monitor the logs:
```bash
tail -f logs/cron/fedsync-cron-*.log
```

## Testing

Test the cron job manually:
```bash
pnpm cron:fedsync
```

Check the exit code:
```bash
pnpm cron:fedsync
echo $?  # Should be 0 for success, 1 for failure
```