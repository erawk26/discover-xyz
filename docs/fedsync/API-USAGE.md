# FedSync Import API Documentation

## Overview

The FedSync Import API provides endpoints to trigger and monitor data imports from FedSync into Payload CMS. The API runs imports asynchronously and provides job tracking.

## Authentication

All endpoints require authentication. You must be logged into Payload CMS to use these endpoints.

### Getting an Auth Token

1. **Via Payload Admin UI**:
   - Login at http://localhost:3026/admin
   - Open browser DevTools → Application → Cookies
   - Copy the `payload-token` value

2. **Via API Login**:
   ```bash
   # Login to get token
   curl -X POST http://localhost:3026/api/users/login \
     -H 'Content-Type: application/json' \
     -d '{
       "email": "cedric@grr.la",
       "password": "password123"
     }'
   ```
   Response includes the token in the `Set-Cookie` header.

## Endpoints

### 1. Start Import Job

**POST** `/api/import-fedsync`

Starts a new import job asynchronously.

#### Request

```bash
# Basic import with authentication
curl -X POST http://localhost:3026/api/import-fedsync \
  -H 'Content-Type: application/json' \
  -H 'Cookie: payload-token=YOUR_AUTH_TOKEN' \
  -d '{}'

# With custom options
curl -X POST http://localhost:3026/api/import-fedsync \
  -H 'Content-Type: application/json' \
  -H 'Cookie: payload-token=YOUR_AUTH_TOKEN' \
  -d '{
    "dataPath": "data/fedsync",
    "batchSize": 100,
    "concurrency": 10,
    "skipCategories": false,
    "skipEvents": false,
    "skipProfiles": false,
    "dryRun": false,
    "logLevel": "debug"
  }'
```

#### Request Body Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `dataPath` | string | `"data/fedsync"` | Path to FedSync data directory |
| `batchSize` | number | `50` | Number of items to process in each batch |
| `concurrency` | number | `5` | Number of concurrent operations |
| `skipCategories` | boolean | `false` | Skip importing categories |
| `skipEvents` | boolean | `false` | Skip importing events |
| `skipProfiles` | boolean | `false` | Skip importing profiles |
| `dryRun` | boolean | `false` | Preview import without making changes |
| `logLevel` | string | `"info"` | Log level: "debug", "info", "warn", "error" |

#### Response

```json
{
  "success": true,
  "jobId": "import-1706472845123-a1b2c3d4e5",
  "message": "Import job started",
  "checkStatus": "/api/import-fedsync/status?jobId=import-1706472845123-a1b2c3d4e5",
  "logFile": "logs/import-1706472845123-a1b2c3d4e5.log"
}
```

### 2. Check Import Status

**GET** `/api/import-fedsync/status`

Check the status of import jobs.

#### Request

```bash
# Check specific job
curl -X GET 'http://localhost:3026/api/import-fedsync/status?jobId=import-1706472845123-a1b2c3d4e5' \
  -H 'Cookie: payload-token=YOUR_AUTH_TOKEN'

# Get all jobs
curl -X GET http://localhost:3026/api/import-fedsync/status \
  -H 'Cookie: payload-token=YOUR_AUTH_TOKEN'
```

#### Response (Single Job)

```json
{
  "jobId": "import-1706472845123-a1b2c3d4e5",
  "status": "completed",
  "startTime": "2024-01-28T23:10:45.123Z",
  "endTime": "2024-01-28T23:12:30.456Z",
  "stats": {
    "categories": {
      "processed": 50,
      "imported": 50,
      "errors": 0
    },
    "events": {
      "processed": 1250,
      "imported": 1248,
      "errors": 2
    },
    "profiles": {
      "processed": 890,
      "imported": 890,
      "errors": 0
    }
  },
  "logFile": "logs/import-1706472845123-a1b2c3d4e5.log"
}
```

#### Response (All Jobs)

