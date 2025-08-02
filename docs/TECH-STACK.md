# Technology Stack

[← Back to Main Documentation](./README.md)

## Overview

This document provides a comprehensive overview of the technology stack used in the Discover XYZ project, including core dependencies, development tools, and architectural decisions.

## Core Technologies

### Frontend Framework
- **[Next.js](https://nextjs.org)** v15.3.3
  - App Router for modern routing
  - Server Components for optimal performance
  - Built-in API routes
  - Image optimization
  - TypeScript support

### UI Library
- **[React](https://react.dev)** v19.1.0
  - Latest React features
  - Concurrent rendering
  - Server Components support
  - Improved performance

### Content Management
- **[Payload CMS](https://payloadcms.com)** v3.45.0
  - Headless CMS
  - TypeScript-first
  - Built-in authentication
  - GraphQL and REST APIs
  - Admin panel included

### Language & Type Safety
- **[TypeScript](https://www.typescriptlang.org)** v5.7.3
  - **Strict mode enabled** for maximum type safety
  - No implicit `any` types
  - Strict null checks
  - Complete type coverage

### Styling
- **[Tailwind CSS](https://tailwindcss.com)** v3.4.3
  - Utility-first CSS framework
  - Custom design tokens
  - Dark mode support
  - **Note**: v4 upgrade planned

### Component Library
- **[shadcn/ui](https://ui.shadcn.com)** (latest)
  - Built on Radix UI primitives
  - Fully customizable components
  - Tailwind CSS styling
  - TypeScript support

### Authentication
- **[Better Auth](https://www.better-auth.com)** v1.3.4
  - Modern authentication library
  - Session management
  - OAuth support
  - Magic links
  - TypeScript-first

- **[payload-auth](https://github.com/payload-auth)** v1.6.4
  - Better Auth integration for Payload CMS
  - User synchronization
  - Role management

### Database
- **[MongoDB](https://www.mongodb.com)**
  - Document database
  - Accessed via Payload CMS
  - `@payloadcms/db-mongodb` adapter

## Development Dependencies

### Build Tools
- **[Vite](https://vitejs.dev)** (via Vitest)
  - Fast development builds
  - HMR support
  - TypeScript compilation

### Testing
- **[Vitest](https://vitest.dev)** v3.2.3
  - Unit and integration testing
  - Jest-compatible API
  - TypeScript support
  - Fast execution

- **[Playwright](https://playwright.dev)** v1.50.0
  - End-to-end testing
  - Cross-browser support
  - TypeScript integration

- **[Testing Library](https://testing-library.com)**
  - React Testing Library v16.3.0
  - Component testing
  - User-centric queries

### Code Quality
- **[ESLint](https://eslint.org)** v9.32.0
  - Code linting
  - Next.js specific rules
  - TypeScript integration

- **[Prettier](https://prettier.io)** v3.4.2
  - Code formatting
  - Consistent style
  - Editor integration

### Package Management
- **[pnpm](https://pnpm.io)** v9+
  - Fast, disk space efficient
  - Strict dependency resolution
  - Workspace support

## Key Libraries

### UI Components
- **@radix-ui/react-*** - Accessible component primitives
- **lucide-react** v0.378.0 - Icon library
- **class-variance-authority** v0.7.0 - Component variants
- **clsx** v2.1.1 - Conditional classes
- **tailwind-merge** v2.3.0 - Tailwind class merging

### Forms & Validation
- **react-hook-form** v7.45.4 - Form management
- **zod** v4.0.5 - Schema validation

### State Management
- **@tanstack/react-query** v5.83.0 - Server state management
- React Context API - Client state

### Utilities
- **geist** v1.3.0 - Font family
- **sharp** v0.32.6 - Image processing
- **jsonwebtoken** v9.0.2 - JWT handling
- **dotenv** v16.4.7 - Environment variables

### Notifications
- **sonner** v2.0.6 - Toast notifications

## Architecture Decisions

### TypeScript Strict Mode
All code must comply with TypeScript strict mode:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

### Module System
- ES Modules (ESM) throughout
- `"type": "module"` in package.json
- Modern import/export syntax

### Styling Architecture
- Tailwind CSS for utility classes
- CSS variables for theming
- Component-scoped styles
- Dark mode via `data-theme` attribute

### Authentication Architecture
- Better Auth for authentication logic
- Payload CMS for user storage
- Session-based authentication
- Secure HTTP-only cookies

## Environment Requirements

### Node.js
- Version: 18.20.2+ or 20.9.0+
- LTS versions recommended

### Database
- MongoDB 5.0+
- Connection via MongoDB URI

### Development Tools
- Git for version control
- VS Code recommended
- TypeScript language service

## Future Upgrades

### Planned Updates
1. **Tailwind CSS v4**
   - Native CSS architecture
   - Improved performance
   - Better developer experience

2. **Additional OAuth Providers**
   - GitHub OAuth
   - Microsoft OAuth
   - Custom providers

3. **Performance Optimizations**
   - React Server Components adoption
   - Streaming SSR
   - Edge runtime support

### Monitoring & Observability
- Planned integration with:
  - Error tracking (Sentry)
  - Performance monitoring
  - Analytics platform

## Security Considerations

### Authentication
- Secure session management
- CSRF protection
- Rate limiting ready
- OAuth state validation

### Data Protection
- Environment variable validation
- No hardcoded secrets
- Secure cookie flags
- HTTPS enforcement in production

### Code Security
- TypeScript strict mode prevents common errors
- Dependency vulnerability scanning
- Regular security updates
- Input validation with Zod

## Development Workflow

### Commands
```bash
# Development
pnpm dev           # Start dev server on port 3026

# Building
pnpm build         # Production build
pnpm start         # Start production server

# Testing
pnpm test          # Run all tests
pnpm test:int      # Integration tests
pnpm test:e2e      # E2E tests

# Code Quality
pnpm lint          # Run ESLint
pnpm typecheck     # TypeScript checking
```

### Git Workflow
- Feature branches
- Conventional commits
- PR reviews required
- CI/CD pipeline

## Resources

### Documentation
- [Next.js 15 Docs](https://nextjs.org/docs)
- [React 19 Docs](https://react.dev)
- [Payload CMS v3 Docs](https://payloadcms.com/docs)
- [Better Auth Docs](https://www.better-auth.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Community
- [Payload Discord](https://discord.com/invite/payload)
- [Next.js Discord](https://nextjs.org/discord)
- [Better Auth GitHub](https://github.com/better-auth/better-auth)