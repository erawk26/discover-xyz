# Design Tokens & Variables

Design tokens are the visual design atoms of our design system - the smallest pieces like colors, typography, spacing, and shadows.

## 🎨 Color System

### Semantic Colors

Our color system uses HSL values with CSS variables for easy theming. These are defined in `/src/app/(frontend)/globals.css`.

#### Core Palette

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|--------|
| `background` | `0 0% 100%` | `0 0% 0%` | Page backgrounds |
| `foreground` | `222.2 84% 4.9%` | `210 40% 98%` | Primary text |
| `card` | `240 5% 96%` | `0 0% 4%` | Card backgrounds |
| `card-foreground` | `222.2 84% 4.9%` | `210 40% 98%` | Card text |
| `popover` | `0 0% 100%` | `222.2 84% 4.9%` | Popover backgrounds |
| `popover-foreground` | `222.2 84% 4.9%` | `210 40% 98%` | Popover text |

#### Interactive Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|--------|
| `primary` | `222.2 47.4% 11.2%` | `210 40% 98%` | Primary actions |
| `primary-foreground` | `210 40% 98%` | `222.2 47.4% 11.2%` | Text on primary |
| `secondary` | `210 40% 96.1%` | `217.2 32.6% 17.5%` | Secondary actions |
| `secondary-foreground` | `222.2 47.4% 11.2%` | `210 40% 98%` | Text on secondary |
| `accent` | `210 40% 96.1%` | `217.2 32.6% 17.5%` | Accents & highlights |
| `accent-foreground` | `222.2 47.4% 11.2%` | `210 40% 98%` | Text on accent |

#### Feedback Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|--------|
| `destructive` | `0 84.2% 60.2%` | `0 62.8% 30.6%` | Errors & destructive actions |
| `destructive-foreground` | `210 40% 98%` | `210 40% 98%` | Text on destructive |
| `success` | `142 76% 36%` | `142 76% 56%` | Success states |
| `success-foreground` | `142 76% 20%` | `142 76% 76%` | Text on success |
| `warning` | `38 92% 50%` | `38 92% 65%` | Warning states |
| `warning-foreground` | `38 92% 30%` | `38 92% 85%` | Text on warning |
| `error` | `0 84% 60%` | `0 84% 70%` | Error states |
| `error-foreground` | `0 84% 40%` | `0 84% 90%` | Text on error |

#### UI Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|--------|
| `muted` | `210 40% 96.1%` | `217.2 32.6% 17.5%` | Muted backgrounds |
| `muted-foreground` | `215.4 16.3% 46.9%` | `215 20.2% 65.1%` | Muted text |
| `border` | `240 6% 80%` | `217.2 32.6% 17.5%` | Borders |
| `input` | `214.3 31.8% 91.4%` | `217.2 32.6% 17.5%` | Input backgrounds |
| `ring` | `222.2 84% 4.9%` | `212.7 26.8% 83.9%` | Focus rings |

### Brand Colors

Defined in `tailwind.config.ts`:

```js
brand: {
  primary: {
    DEFAULT: '#2563eb',
    hover: '#1d4ed8',
    active: '#1e40af',
  },
  secondary: '#7c3aed',
  accent: '#06b6d4',
}
```

### Using Colors

```tsx
// Semantic colors (preferred)
<div className="bg-background text-foreground">
  <button className="bg-primary text-primary-foreground">
    Primary Button
  </button>
</div>

// Brand colors
<div className="bg-brand-primary hover:bg-brand-primary-hover">
  Branded Element
</div>

// Feedback colors
<Alert className="bg-success/10 text-success-foreground">
  Success message
</Alert>
```

## 📏 Spacing System

### Spacing Scale

Based on Tailwind's spacing scale (1 unit = 0.25rem = 4px):

| Class | Size | Pixels | Usage |
|-------|------|--------|--------|
| `p-0` | 0 | 0px | No spacing |
| `p-0.5` | 0.125rem | 2px | Tight spacing |
| `p-1` | 0.25rem | 4px | Minimal spacing |
| `p-2` | 0.5rem | 8px | Small spacing |
| `p-3` | 0.75rem | 12px | Compact spacing |
| `p-4` | 1rem | 16px | Default spacing |
| `p-5` | 1.25rem | 20px | Comfortable spacing |
| `p-6` | 1.5rem | 24px | Medium spacing |
| `p-8` | 2rem | 32px | Large spacing |
| `p-10` | 2.5rem | 40px | Extra large |
| `p-12` | 3rem | 48px | Huge spacing |
| `p-16` | 4rem | 64px | Maximum spacing |

### Common Patterns

```tsx
// Card padding
<Card className="p-6">

// Form spacing
<form className="space-y-4">

// Section spacing
<section className="py-16 md:py-24">

// Container padding
<div className="container px-4 md:px-6">
```

## 🔤 Typography

### Font Families

```css
--font-sans: 'Geist Sans', system-ui, -apple-system, sans-serif;
--font-mono: 'Geist Mono', 'Courier New', monospace;
```

### Font Sizes

