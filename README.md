# DiscoverXYZ

This project is based on the official [Payload Website Template](https://github.com/payloadcms/payload/blob/main/templates/website). It provides a fully-working backend, enterprise-grade admin panel, and a production-ready website.

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

2. Update the `.env` file with your configuration:
   ```bash
   # Database connection (MongoDB is configured by default)
   DATABASE_URI=mongodb://127.0.0.1/<your-project-name>

   # Required secrets (generate strong random strings)
   PAYLOAD_SECRET=your_secure_secret_here
   CRON_SECRET=your_secure_cron_secret_here
   PREVIEW_SECRET=your_secure_preview_secret_here

   # Important: Set your site name (used throughout the application)
   SITE_NAME=<Your Project Name>

   # Server URL (no trailing slash)
   NEXT_PUBLIC_SERVER_URL=http://localhost:3026
   ```

### Development

#### Option 1: Local Development

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start the development server:
   ```bash
   pnpm dev
   ```

3. Access the application at http://localhost:3026

#### Option 2: Using Docker

1. Make sure Docker and Docker Compose are installed on your machine
2. Run the following command:
   ```bash
   docker-compose up
   ```
3. Access the application at http://localhost:3026 (This Docker config uses port 3026)

### Creating an Admin User

1. Navigate to http://localhost:3026/admin (or http://localhost:3000/admin if using Docker)
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

## Additional Documentation

- **[Access Control Guide](./src/access/README.md)**: Detailed information about user roles and permissions
- **[Branding Guide](./BRANDING_GUIDE.md)**: Instructions for customizing the application's appearance
- **[Development Guidelines](./CLAUDE.md)**: Project standards and development workflow
- **[FedSync Documentation](./src/lib/fedsync/README.md)**: API synchronization tool for importing data
