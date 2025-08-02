# DiscoverXYZ Documentation

[← Back to Main Project](../README.md)

Welcome to the comprehensive documentation for DiscoverXYZ. This directory contains all project documentation organized by category for easy navigation.

## 📊 Project Overview

### Status & Progress
- **[Progress Report](./PROGRESS-REPORT.md)** - Current project status, metrics, and roadmap
- **[Tech Stack](./TECH-STACK.md)** - Complete technology stack breakdown
- **[Architecture Overview](./ARCHITECTURE.md)** - System design and structure
- **[Project Plan](./PROJECT_PLAN.md)** - Features and implementation roadmap

## 🚀 Getting Started

### Setup & Configuration
- **[Quick Start Guide](../README.md#quick-start-for-developers)** - Set up the project locally
- **[Environment Setup](../README.md#environment-setup)** - Configuration and environment variables
- **[Branding Guide](./BRANDING_GUIDE.md)** - Customize the application's appearance

## 🔐 Authentication & Security

### Authentication System
- **[Authentication Setup](./AUTH_SETUP.md)** - Better Auth and OAuth configuration
- **[Access Control Guide](../src/access/README.md)** - User roles and permissions

## 📊 Data Management

### External Integrations
- **[FedSync Integration](./fedsync/README.md)** - Data synchronization with FedSync API
  - [API Usage Guide](./fedsync/API-USAGE.md)
  - [Import Strategy](./fedsync/FEDSYNC-IMPORT-STRATEGY.md)
- **[Cron Setup Examples](./CRON_EXAMPLES.md)** - Automated data synchronization

## 👩‍💻 Development

### Development Guidelines
- **[Testing Guide](./TESTING.md)** - Running and writing tests
- **[API Documentation](./API.md)** - API endpoints and usage
- **[Development Standards](../CLAUDE.md)** - Project standards and team workflow

## 📈 Project Reports

### Quality Assessments
- **[Project Reports Archive](./reports/README.md)** - Historical audit reports and assessments
  - [Comprehensive Health Report](./reports/TIRES-KICKED.md)
  - [Security Audit](./reports/SECURITY-AUDIT.md)
  - [Code Cleanup Report](./reports/MARIE-CLEANUP-REPORT.md)
  - [UI/UX Review](./reports/UI-UX-REVIEW.md)
  - [Accessibility Audit](./reports/ACCESSIBILITY-AUDIT.md)
  - [Test Analysis](./reports/TEST-ANALYSIS-REPORT.md)

## 🤖 AI Assistant Guidelines

### Internal AI Documentation
- **AI Assistant Guidelines (Internal Use Only)** - Specialized documentation for AI assistants working on this codebase

> **Note**: The `docs/ai/` directory contains internal guidelines, protection rules, and workflow documentation specifically designed for AI assistants. This includes coding standards, anti-patterns to avoid, and project context preservation between sessions. These files are for AI assistant reference only and are not part of the main project documentation.

## 📋 Quick Reference

### Common Tasks
| Task | Documentation | Quick Command |
|------|---------------|---------------|
| Setup Project | [Quick Start](../README.md#quick-start-for-developers) | `pnpm install && pnpm dev` |
| Run Tests | [Testing Guide](./TESTING.md) | `pnpm test` |
| Sync Data | [FedSync Integration](./fedsync/README.md) | `pnpm sync && pnpm import` |
| Admin Access | [Authentication Setup](./AUTH_SETUP.md) | http://localhost:3026/admin |
| Build Project | [Development Standards](../CLAUDE.md) | `pnpm build` |

### Key Resources
| Resource | Purpose | Location |
|----------|---------|----------|
| Project Status | Current progress and roadmap | [Progress Report](./PROGRESS-REPORT.md) |
| Setup Instructions | Getting started guide | [Main README](../README.md) |
| API Reference | Endpoint documentation | [API Docs](./API.md) |
| Authentication | Auth setup and configuration | [Auth Setup](./AUTH_SETUP.md) |
| Data Sync | External data integration | [FedSync Docs](./fedsync/README.md) |

## 🔍 Documentation Standards

### Navigation Principles
- **Clear hierarchy**: Documentation is organized by function and audience
- **Cross-references**: Related documents link to each other
- **Up-to-date**: Documentation reflects current project state
- **Comprehensive**: All aspects of the project are documented

### File Organization
```
docs/
├── README.md              # This file - main documentation index
├── PROGRESS-REPORT.md     # Current project status and roadmap
├── TECH-STACK.md          # Complete technology breakdown
├── ARCHITECTURE.md        # System design and data flow
├── PROJECT_PLAN.md        # Better Auth integration details
├── AUTH_SETUP.md          # Authentication configuration guide
├── API.md                 # REST/GraphQL API documentation
├── TESTING.md             # Testing strategies and guidelines
├── BRANDING_GUIDE.md      # UI customization and theming
├── CRON_EXAMPLES.md       # Automated synchronization setup
├── fedsync/               # External data integration
│   ├── README.md          # FedSync integration overview
│   ├── API-USAGE.md       # API endpoint usage guide
│   └── FEDSYNC-IMPORT-STRATEGY.md  # Data import methodology
├── reports/               # Historical quality assessments
│   ├── README.md          # Report archive index
│   ├── TIRES-KICKED.md    # Comprehensive health report
│   ├── SECURITY-AUDIT.md  # Security vulnerability analysis
│   ├── MARIE-CLEANUP-REPORT.md  # Code quality assessment
│   ├── UI-UX-REVIEW.md    # Design consistency review
│   ├── ACCESSIBILITY-AUDIT.md   # WCAG compliance analysis
│   └── TEST-ANALYSIS-REPORT.md  # Test coverage analysis
└── ai/                    # AI assistant guidelines (internal)
    ├── README.md          # AI documentation index
    ├── PROJECT-REQUIREMENTS.md   # Project requirements reference
    ├── PROJECT-PROGRESS.md       # AI work tracking
    ├── AI-PROTECTION-RULES.md    # Coding standards and anti-patterns
    ├── AI-WORKFLOW.md            # AI development workflow
    └── [other AI tools and configs]
```

## 🔄 Keeping Documentation Updated

This documentation is actively maintained. When making changes to the project:

1. **Update relevant docs** - Keep documentation synchronized with code changes
2. **Cross-reference updates** - Update links when files are moved or renamed
3. **Version documentation** - Note significant changes in progress reports
4. **Review completeness** - Ensure new features are properly documented

---

*This documentation serves developers, contributors, and AI assistants working on the DiscoverXYZ project. For questions or improvements, refer to the [Development Guidelines](../CLAUDE.md).*