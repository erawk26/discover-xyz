# DiscoverXYZ

This project is built with modern web technologies including Payload CMS v3, Next.js 15, React 19, and Better Auth. It provides a fully-working backend, enterprise-grade admin panel, and a production-ready website with advanced authentication capabilities.

## Tech Stack

- **[Payload CMS](https://payloadcms.com)** v3.45.0 - Headless CMS and application framework
- **[Next.js](https://nextjs.org)** v15.3.3 - React framework with App Router
- **[React](https://react.dev)** v19.1.0 - UI library
- **[TypeScript](https://www.typescriptlang.org)** v5.7.3 - Type-safe JavaScript (strict mode enabled)
- **[Tailwind CSS](https://tailwindcss.com)** v3.4.3 - Utility-first CSS framework (v4 upgrade planned)
- **[shadcn/ui](https://ui.shadcn.com)** - Re-usable components built with Radix UI and Tailwind
- **[Better Auth](https://www.better-auth.com)** v1.3.4 - Modern authentication library
- **[PostgreSQL](https://www.postgresql.org)** - Database (via Payload)

## Quick Start for Developers

To set up this project locally, follow these steps:

### Clone the Repository

```bash
git clone <repository-url>
cd <new folder name>
```

### Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Create a `.env.local` file for local development:
   ```bash
   cp .env.example .env.local
   ```

3. Update the `.env.local` file with your local configuration:
   ```bash
   # Local PostgreSQL database (started with docker-compose)
   DATABASE_URI=postgresql://postgres:postgres@localhost:5433/payload

   # Development environment
   NODE_ENV=development
   BETTER_AUTH_URL=http://localhost:3026
   NEXT_PUBLIC_APP_URL=http://localhost:3026
   NEXT_PUBLIC_SERVER_URL=http://localhost:3026
   ```

4. Update the `.env` file with your production/shared configuration:
   ```bash
   # Required secrets (generate strong random strings)
   PAYLOAD_SECRET=your_secure_secret_here
   PREVIEW_SECRET=your_secure_preview_secret_here
   BETTER_AUTH_SECRET=your_secure_auth_secret_here

   # Site configuration
   SITE_NAME=<Your Project Name>

   # OAuth Providers (optional)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

### Development

#### Option 1: Local Development with PostgreSQL

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start the PostgreSQL database:
   ```bash
   pnpm dev:db
   ```
   This will start a PostgreSQL container on port 5433 (mapped from internal port 5432).

3. Start the development server:
   ```bash
   pnpm dev
   ```
   
   Or start both database and server together:
   ```bash
   pnpm dev:full
   ```

4. Access the application at http://localhost:3026

To stop the database:
```bash
pnpm dev:db:down
```

#### Option 2: Using Remote Database

If you prefer to use a remote database (e.g., Neon, Railway, Supabase):
1. Update `DATABASE_URI` in `.env.local` with your remote database connection string
2. Run `pnpm dev` to start the development server

### Creating an Admin User

1. Navigate to http://localhost:3026/admin
2. Follow the on-screen instructions to create your first admin user

### Seeding the Database

To populate the database with sample content:
1. Log in to the admin panel
2. Click on the "Seed Database" link in the dashboard

**Note**: Seeding is destructive and will replace all existing data.

## Customization Guide

### Branding

Refer to the `BRANDING_GUIDE.md` file for detailed instructions on customizing the branding of your application, including:
- Updating site name
- Customizing logo and icon
- Changing color schemes
- Setting up light/dark mode support

### Content Structure

The main collections in this application are:
- **Users**: Authentication and access control
- **Pages**: Build custom pages using the layout builder
- **Articles**: Create blog posts or news articles
- **Media**: Upload and manage images and other assets
- **Categories**: Organize articles into categories
- **Events**: Manage events with dates, locations, and contact information
- **Profiles**: Business listings with amenities, hours, and location data

### Development Scripts

- `pnpm dev`: Start development server on port 3026
- `pnpm build`: Build the application for production
- `pnpm start`: Start the production server on port 3026
- `pnpm reset-db`: Reset the database (destructive)
- `pnpm generate:types`: Generate TypeScript types from Payload config
- `pnpm test`: Run all tests
- `pnpm test:e2e`: Run end-to-end tests
- `pnpm test:int`: Run integration tests
- `pnpm sync`: Sync all data from FedSync API (profiles, events, categories, amenities)
- `pnpm import`: Import synced data into Payload CMS
- `pnpm cron:fedsync`: Run automated sync and import (for cron jobs)

## FedSync Data Synchronization

This project includes integration with FedSync API for importing external data. The workflow consists of two steps:

### 1. Sync Data from API
```bash
pnpm sync
```
This downloads all data from the FedSync API and saves it to `data/fedsync/`:
- Profiles (business listings)
- Events
- Categories
- Amenities

### 2. Import Data to Payload CMS
```bash
pnpm import
```
This imports the synced data into your Payload CMS database.

**Note**: Make sure PostgreSQL is running before importing data.

### Automated Sync with Cron

To automatically sync and import data on a schedule:

```bash
# Run the cron job manually
pnpm cron:fedsync

# Set up automated scheduling (see cron-examples.md)
```

The cron job will:
1. Sync data from FedSync API
2. Wait 5 seconds (configurable)
3. Import data to Payload CMS
4. Log all operations to `logs/cron/`
5. Send webhook notifications (if configured)

See [Cron Setup Examples](./cron-examples.md) for detailed setup instructions.

## Collections Documentation

### Events Collection

The Events collection is designed to manage event listings with comprehensive date, location, and contact information:

- **Event Information**: Title, description, multiple date ranges with times
- **Location Details**: Venue name, full address, GPS coordinates, city/region relationships
- **Contact Information**: Multiple email types, phone numbers, websites, and social media
- **Media**: Photo galleries with captions
- **Metadata**: Categories, sync tracking, external IDs for API integration

### Profiles Collection

The Profiles collection handles business listings with extensive features:

- **Business Details**: Name, description, type classification
- **Location & Service Area**: Address, coordinates, cities served, regions
- **Contact Methods**: Multiple emails, phones, websites, social media profiles
- **Operating Hours**: Detailed business hours by day
- **Amenities & Features**: Relationship-based amenity tracking
- **Accommodation Info**: Room counts, suites, meeting facilities
- **Media**: Photo and video galleries
- **Sync Integration**: API data preservation, sync status tracking

## Features

- [Pre-configured Payload Config](#how-it-works)
- [Authentication](#users-authentication)
- [Access Control](#access-control)
- [Layout Builder](#layout-builder)
- [Draft Preview](#draft-preview)
- [Live Preview](#live-preview)
- [On-demand Revalidation](#on-demand-revalidation)
- [SEO](#seo)
- [Search](#search)
- [Redirects](#redirects)
- [Jobs and Scheduled Publishing](#jobs-and-scheduled-publish)
- [Website](#website)

## Documentation Index

### 📊 Project Overview
- **[Tech Stack](./docs/TECH-STACK.md)** - Complete technology stack breakdown
- **[Progress Report](./docs/PROGRESS-REPORT.md)** - Current project status and roadmap
- **[Architecture Overview](./docs/ARCHITECTURE.md)** - System design and structure

### 🚀 Getting Started
- **[Quick Start](#quick-start-for-developers)** - Set up the project locally
- **[Environment Setup](#environment-setup)** - Configuration and environment variables
- **[Branding Guide](./docs/BRANDING_GUIDE.md)** - Customize the application's appearance

### 🔐 Authentication & Security
- **[Authentication Setup](./docs/AUTH_SETUP.md)** - Better Auth and OAuth configuration
- **[Access Control Guide](./src/access/README.md)** - User roles and permissions

### 📊 Data Management
- **[FedSync Integration](./docs/fedsync/README.md)** - Data synchronization with FedSync API
- **[Cron Setup Examples](./docs/CRON_EXAMPLES.md)** - Automated data synchronization

### 👩‍💻 Development
- **[Development Guidelines](./CLAUDE.md)** - Project standards and team workflow
- **[Testing Guide](./docs/TESTING.md)** - Running and writing tests
- **[API Documentation](./docs/API.md)** - API endpoints and usage

### 🏗️ Project Information
- **[Project Roadmap](./docs/PROJECT_PLAN.md)** - Features and implementation status
- **[Architecture Overview](./docs/ARCHITECTURE.md)** - System design and structure
- **[Project Reports](./docs/reports/README.md)** - Historical audit reports and assessments
