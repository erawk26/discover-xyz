# Integrating Better Auth with Payload CMS v3.45: A Comprehensive Technical Guide

## Executive Summary

This report provides a detailed technical roadmap for integrating Better Auth authentication system with Payload CMS v3.45, including database migration from MongoDB to PostgreSQL. Better Auth, a TypeScript-first authentication library, offers comprehensive features including OAuth providers, magic links, 2FA, and enterprise-grade session management. When integrated with Payload CMS's flexible authentication architecture, this combination creates a powerful, scalable authentication solution suitable for enterprise applications.

## Better Auth Architecture and Integration Patterns

Better Auth employs a **framework-agnostic, plugin-based architecture** that makes it ideal for CMS integration. Built with TypeScript, it provides type safety and excellent developer experience across React, Vue, Svelte, and other frameworks. The system uses traditional cookie-based sessions with database storage, offering better security than JWT-only approaches.

The core architecture consists of a server instance handling authentication logic, framework-specific client libraries, a Kysely-based database layer supporting multiple adapters, and an extensive plugin system. For CMS integration, Better Auth can be mounted at `/api/auth/*` endpoints while maintaining the existing CMS structure. The authentication flow integrates seamlessly through API route handlers, with the client library providing hooks and methods for frontend integration.

Key integration advantages include comprehensive out-of-the-box functionality, MIT licensing for commercial use, and a security-first design with built-in rate limiting and CSRF protection. The plugin architecture allows adding complex features like multi-factor authentication and organization management with minimal code.

## Payload CMS v3.x Authentication Architecture

Payload CMS v3.x provides a sophisticated collection-based authentication system where any collection can become auth-enabled. The latest verified version is v3.43.0, which includes significant authentication improvements over earlier versions. The system automatically injects authentication fields (`hash`, `salt`, `email`) into auth-enabled collections and supports multiple authentication strategies simultaneously.

The authentication system offers three built-in strategies: HTTP-only cookies for primary session management, JSON Web Tokens for API authentication, and API keys for third-party integrations. Customization points include comprehensive configuration options for cookies, password policies, and token management. The framework moved away from Passport.js in v3.0+ for more direct control over authentication flows.

Custom authentication strategies can be implemented through a simple interface that takes request headers and returns user data. This flexibility allows seamless integration with external authentication providers like Better Auth while maintaining Payload's existing permission and access control systems.

## Database Migration Strategy: MongoDB to PostgreSQL

Migrating from MongoDB to PostgreSQL requires careful planning, especially for authentication data preservation. Payload CMS supports PostgreSQL through the `@payloadcms/db-postgres` adapter with Drizzle ORM integration, providing full migration support and TypeScript-based schema management.

The migration involves transforming document-based MongoDB structures to relational PostgreSQL schemas. Key transformations include converting ObjectIds to UUIDs, mapping embedded documents to JSONB columns or normalized tables, and extracting arrays into junction tables. Authentication data requires special attention to preserve password hashes, session tokens, and user roles exactly as they exist in MongoDB.

A phased migration approach is recommended: First, set up the PostgreSQL adapter and generate initial schemas. Then migrate authentication data to ensure zero downtime for user access. Follow with content migration, handling media references and localization data. Finally, rebuild relationships and verify data integrity through comprehensive testing.

For zero-downtime migration, implement a dual-write pattern where both databases operate simultaneously during transition. This allows gradual migration with rollback capabilities if issues arise. Tools like `mongo-to-postgres` npm package or ETL platforms like Airbyte can automate much of the data transformation process.

## OAuth Provider Implementation

Better Auth excels at OAuth integration, supporting major providers with minimal configuration. For **Google OAuth**, the setup requires creating credentials in Google Cloud Console, enabling the Google+ API, and configuring redirect URIs for both development and production environments. The implementation supports both traditional redirect flows and modern ID token authentication without page redirects.

**GitHub OAuth** implementation requires creating an OAuth App in GitHub Developer Settings with the critical `user:email` scope for proper user identification. Better Auth handles the complex OAuth flow, including state management, token exchange, and user profile mapping. Both providers support additional scope requests after initial authentication and provide access tokens for subsequent API calls.

The OAuth configuration in Better Auth is straightforward, requiring only client IDs, secrets, and optional scope definitions. The system automatically handles user creation or linking based on email addresses, with customizable profile mapping for storing additional user data from OAuth providers.

## Role-Based Access Control Integration

Integrating RBAC between Better Auth and Payload CMS requires a hybrid approach leveraging both systems' strengths. Better Auth can store basic roles (admin, editor, viewer) while Payload maintains granular content-specific permissions. This separation allows centralized identity management while preserving CMS-specific access control requirements.

The recommended pattern involves using Better Auth's session customization to inject role data into authentication responses. Payload's access control functions can then consume this role information to make authorization decisions at the collection, document, and field levels. Role synchronization occurs through Better Auth's hooks system, updating Payload's user records when roles change in the identity provider.

For complex permission scenarios, implement attribute-based access control (ABAC) where Better Auth provides user attributes (department, location, clearance level) that Payload uses for dynamic permission evaluation. This approach scales well for enterprise environments with complex organizational hierarchies.

## Session Management and Token Handling

Better Auth's session architecture uses secure HTTP-only cookies with database-backed sessions, providing superior security compared to stateless JWT approaches. Sessions include comprehensive metadata: unique tokens, expiration times, IP addresses, and user agents for security auditing.

Session configuration options include customizable expiration times (default 7 days), update intervals for sliding sessions, and cookie caching for performance optimization. The cookie cache stores session data in signed cookies, reducing database queries while maintaining security through cryptographic signatures.

