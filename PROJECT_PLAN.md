# Better Auth Integration Project Plan

## Overview
Integrate Better Auth with Payload CMS v3.45 following Test-Driven Development (TDD) principles.

## Current State
- Payload CMS v3.45 with MongoDB
- Built-in Payload authentication
- No external auth providers

## Target State
- Better Auth handling all authentication
- PostgreSQL database (future phase)
- OAuth providers (Google, GitHub)
- Magic links and 2FA support

## Phase 1: Foundation Setup (Current Sprint)

### 1.1 Test Infrastructure
- [ ] Set up test environment for auth testing
- [ ] Create test utilities for auth mocking
- [ ] Define test fixtures for users and sessions

### 1.2 Better Auth Installation
- [ ] Write tests for auth configuration
- [ ] Install Better Auth dependencies
- [ ] Create basic Better Auth setup
- [ ] Verify tests pass

### 1.3 Session Management
- [ ] Write tests for session validation
- [ ] Write tests for session creation
- [ ] Implement session middleware
- [ ] Integrate with Payload requests

### 1.4 Basic Authentication
- [ ] Write tests for login/logout
- [ ] Write tests for user registration
- [ ] Implement auth routes
- [ ] Connect to existing MongoDB

## Phase 2: User Synchronization

### 2.1 User Model Mapping
- [ ] Write tests for user data mapping
- [ ] Define Better Auth user schema
- [ ] Create sync functions
- [ ] Test bidirectional sync

### 2.2 Role Integration
- [ ] Write tests for role mapping
- [ ] Map Payload roles to Better Auth
- [ ] Implement role sync
- [ ] Test permission preservation

## Phase 3: OAuth Providers

### 3.1 Google OAuth
- [ ] Write tests for Google OAuth flow
- [ ] Configure Google provider
- [ ] Test user creation from OAuth
- [ ] Verify role assignment

### 3.2 GitHub OAuth
- [ ] Write tests for GitHub OAuth flow
- [ ] Configure GitHub provider
- [ ] Test email scope handling
- [ ] Verify user linking

## Phase 4: Advanced Features

### 4.1 Magic Links
- [ ] Write tests for magic link flow
- [ ] Implement email sending
- [ ] Test token validation
- [ ] Verify user creation

### 4.2 Two-Factor Authentication
- [ ] Write tests for 2FA enrollment
- [ ] Implement TOTP generation
- [ ] Test verification flow
- [ ] Implement backup codes

## Phase 5: Database Migration (Future)

### 5.1 PostgreSQL Setup
- [ ] Write migration tests
- [ ] Install PostgreSQL adapter
- [ ] Create migration scripts
- [ ] Test data integrity

### 5.2 Zero-Downtime Migration
- [ ] Implement dual-write pattern
- [ ] Test concurrent operations
- [ ] Verify data consistency
- [ ] Complete cutover

## Testing Strategy

### Unit Tests
- Auth configuration
- Session management
- User synchronization
- Role mapping

### Integration Tests
- OAuth flows
- Magic link process
- 2FA enrollment
- Database operations

### E2E Tests
- Complete login flow
- OAuth provider flows
- Permission verification
- Session management

## Success Criteria
1. All tests passing
2. Zero authentication downtime
3. Existing users can login
4. OAuth providers functional
5. Sessions properly managed
6. Roles correctly mapped

## Risk Mitigation
1. Feature flags for rollback
2. Parallel auth systems during transition
3. Comprehensive logging
4. Database backups before migration
5. Staged rollout plan

## Current Focus: Phase 1.1 - Test Infrastructure
Let's start by setting up the testing foundation before any implementation.