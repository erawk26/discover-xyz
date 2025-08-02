# Tailwind CSS v4 Migration Plan

[← Back to Main Documentation](./README.md)

## Overview

This document outlines the migration strategy from Tailwind CSS v3.4.3 to v4.x for the DiscoverXYZ project. Tailwind v4 introduces significant architectural changes including a CSS-first configuration approach and modern CSS features.

## Current State Analysis

### Version Information
- **Current Version**: Tailwind CSS v3.4.3
- **Target Version**: Tailwind CSS v4.0+
- **Migration Complexity**: Medium-High

### Dependencies
- `tailwindcss`: ^3.4.3
- `tailwindcss-animate`: ^1.0.7
- `@tailwindcss/typography`: ^0.5.13
- `autoprefixer`: ^10.4.19 (will be removed in v4)

## Key Breaking Changes

### 1. Configuration System Migration
**Current (v3)**: JavaScript-based configuration in `tailwind.config.mjs`
**New (v4)**: CSS-first configuration using CSS directives

### 2. Import Method Changes
**Current (v3)**:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**New (v4)**:
```css
@import "tailwindcss";
```

### 3. Package Structure
- PostCSS plugin moved to `@tailwindcss/postcss`
- CLI moved to dedicated package
- `autoprefixer` no longer needed (handled automatically)

### 4. Browser Requirements
- Safari 16.4+
- Chrome 111+
- Firefox 128+
- **Impact**: May need to maintain v3 for older browser support

## Migration Checklist

### Phase 1: Preparation (1-2 days)
- [ ] Audit browser support requirements
- [ ] Review all custom Tailwind configurations
- [ ] Document all custom utilities and variants
- [ ] Test current build performance baseline
- [ ] Create migration branch

### Phase 2: Dependency Updates (1 day)
- [ ] Update Node.js to v20+ (required for migration tool)
- [ ] Back up current configuration files
- [ ] Install Tailwind v4 upgrade tool
- [ ] Review plugin compatibility

### Phase 3: Automated Migration (1 day)
- [ ] Run Tailwind v4 upgrade tool
- [ ] Review automated changes
- [ ] Test build process
- [ ] Verify CSS output

### Phase 4: Manual Adjustments (2-3 days)
- [ ] Convert custom configuration to CSS-first approach
- [ ] Update dynamic value syntax (remove square brackets)
- [ ] Fix gradient utilities (preserve via colors)
- [ ] Update container utility usage
- [ ] Fix transition-transform properties

### Phase 5: Testing & Optimization (2 days)
- [ ] Run full test suite
- [ ] Visual regression testing
- [ ] Performance benchmarking
- [ ] Fix any style inconsistencies
- [ ] Update documentation

## Specific Changes for DiscoverXYZ

### Configuration Migration

**Current `tailwind.config.mjs`**:
```javascript
theme: {
  extend: {
    colors: {
      accent: {
        DEFAULT: 'hsl(var(--accent))',
        foreground: 'hsl(var(--accent-foreground))',
      },
      // ... other custom colors
    }
  }
}
```

**New CSS-first approach**:
```css
@theme {
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  /* ... other custom colors */
}
```

### Component Updates Required

1. **Dynamic Values**:
   - Search for patterns like `h-[100px]`, `grid-cols-[15]`
   - Update to `h-100`, `grid-cols-15`

2. **Container Utility**:
   - Current: Uses `center`, `padding` config options
   - New: Must use utility classes directly

3. **Transition Properties**:
   - Update `transition-transform` to include new properties
   - Add `translate`, `scale`, `rotate` to transition list

### Plugin Compatibility

| Plugin | Status | Action Required |
|--------|--------|----------------|
| `tailwindcss-animate` | ⚠️ Unknown | Test after migration |
| `@tailwindcss/typography` | ✅ Compatible | Update to v4 version |

## Migration Commands

```bash
# 1. Install upgrade tool (requires Node.js 20+)
npx @tailwindcss/upgrade@latest

# 2. Run automated migration
npx @tailwindcss/upgrade@latest --force

# 3. Install new dependencies
pnpm add -D tailwindcss@latest @tailwindcss/postcss@latest

# 4. Remove old dependencies
pnpm remove autoprefixer postcss-import
```

## Risk Mitigation

### Rollback Plan
1. Keep v3 branch available for 30 days
2. Document all manual changes
3. Maintain compatibility layer if needed

### Gradual Migration Option
If full migration is too risky:
1. Run v3 and v4 in parallel temporarily
2. Migrate components incrementally
3. Use feature flags for v4 styles

## Performance Expectations

Based on Tailwind v4 benchmarks:
- **Full rebuilds**: ~3.5x faster
- **Incremental builds**: ~8x faster
- **Smaller CSS output**: Better tree-shaking

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Preparation | 1-2 days | Team alignment |
| Dependency Updates | 1 day | Node.js 20+ |
| Automated Migration | 1 day | Backup complete |
| Manual Adjustments | 2-3 days | Dev resources |
| Testing & Optimization | 2 days | QA resources |
| **Total** | **7-9 days** | |

## Success Criteria

- [ ] All tests passing
- [ ] No visual regressions
- [ ] Build time improved by >2x
- [ ] Browser compatibility maintained
- [ ] Zero runtime errors
- [ ] Documentation updated

## Post-Migration Tasks

1. Update CI/CD pipelines
2. Train team on new syntax
3. Update coding standards
4. Monitor for issues (30 days)
5. Remove v3 compatibility code

## Resources

- [Official Tailwind v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [Tailwind v4 Release Notes](https://tailwindcss.com/blog/tailwindcss-v4)
- [CSS-first Configuration Guide](https://tailwindcss.com/docs/v4/configuration)
- [Browser Compatibility Table](https://tailwindcss.com/docs/v4/browser-support)

## Questions to Resolve

1. Do we need to support browsers older than Safari 16.4?
2. Are all our Tailwind plugins v4 compatible?
3. Should we migrate gradually or all at once?
4. What's our rollback timeline if issues arise?

---

*Last Updated: [Current Date]*
*Status: Planning Phase*