For multi-system integration, Better Auth supports session synchronization through its API. The system provides methods for listing active sessions, revoking specific sessions or all sessions, and automatic session invalidation on password changes. This granular control is essential for enterprise security requirements.

## Magic Link Authentication

Better Auth's magic link implementation provides passwordless authentication through email-delivered tokens. The plugin requires a custom email sending function and supports configurable token expiration (default 5 minutes). Magic links can be configured to allow or prevent new user registration, providing flexibility for different use cases.

Implementation involves adding the magic link plugin to both server and client configurations. The server handles token generation and email dispatch, while the client provides methods for requesting magic links and handling verification callbacks. Custom token generation functions allow integration with existing token systems or specific security requirements.

The magic link flow integrates seamlessly with Payload CMS, creating user records on first authentication if enabled. The system supports separate callback URLs for new versus existing users, allowing customized onboarding experiences.

## Two-Factor Authentication Implementation

Better Auth's comprehensive 2FA support includes TOTP (Time-based One-Time Passwords), SMS/email-based OTP, backup codes, and trusted device management. The implementation requires minimal configuration while providing enterprise-grade security features.

TOTP integration works with standard authenticator apps like Google Authenticator and Authy. The setup flow generates QR codes for easy app configuration and provides backup codes for account recovery. The system enforces password verification before enabling 2FA and supports custom issuers for branding.

The 2FA flow integrates transparently with the authentication process. After initial authentication, users with 2FA enabled receive a redirect flag, prompting for second-factor verification. Trusted device support allows users to skip 2FA on recognized devices for 60 days, balancing security with user experience.

## Enterprise Scalability Considerations

Scaling Better Auth with Payload CMS requires careful architecture planning. The recommended approach uses Better Auth's secondary storage configuration with Redis for session caching and rate limiting. This reduces database load while maintaining session consistency across multiple application instances.

Database optimization strategies include proper indexing of authentication tables, connection pooling configuration, and read replica usage for session validation. Better Auth's cookie caching further reduces database queries, with configurable cache durations based on security requirements.

For global deployments, implement geographic load balancing with regional authentication endpoints. Better Auth's stateless cookie validation enables efficient horizontal scaling without session affinity requirements. Monitor authentication metrics including response times (target <100ms for validation), success rates (>99.9%), and error patterns for proactive issue resolution.

## Technical Implementation Challenges and Solutions

**Legacy System Integration**: When Payload CMS has existing customizations, implement Better Auth as a parallel authentication system initially. Use Payload's custom strategies to validate Better Auth sessions while gradually migrating functionality. This approach minimizes disruption while allowing incremental adoption.

**Permission Synchronization**: Keeping Better Auth roles synchronized with Payload permissions requires webhook implementation or scheduled synchronization jobs. Better Auth's hook system can trigger updates to Payload user records, while Payload's hooks can update Better Auth when CMS-specific permissions change.

**Session Compatibility**: Better Auth sessions must be accessible to Payload's access control functions. Implement middleware that validates Better Auth cookies and injects user data into Payload's request context. This allows Payload's existing permission system to function with external authentication.

**Migration Rollback Planning**: Maintain the ability to revert to Payload's built-in authentication during initial deployment. Implement feature flags controlling authentication routing, allowing quick rollback if issues arise. Gradual user migration with parallel systems provides additional safety.

## Implementation Roadmap

**Phase 1 - Foundation (2 weeks)**: Install Better Auth and PostgreSQL adapter for Payload. Configure basic authentication with email/password support. Implement session management middleware for Payload integration. Test basic authentication flows and session persistence.

**Phase 2 - Database Migration (3 weeks)**: Execute MongoDB to PostgreSQL migration for Payload data. Preserve all authentication-related data with verification. Implement dual-write for zero-downtime transition. Validate data integrity and authentication functionality.

**Phase 3 - OAuth and Advanced Features (2 weeks)**: Configure Google and GitHub OAuth providers. Implement magic link authentication for passwordless login. Set up 2FA with TOTP and backup codes. Test all authentication methods thoroughly.

**Phase 4 - Production Deployment (2 weeks)**: Deploy with comprehensive monitoring and alerting. Implement gradual user migration strategy. Configure performance optimization and caching. Complete security audit and penetration testing.

**Phase 5 - Optimization (1 week)**: Fine-tune based on production metrics. Implement advanced features like trusted devices. Optimize database queries and caching strategies. Document operational procedures and troubleshooting guides.

## Security Best Practices

Implement comprehensive security measures including HTTPS-only communication with HSTS headers, secure cookie attributes (HttpOnly, Secure, SameSite), and proper CORS configuration for API endpoints. Use strong password hashing (Better Auth uses bcrypt by default) and implement rate limiting on authentication endpoints.

Session security requires proper entropy in token generation, automatic session invalidation on privilege changes, and comprehensive audit logging of authentication events. Regular security reviews should examine authentication logs for anomalies, update dependencies for security patches, and test authentication flows for vulnerabilities.

## Conclusion

Integrating Better Auth with Payload CMS v3.45 creates a powerful, flexible authentication system suitable for enterprise applications. Better Auth's comprehensive feature set combined with Payload's customizable architecture enables sophisticated authentication scenarios while maintaining security and performance.

Success requires careful planning, especially for database migration and permission synchronization. The phased implementation approach minimizes risk while allowing validation at each step. With proper architecture and security considerations, this integration provides a foundation for scalable, secure authentication that can grow with your application's needs.

The investment in this integration pays dividends through improved security, better user experience with features like magic links and 2FA, and centralized authentication management across multiple applications. Regular monitoring and optimization ensure the system continues meeting performance and security requirements as usage scales.