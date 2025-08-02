# API Documentation

[← Back to Main Documentation](./README.md)

## Overview

The Discover XYZ API provides both REST and GraphQL endpoints for accessing and managing content. This documentation covers the main API endpoints available.

## Base URLs

- **Development**: `http://localhost:3026`
- **Production**: `https://yourdomain.com`

## Authentication

The API uses Better Auth for authentication. Most endpoints require authentication via session cookies or bearer tokens.

### Authentication Methods

#### 1. Better Auth Login
```bash
# Email/Password login
curl -X POST http://localhost:3026/api/auth/sign-in \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "password": "password"
  }'

# Returns session cookie and user data
```

#### 2. OAuth Login
- Google OAuth: Visit `/sign-in` and click "Continue with Google"
- Callback handled at `/api/auth/callback/google`

#### 3. Admin Panel Login
- Visit `/admin/login` for Payload CMS admin access
- Uses Better Auth integration for authentication

#### 4. Bearer Token
```bash
# Use the session token from Better Auth
curl -H "Authorization: Bearer <session-token>" \
  http://localhost:3026/api/events
```

### Better Auth Endpoints

```bash
# Sign up new user
POST /api/auth/sign-up
{
  "email": "user@example.com",
  "password": "password",
  "name": "John Doe"
}

# Sign in
POST /api/auth/sign-in
{
  "email": "user@example.com",
  "password": "password"
}

# Sign out
POST /api/auth/sign-out

# Get current session
GET /api/auth/session

# Send magic link
POST /api/auth/magic-link/send
{
  "email": "user@example.com"
}

# OAuth endpoints
GET /api/auth/callback/:provider
```

## REST API Endpoints

### Collections

All Payload collections are available via REST API:

#### Events

```bash
# Get all events
GET /api/events

# Get single event
GET /api/events/:id

# Create event (requires auth)
POST /api/events

# Update event (requires auth)
PATCH /api/events/:id

# Delete event (requires auth)
DELETE /api/events/:id
```

**Example Response**:
```json
{
  "docs": [
    {
      "id": "64a1b2c3d4e5f6789",
      "title": "Summer Festival",
      "description": "Annual summer music festival",
      "calendar": [
        {
          "startDate": "2024-07-15T18:00:00.000Z",
          "endDate": "2024-07-15T23:00:00.000Z",
          "startTime": "6:00 PM",
          "endTime": "11:00 PM"
        }
      ],
      "location": {
        "name": "Central Park",
        "address": "Central Park, New York, NY",
        "coordinates": {
          "lat": 40.785091,
          "lng": -73.968285
        }
      },
      "categories": ["64a1b2c3d4e5f6123"],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "totalDocs": 1,
  "limit": 10,
  "page": 1,
  "totalPages": 1
}
```

#### Profiles

```bash
# Get all profiles
GET /api/profiles

# Get single profile
GET /api/profiles/:id

# Create profile (requires auth)
POST /api/profiles

# Update profile (requires auth)
PATCH /api/profiles/:id

# Delete profile (requires auth)
DELETE /api/profiles/:id
```

#### Categories

```bash
# Get all categories
GET /api/categories

# Get single category
GET /api/categories/:id
```

#### Media

```bash
# Get all media
GET /api/media

# Upload media (requires auth)
POST /api/media

# Get single media item
GET /api/media/:id
```

### Query Parameters

All collection endpoints support these query parameters:

#### Pagination
```bash
# Limit results
GET /api/events?limit=5

# Get specific page
GET /api/events?page=2&limit=10
```

#### Sorting
```bash
# Sort by field (ascending)
GET /api/events?sort=title

# Sort descending
GET /api/events?sort=-createdAt
```

#### Filtering
```bash
# Simple equality
GET /api/events?where[title][equals]=Summer Festival

# Contains text
GET /api/events?where[title][contains]=Festival

# Date ranges
GET /api/events?where[calendar.startDate][greater_than]=2024-01-01

# Multiple conditions
GET /api/events?where[title][contains]=Festival&where[categories][in]=64a1b2c3d4e5f6123
```

#### Population
```bash
# Populate relationships
GET /api/events?populate=categories

# Populate multiple relationships
GET /api/events?populate=categories,location.city

# Populate with depth
GET /api/events?depth=2
```

### Custom Endpoints

#### FedSync Import

```bash
# Start import job
POST /api/import-fedsync
Content-Type: application/json
Cookie: payload-token=<token>

{
  "dataPath": "data/fedsync",
  "batchSize": 100,
  "dryRun": false
}

# Check import status
GET /api/import-fedsync/status?jobId=import-123
Cookie: payload-token=<token>
```

