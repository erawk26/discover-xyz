# Claude AI Development Guidelines

## Core Principles

### 1. Follow the Plan
- ALWAYS refer to PROJECT_PLAN.md before making changes
- Work on one phase/task at a time
- Complete current task before moving to next
- If unclear, ASK before proceeding

### 2. Test-Driven Development (TDD)
- Write tests FIRST, implementation second
- Red → Green → Refactor cycle
- Never write code without existing tests
- Tests should fail initially, then pass after implementation

### 3. Small, Incremental Changes
- Make one logical change per commit
- Each change should be testable
- Avoid large, sweeping modifications
- If a change feels too big, break it down

### 4. Communication
- Explain WHAT you're doing and WHY
- Show relevant code snippets when discussing changes
- Admit when something is unclear
- Ask for clarification instead of guessing

## Development Workflow

### Before Starting Any Task
1. Check PROJECT_PLAN.md for current phase
2. Review existing tests
3. Understand the acceptance criteria
4. Identify dependencies

### When Writing Code
1. Start with test file
2. Write failing test
3. Run test to confirm it fails
4. Write minimal code to pass
5. Run test to confirm it passes
6. Refactor if needed
7. Commit with clear message

### Commit Messages
- Use conventional commits (feat:, fix:, test:, docs:, refactor:)
- Be specific about what changed
- Reference issue/task numbers if applicable
- Keep under 72 characters

## What NOT to Do

### Never
- leave unworking changes
- Jump ahead in the project plan
- Write implementation before tests
- Make assumptions about requirements
- Overcomplicate solutions
- Add features not in the plan
- Use external services without approval

### Avoid
- Large commits with multiple changes
- crediting claude code in commits
- Vague commit messages
- Untested code
- Breaking existing functionality
- Ignoring error messages

## File Organization

### Test Files
- Place in `__tests__` directories
- Name as `[feature].test.ts`
- Group related tests together
- Use descriptive test names

### Implementation Files
- Follow existing project structure
- Keep files focused and small
- Use clear, descriptive names
- Add types for TypeScript

## Error Recovery

### When Things Go Wrong
1. Stop and assess what happened
2. Read error messages carefully
3. Check if tests are failing
4. Revert if necessary
5. Communicate the issue
6. Get approval for fix approach

### Before Reverting
- Understand what went wrong
- Document the issue
- Have a fix plan
- Get approval if major change

## Quality Standards

### Code Quality
- Type-safe (TypeScript)
- Well-tested (>80% coverage)
- Readable and maintainable
- Follows project conventions

### Documentation
- Update README if needed
- Document complex logic
- Keep comments minimal but helpful
- Update PROJECT_PLAN.md progress

## Specific to This Project

### Better Auth Integration
- MongoDB remains primary DB (Phase 1-4)
- PostgreSQL is future phase only
- Start with basic auth, add features incrementally
- Maintain backward compatibility

### Key Documentation
- **integrating-better-auth-with-payload.md** - Contains valuable technical details about:
  - Better Auth architecture and patterns
  - Payload CMS authentication system
  - Integration challenges and solutions
  - Security best practices
  - Database migration strategies
- Always consult this document for implementation details

### Testing Auth
- Mock external services
- Use test database
- Clean up after tests
- Test both success and failure paths

## Daily Checklist

- [ ] Reviewed PROJECT_PLAN.md
- [ ] Working on correct phase/task
- [ ] Tests written before code
- [ ] All tests passing
- [ ] Changes are incremental
- [ ] Commits are clear
- [ ] No assumptions made

## Remember

You are an assistant, not the architect. Follow the plan, ask questions, and implement carefully. Quality over speed, clarity over cleverness.