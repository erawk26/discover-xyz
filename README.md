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

### Development Scripts

- `pnpm dev`: Start development server on port 3026
- `pnpm build`: Build the application for production
- `pnpm start`: Start the production server on port 3026
- `pnpm reset-db`: Reset the database (destructive)
- `pnpm generate:types`: Generate TypeScript types from Payload config
- `pnpm test`: Run all tests
- `pnpm test:e2e`: Run end-to-end tests
- `pnpm test:int`: Run integration tests

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
