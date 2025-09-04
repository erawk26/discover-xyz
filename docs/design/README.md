# Design System Documentation

Welcome to the PayloadCMS Design System documentation. This is the single source of truth for all design decisions, patterns, and implementation guidelines.

## 📚 Documentation Structure

- **[components.md](./components.md)** - Component patterns and usage guidelines
- **[tokens.md](./tokens.md)** - Design tokens, variables, and theming

## 🎨 Design System Overview

Our design system is built on modern, accessible foundations:

### Technology Stack
- **[Tailwind CSS 4.0](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - React components built on Radix UI
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible component primitives
- **[Geist Font](https://vercel.com/font)** - Modern, legible font family

### Core Principles

1. **Consistency** - Use existing components and patterns before creating new ones
2. **Accessibility** - All components must meet WCAG 2.1 AA standards
3. **Performance** - Optimize for fast load times and smooth interactions
4. **Maintainability** - Write clean, documented, reusable code
5. **Responsiveness** - Design mobile-first, test across all breakpoints

## 🚀 Quick Start

### Using Design Tokens
```tsx
// Use semantic color tokens
<div className="bg-background text-foreground">
  <button className="bg-primary text-primary-foreground">
    Primary Action
  </button>
</div>

// Use spacing scale
<div className="p-4 md:p-6 lg:p-8">
  <h1 className="mb-2">Title</h1>
  <p className="mb-4">Content</p>
</div>
```

### Using Components
```tsx
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

// Always use design system components
<Card>
  <Input type="email" placeholder="Email" />
  <Button variant="primary">Submit</Button>
</Card>
```

## 🎯 Brand Identity

### Site Configuration
Set your site name in the environment:
```bash
SITE_NAME="Your Site Name"
```

This affects:
- Admin panel titles
- Logo displays
- Page metadata
- SEO titles

### Brand Colors
Our brand palette is defined in `tailwind.config.ts`:

- **Primary**: `#2563eb` - Main brand color
- **Secondary**: `#7c3aed` - Supporting accent
- **Accent**: `#06b6d4` - Highlight color

### Typography
- **Sans**: Geist Sans - UI text, body copy
- **Mono**: Geist Mono - Code, technical content

## 📐 Layout System

### Breakpoints
```js
sm: '640px'   // Mobile landscape
md: '768px'   // Tablet
lg: '1024px'  // Desktop
xl: '1280px'  // Wide desktop
2xl: '1376px' // Ultra-wide
```

### Container
- Responsive padding
- Max-width constraints
- Centered by default

### Grid System
- 12-column grid on desktop
- 4-column grid on mobile
- Gap utilities for spacing

## 🌓 Theme Support

### Available Themes
- **Light** - Clean, bright interface
- **Dark** - Low-light comfortable viewing
- **System** - Follows OS preference

### Implementation
```tsx
// Theme is automatically handled via CSS variables
// Components adapt without additional logic
<Button>Themed automatically</Button>
```

## ✅ Checklist for New Features

Before implementing any UI:

- [ ] Check if a component already exists in `/components/ui/`
- [ ] Use design tokens from `globals.css`
- [ ] Follow existing patterns in similar components
- [ ] Test on mobile, tablet, and desktop
- [ ] Verify dark mode appearance
- [ ] Check keyboard navigation
- [ ] Add loading states for async operations
- [ ] Include error states and empty states
- [ ] Document any new patterns created

## 🔗 Related Documentation

- [Tailwind Configuration](../../tailwind.config.ts)
- [Global Styles](../../src/app/(frontend)/globals.css)
- [UI Components](../../src/components/ui/)
- [Branding Guide](../BRANDING_GUIDE.md)

## 📝 Maintenance

This documentation should be updated whenever:
- New components are added
- Design tokens are modified
- Patterns are established or changed
- Brand guidelines are updated

Last updated: December 2024