| Class | Size | Line Height | Usage |
|-------|------|-------------|--------|
| `text-xs` | 0.75rem | 1rem | Captions, labels |
| `text-sm` | 0.875rem | 1.25rem | Small text |
| `text-base` | 1rem | 1.5rem | Body text |
| `text-lg` | 1.125rem | 1.75rem | Large body |
| `text-xl` | 1.25rem | 1.75rem | Small headings |
| `text-2xl` | 1.5rem | 2rem | Section headings |
| `text-3xl` | 1.875rem | 2.25rem | Page headings |
| `text-4xl` | 2.25rem | 2.5rem | Large headings |
| `text-5xl` | 3rem | 1 | Hero headings |
| `text-6xl` | 3.75rem | 1 | Display text |

### Responsive Typography

Headings use fluid sizing with `clamp()`:

```css
h1 { font-size: clamp(2rem, 4vw + 1rem, 3.75rem); }
h2 { font-size: clamp(1.5rem, 3vw + 0.75rem, 3rem); }
h3 { font-size: clamp(1.25rem, 2vw + 0.5rem, 2.25rem); }
h4 { font-size: clamp(1.125rem, 1.5vw + 0.5rem, 1.875rem); }
h5 { font-size: clamp(1rem, 1vw + 0.5rem, 1.5rem); }
h6 { font-size: clamp(0.875rem, 0.5vw + 0.5rem, 1.25rem); }
```

### Font Weights

| Class | Weight | Usage |
|-------|--------|--------|
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | Emphasis |
| `font-semibold` | 600 | Subheadings |
| `font-bold` | 700 | Headings |

## 📐 Layout Tokens

### Breakpoints

| Breakpoint | Min Width | Usage |
|------------|-----------|--------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Wide desktop |
| `2xl` | 1376px | Ultra-wide |

### Container

```css
.container {
  max-width: 86rem; /* 1376px */
  margin: 0 auto;
  padding-left: var(--container-padding);
  padding-right: var(--container-padding);
}

/* Responsive padding */
--container-padding-default: 1rem;
--container-padding-sm: 1rem;
--container-padding-md: 2rem;
--container-padding-lg: 2rem;
--container-padding-xl: 2rem;
--container-padding-2xl: 2rem;
```

### Border Radius

| Token | Value | Usage |
|-------|-------|--------|
| `rounded-sm` | calc(var(--radius) - 4px) | Small elements |
| `rounded` | var(--radius) | Default (0.2rem) |
| `rounded-md` | calc(var(--radius) - 2px) | Medium elements |
| `rounded-lg` | var(--radius) | Large elements |
| `rounded-xl` | 0.75rem | Extra large |
| `rounded-2xl` | 1rem | Cards, modals |
| `rounded-full` | 9999px | Circular elements |

## 🎭 Shadows

### Shadow Scale

| Class | Value | Usage |
|-------|-------|--------|
| `shadow-sm` | Small shadow | Subtle elevation |
| `shadow` | Default shadow | Cards, dropdowns |
| `shadow-md` | Medium shadow | Modals |
| `shadow-lg` | Large shadow | Popovers |
| `shadow-xl` | Extra large | High elevation |
| `shadow-2xl` | Huge shadow | Maximum elevation |

## 🎬 Animation

### Timing

```css
--animate-accordion: 0.2s;
```

### Common Animations

```tsx
// Fade in/out
<div className="animate-in fade-in duration-300">

// Slide animations
<div className="animate-in slide-in-from-top">

// Spin for loading
<div className="animate-spin">

// Pulse for skeleton
<div className="animate-pulse">
```

## 📦 Using Tokens

### In Components

```tsx
// Always use semantic tokens
<div className="bg-card text-card-foreground p-6 rounded-lg border">
  <h2 className="text-xl font-semibold mb-4">Title</h2>
  <p className="text-muted-foreground">Description</p>
</div>

// Responsive with tokens
<section className="py-8 md:py-12 lg:py-16">
  <div className="container">
    <h1 className="text-3xl md:text-4xl lg:text-5xl">
      Responsive Heading
    </h1>
  </div>
</section>
```

### In Custom CSS

```css
/* Access tokens in CSS */
.custom-element {
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  padding: theme(spacing.4);
  border-radius: var(--radius);
}

/* Use Tailwind theme function */
.custom-card {
  background: theme(colors.card.DEFAULT);
  border: 1px solid theme(colors.border);
}
```

### Dark Mode

```tsx
// Automatic with semantic tokens
<Card> {/* Adapts to theme */}
  <CardContent>
    Content automatically themed
  </CardContent>
</Card>

// Manual dark mode classes
<div className="bg-white dark:bg-black">
  Manual theme control
</div>
```

## 🔄 Token Updates

When modifying tokens:

1. **Update CSS Variables** in `/src/app/(frontend)/globals.css`
2. **Update Tailwind Config** if adding new tokens
3. **Test both themes** (light and dark)
4. **Update this documentation**
5. **Notify team** of breaking changes

## 📋 Token Checklist

Before using tokens:
- [ ] Use semantic colors, not hardcoded values
- [ ] Use spacing scale, not arbitrary values
- [ ] Use typography scale for font sizes
- [ ] Test in both light and dark modes
- [ ] Verify responsive behavior
- [ ] Document any new tokens added

## 🔗 References

- [CSS Variables Definition](../../src/app/(frontend)/globals.css)
- [Tailwind Configuration](../../tailwind.config.ts)
- [Component Examples](./components.md)