#### Authentication

```bash
# OAuth initiation
GET /api/auth/oauth/initiate?provider=google

# OAuth callback (handled automatically)
GET /api/auth/callback/google?code=...

# Create OAuth session
POST /api/auth/oauth-session
```

## GraphQL API

### Endpoint
```
POST /api/graphql
```

### Example Queries

#### Get Events
```graphql
query GetEvents {
  Events {
    docs {
      id
      title
      description
      calendar {
        startDate
        endDate
        startTime
        endTime
      }
      location {
        name
        address
        coordinates {
          lat
          lng
        }
      }
      categories {
        id
        name
        slug
      }
    }
  }
}
```

#### Get Single Event
```graphql
query GetEvent($id: String!) {
  Event(id: $id) {
    id
    title
    description
    calendar {
      startDate
      endDate
    }
    location {
      name
      address
    }
  }
}
```

#### Create Event (Mutation)
```graphql
mutation CreateEvent($data: mutationEventInput!) {
  createEvent(data: $data) {
    id
    title
    description
  }
}
```

#### Variables
```json
{
  "data": {
    "title": "New Event",
    "description": "Event description",
    "calendar": [
      {
        "startDate": "2024-07-15T18:00:00.000Z",
        "endDate": "2024-07-15T23:00:00.000Z"
      }
    ]
  }
}
```

### GraphQL Filtering

```graphql
query FilteredEvents {
  Events(
    where: {
      title: { contains: "Festival" }
      calendar: {
        startDate: { greater_than: "2024-01-01" }
      }
    }
    limit: 10
    sort: "-createdAt"
  ) {
    docs {
      id
      title
      calendar {
        startDate
      }
    }
    totalDocs
  }
}
```

## Error Handling

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

### Error Response Format

```json
{
  "errors": [
    {
      "message": "Validation failed",
      "name": "ValidationError",
      "data": [
        {
          "message": "Title is required",
          "path": "title",
          "value": ""
        }
      ]
    }
  ]
}
```

## Rate Limiting

- **Anonymous requests**: 100 requests per hour
- **Authenticated requests**: 1000 requests per hour
- **Import endpoints**: 10 requests per hour

## CORS

CORS is enabled for:
- `http://localhost:3000` (frontend dev)
- `http://localhost:3026` (admin panel)
- Production domains (configured via environment)

## Response Caching

- **Public collections**: Cached for 5 minutes
- **Authenticated requests**: No caching
- **Media files**: Cached for 1 hour

## Webhooks

Payload CMS supports webhooks for real-time updates:

```bash
# Configure webhook in payload.config.ts
webhooks: [
  {
    name: 'event-created',
    url: 'https://your-app.com/webhook/event-created',
    events: ['create'],
    collections: ['events']
  }
]
```

## API Examples

### JavaScript/Node.js

```javascript
// Using fetch API
const response = await fetch('http://localhost:3026/api/events', {
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  }
})

const events = await response.json()
console.log(events.docs)
```

### curl Examples

```bash
# Get events with authentication
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3026/api/events?limit=5"

# Create new event
curl -X POST "http://localhost:3026/api/events" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Event",
    "description": "Event description"
  }'

# Upload media
curl -X POST "http://localhost:3026/api/media" \
  -H "Authorization: Bearer <token>" \
  -F "file=@image.jpg"
```

### Python Example

```python
import requests

# Authentication
auth_response = requests.post('http://localhost:3026/api/users/login', {
    'email': 'user@example.com',
    'password': 'password'
})
token = auth_response.json()['token']

# Get events
headers = {'Authorization': f'Bearer {token}'}
response = requests.get('http://localhost:3026/api/events', headers=headers)
events = response.json()

print(f"Found {events['totalDocs']} events")
```

## Development Tools

### GraphQL Playground

Access the GraphQL playground at `/api/graphql` in development mode for interactive query building.

### API Testing

Use tools like:
- **Postman**: Import the API collection
- **Insomnia**: REST and GraphQL client
- **curl**: Command-line testing
- **httpie**: Modern command-line HTTP client

### API Documentation

Payload automatically generates OpenAPI documentation available at `/api/docs` (in development).

## Related Documentation

- [FedSync API Documentation](./fedsync/API-USAGE.md) - Import API endpoints
- [Authentication Setup](./AUTH_SETUP.md) - OAuth and login configuration
- [Testing Guide](./TESTING.md) - API testing strategies
- [Development Guidelines](../CLAUDE.md) - Project standards

For more detailed information about Payload CMS APIs, refer to the [official Payload documentation](https://payloadcms.com/docs/).