# Project Development Guidelines

## 👤 Personal Interaction Guidelines
- Refer to me as Supreme Dork
- It's okay to disagree with me

## 🧪 Development Standards

### All New Features Must Follow:
1. **Clean Code Principles**
   - Write self-documenting code with clear, descriptive names
   - Keep functions small and focused (single responsibility)
   - Minimize code duplication through proper abstraction
   - Use consistent formatting and style conventions
   - Write code that is easy to read and understand

2. **Test-Driven Development (TDD)**
   - **RED**: Write failing tests that define expected behavior
   - **GREEN**: Implement minimal code to make tests pass
   - **REFACTOR**: Clean up and optimize while maintaining test coverage
   - All features must have comprehensive test coverage
   - All tests must pass before code is considered complete

3. **Quality Gates**
   - No build errors
   - No TypeScript errors
   - No linting errors
   - All tests passing
   - Code review approved

## 🔧 Development Workflow

### DO NOT:
- Make assumptions instead of understanding
- Stack fixes on broken fixes
- Claim things work before TESTING
- Use `as any` in TypeScript - fix types properly
- use console statements unless you have a valid reason to (theres a dedicated logger)
- Consider tasks complete until all quality checks pass

### Testing Strategy
- Prefer running single tests over the full test suite for performance
- Follow TDD principles: Test current state → Make changes → Test again → Present solution
- Execute all unit tests with `pnpm test`
- Verify test coverage is adequate (>90%)
- Ensure mock data is realistic

### Problem-Solving Approach
- Use available tools to diagnose issues
- Read error logs, check responses, understand what's actually failing
- Identify the exact failure point with NO assumptions, only facts

### Quality Standards
Don't consider tasks complete until the project is free from:
- Build errors
- TypeScript errors
- Linting errors

**YOU MUST typecheck after making code changes**
**Clean up deprecated code/files when refactoring**

## 🏗️ Coding Standards and Best Practices

### General Guidelines
- Follow [Payload Coding Standards](https://payloadcms.com/docs/) when configuring CMS
- Maintain consistent naming conventions in API development
- Always consider GraphQL schema backwards compatibility when proposing changes
- Test all GraphQL queries manually before implementation

### Documentation Requirements
- Update documentation when new features are added or existing features are modified
- Document all GraphQL schema changes thoroughly
- Ensure all documentation is interconnected with cross-links

## 🎯 Quality Assurance
- Have all checks passed? Don't bother the user until you're ABSOLUTELY certain your solution is working
- All new code must pass the comprehensive quality audit before being considered complete

## 🔍 "Kick the Tires" Workflow

When asked to "kick the tires", perform this comprehensive quality audit:

### 📋 Quality Audit Checklist

☐ **Code Review: Check for unused code and readability issues**
   - Scan for unused imports, variables, and functions
   - Identify overly complex methods (>50 lines)
   - Check for code duplication (>70% similarity)
   - Assess readability for new developers
   - Verify consistent code style and patterns

☐ **Security Audit: Perform penetration testing**
   - Validate input sanitization and path traversal protection
   - Check for credential exposure in config files
   - Test bearer token validation and format checking
   - Verify file system security (directory restrictions)
   - Assess error message information leakage

☐ **Check naming consistency across codebase**
   - Verify consistent terminology 
   - Check API naming conventions alignment
   - Validate TypeScript interface naming
   - Ensure consistent file and directory naming
   - Review function and variable naming clarity

☐ **Organize and update documentation with cross-links**
   - Update README with current functionality
   - Ensure all documentation is interconnected
   - Add navigation between related docs
   - Verify example code is current and working
   - Check for outdated or missing documentation

☐ **Run all build/generate/sync commands to test functionality**
   - Verify logging and error handling

☐ **Run complete test suite**
   - Execute all unit tests (`pnpm test`)
   - Verify test coverage is adequate (>90%)
   - Check for failing or flaky tests
   - Validate edge case handling
   - Ensure mock data is realistic

☐ **Analyze logs for issues and optimizations**
   - Check for performance bottlenecks
   - Identify potential error conditions
   - Verify state transition logic correctness
   - Look for optimization opportunities

### 📊 Expected Deliverables

After "kicking the tires", generate a **TIRES-KICKED.md** report containing:

1. **Quality Score Summary** (Code/Security/Documentation/Tests)
2. **Critical Issues Found** (with priority levels)
3. **Recommendations** (actionable improvements)
4. **Test Results** (pass/fail counts and key metrics)
5. **Performance Insights** (bottlenecks, optimization opportunities)

### 🎯 Success Criteria

A project passes "tire kicking" when:
- Code quality score ≥ 8/10
- Security assessment ≥ B grade
- All tests pass (100% success rate)
- No critical security vulnerabilities
- Documentation is complete and up-to-date
- All core functionality works as expected
- **TIRES-KICKED.md report created**

This comprehensive audit ensures production readiness and maintains high code quality standards.

## 🔥 "Fucking Fix It" (FFF) Workflow

When Supreme Dork says "fuckin fix it" or "FFF", execute this autonomous debugging workflow WITHOUT reporting back until the issue is completely resolved:

### 🎯 FFF Protocol: Silent Fix Mode

1. **DIAGNOSE** - Identify the root cause
   - Read error logs and traces
   - Test current behavior to understand what's broken
   - Identify the exact failure point
   - NO assumptions, only facts

2. **IMPLEMENT** - Apply targeted fixes
   - Fix the actual problem, not symptoms
   - Follow proper TypeScript typing (never use `as any`)
   - Maintain code quality standards
   - Test each fix immediately

3. **VALIDATE** - Prove the fix works
   - Start required processes (job runners, servers, etc.)
   - Execute end-to-end test scenarios
   - Verify expected behavior occurs
   - Check for completion timestamps, data output, proper status

4. **VERIFY** - Confirm system integrity
   - Run TypeScript compilation
   - Check for new errors introduced
   - Test edge cases and error conditions
   - Ensure no regressions

5. **DOCUMENT** - Create proof report
   - Generate **I-FUCKIN-FIXED-IT.md** report with evidence
   - Include test results, screenshots, logs
   - Document what was broken and how it's fixed
   - Provide steps to verify the fix works

### 🚫 FFF Rules:
- **NO "check this" responses** - I fix it completely
- **NO partial solutions** - work until it's actually working
- **NO assumptions** - test everything
- **NO type bypassing** - fix types properly
- **NO reporting back** until success is proven

### ✅ FFF Success Criteria:
- Issue is completely resolved
- All tests pass
- System works end-to-end
- No new errors introduced
- Proper completion times/data shown
- TypeScript compiles without issues
- **I-FUCKIN-FIXED-IT.md report created**

**Only report back when the fix is complete, verified working, and documented.**

## 🔐 PayloadCMS Admin Access
- **URL:** http://localhost:3026/admin
- **Email:** cedric@grr.la
- **Password:** password123
- **Role:** Admin
- **Purpose:** Testing FedSync operations and admin functionality or confirming changes have worked.