```json
{
  "jobs": [
    {
      "jobId": "import-1706472845123-a1b2c3d4e5",
      "status": "completed",
      "startTime": "2024-01-28T23:10:45.123Z",
      "endTime": "2024-01-28T23:12:30.456Z"
    },
    {
      "jobId": "import-1706472845124-b2c3d4e5f6",
      "status": "running",
      "startTime": "2024-01-28T23:15:00.000Z"
    }
  ]
}
```

### Status Values

- `pending` - Job created but not started
- `running` - Import in progress
- `completed` - Import finished successfully
- `failed` - Import failed with errors

## Examples

### Example 1: Full Import with Polling

```bash
#!/bin/bash

# Login and save token
TOKEN=$(curl -s -X POST http://localhost:3026/api/users/login \
  -H 'Content-Type: application/json' \
  -d '{"email": "cedric@grr.la", "password": "password123"}' \
  | grep -o 'payload-token=[^;]*' | cut -d= -f2)

# Start import
RESPONSE=$(curl -s -X POST http://localhost:3026/api/import-fedsync \
  -H 'Content-Type: application/json' \
  -H "Cookie: payload-token=$TOKEN" \
  -d '{}')

JOB_ID=$(echo $RESPONSE | jq -r '.jobId')
echo "Import started: $JOB_ID"

# Poll for status
while true; do
  STATUS=$(curl -s "http://localhost:3026/api/import-fedsync/status?jobId=$JOB_ID" \
    -H "Cookie: payload-token=$TOKEN" \
    | jq -r '.status')
  
  echo "Status: $STATUS"
  
  if [[ $STATUS == "completed" ]] || [[ $STATUS == "failed" ]]; then
    break
  fi
  
  sleep 5
done
```

### Example 2: Dry Run Import

```bash
# Test import without making changes
curl -X POST http://localhost:3026/api/import-fedsync \
  -H 'Content-Type: application/json' \
  -H 'Cookie: payload-token=YOUR_AUTH_TOKEN' \
  -d '{
    "dryRun": true,
    "logLevel": "debug"
  }'
```

### Example 3: Import Specific Types Only

```bash
# Import only events and profiles, skip categories
curl -X POST http://localhost:3026/api/import-fedsync \
  -H 'Content-Type: application/json' \
  -H 'Cookie: payload-token=YOUR_AUTH_TOKEN' \
  -d '{
    "skipCategories": true,
    "skipEvents": false,
    "skipProfiles": false
  }'
```

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```
Solution: Provide valid authentication token

### 404 Not Found
```json
{
  "error": "Job not found"
}
```
Solution: Check job ID is correct

### 500 Internal Server Error
```json
{
  "error": "Error message here"
}
```
Solution: Check logs for details

## Notes

1. **Async Processing**: Imports run asynchronously. The API returns immediately with a job ID.
2. **Log Files**: Each import creates a log file at `logs/import-{jobId}.log`
3. **Rate Limiting**: The import respects FedSync API rate limits
4. **Concurrency**: Adjust `concurrency` parameter based on your server capacity
5. **Memory Usage**: Large imports may require increased Node.js memory: `NODE_OPTIONS="--max-old-space-size=4096"` 

## Triggering from Other Services

### From GitHub Actions

```yaml
- name: Trigger FedSync Import
  run: |
    curl -X POST ${{ secrets.PAYLOAD_URL }}/api/import-fedsync \
      -H 'Content-Type: application/json' \
      -H 'Cookie: payload-token=${{ secrets.PAYLOAD_TOKEN }}' \
      -d '{}'
```

### From Cron Job

```bash
# Add to crontab for daily import at 2 AM
0 2 * * * curl -X POST http://localhost:3026/api/import-fedsync -H 'Cookie: payload-token=YOUR_TOKEN' -d '{}'
```

### From Node.js

```javascript
import fetch from 'node-fetch'

async function triggerImport() {
  const response = await fetch('http://localhost:3026/api/import-fedsync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': 'payload-token=YOUR_AUTH_TOKEN'
    },
    body: JSON.stringify({
      dryRun: false,
      logLevel: 'info'
    })
  })
  
  const result = await response.json()
  console.log('Import started:', result.jobId)
  return result
}
```