# Component Usage Patterns

This document provides guidelines and examples for using the design system components correctly and consistently.

## 📦 Available Components

### Core UI Components
Located in `/src/components/ui/`:

- **Alert** - Status messages and notifications
- **Button** - Interactive actions
- **Card** - Content containers
- **Checkbox** - Selection controls
- **Dropdown Menu** - Contextual menus
- **Input** - Text input fields
- **Label** - Form field labels
- **LoadingButton** - Buttons with loading states
- **Pagination** - Page navigation
- **Select** - Dropdown selections
- **Skeleton** - Loading placeholders
- **Spinner** - Loading indicators
- **Textarea** - Multi-line text input

### Custom Components
- **ErrorBoundary** - Error handling wrapper
- **EmptyState** - No-data displays
- **UserMenu** - User account dropdown

## 🎯 Component Patterns

### Forms

#### ✅ Correct Implementation
```tsx
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingButton } from '@/components/ui/loading-button'

function LoginForm() {
  const [loading, setLoading] = useState(false)
  
  return (
    <form className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email"
          type="email"
          placeholder="Enter your email"
          className="mt-1"
        />
      </div>
      
      <div>
        <Label htmlFor="password">Password</Label>
        <Input 
          id="password"
          type="password"
          placeholder="Enter your password"
          className="mt-1"
        />
      </div>
      
      <LoadingButton 
        type="submit"
        loading={loading}
        className="w-full"
      >
        Sign In
      </LoadingButton>
    </form>
  )
}
```

#### ❌ Avoid This
```tsx
// Don't use raw HTML elements
<input className="mt-1 flex h-10 w-full rounded-md border..." />
<button className="px-4 py-2 bg-blue-600...">Submit</button>
```

### Cards & Content Containers

#### ✅ Correct Implementation
```tsx
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'

function ArticleCard({ article }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <h3 className="text-lg font-semibold">{article.title}</h3>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{article.excerpt}</p>
      </CardContent>
      <CardFooter>
        <Button variant="ghost" size="sm">Read More</Button>
      </CardFooter>
    </Card>
  )
}
```

### Loading States

#### ✅ Correct Implementation
```tsx
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { LoadingButton } from '@/components/ui/loading-button'

// Page loading skeleton
function PageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  )
}

// Inline loading
function LoadingSection() {
  return (
    <div className="flex items-center justify-center p-8">
      <Spinner size="lg" />
    </div>
  )
}

// Button with loading
<LoadingButton loading={isSubmitting}>
  Save Changes
</LoadingButton>
```

### Error Handling

#### ✅ Correct Implementation
```tsx
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { EmptyState } from '@/components/EmptyState'

// Error messages
function ErrorMessage({ error }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  )
}

// Empty states
function NoResults() {
  return (
    <EmptyState
      icon={<SearchIcon className="h-12 w-12" />}
      title="No results found"
      description="Try adjusting your search criteria"
      action={{
        label: "Clear filters",
        onClick: handleClearFilters
      }}
    />
  )
}

// Wrap components that might error
<ErrorBoundary fallback={<ErrorMessage />}>
  <RiskyComponent />
</ErrorBoundary>
```

### Navigation & Menus

#### ✅ Correct Implementation
```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive">
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

## 🎨 Styling Components

### Using Variants
```tsx
// Button variants
<Button variant="default">Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
<Button variant="destructive">Destructive</Button>

// Size variants
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon Only</Button>
```

### Extending with className
```tsx
// Add custom classes while preserving component styles
<Button className="w-full mt-4">
  Full Width Button
</Button>

<Input className="max-w-xs" />

<Card className="hover:shadow-xl transition-shadow">
  Hoverable Card
</Card>
```

### Composition Patterns
```tsx
// Combine components for complex UIs
function SearchBar() {
  return (
    <div className="flex gap-2">
      <Input 
        type="search"
        placeholder="Search..."
        className="flex-1"
      />
      <Button size="icon">
        <SearchIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}
```

## 📱 Responsive Patterns

### Mobile-First Design
```tsx
// Start with mobile, enhance for larger screens
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id}>
      {/* Card content */}
    </Card>
  ))}
</div>

// Responsive text sizing
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  Responsive Heading
</h1>

// Conditional rendering for mobile
<Button className="w-full sm:w-auto">
  Mobile Full Width
</Button>
```

## ♿ Accessibility Patterns

### Form Accessibility
```tsx
// Always associate labels with inputs
<Label htmlFor="email">Email Address</Label>
<Input id="email" type="email" required />

// Provide helpful descriptions
<Input 
  aria-describedby="email-help"
  aria-invalid={errors.email ? true : false}
/>
<p id="email-help" className="text-sm text-muted-foreground">
  We'll never share your email
</p>

// Loading states with announcements
<LoadingButton loading={loading} aria-busy={loading}>
  {loading ? 'Processing...' : 'Submit'}
</LoadingButton>
```

### Keyboard Navigation
```tsx
// Ensure all interactive elements are keyboard accessible
<Button 
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleAction()
    }
  }}
>
  Keyboard Accessible
</Button>
```

## 🚫 Common Mistakes to Avoid

1. **Don't mix component libraries**
   ```tsx
   // Bad: Mixing MUI with our design system
   import Button from '@mui/material/Button'
   
   // Good: Use our components
   import { Button } from '@/components/ui/button'
   ```

2. **Don't use inline styles**
   ```tsx
   // Bad
   <div style={{ padding: '20px', backgroundColor: '#f0f0f0' }}>
   
   // Good
   <div className="p-5 bg-muted">
   ```

3. **Don't hardcode colors**
   ```tsx
   // Bad
   <div className="bg-blue-500 text-white">
   
   // Good
   <div className="bg-primary text-primary-foreground">
   ```

4. **Don't skip semantic HTML**
   ```tsx
   // Bad
   <div onClick={handleClick}>Click me</div>
   
   // Good
   <Button onClick={handleClick}>Click me</Button>
   ```

## 📋 Component Checklist

Before using a component:
- [ ] Check if it exists in `/components/ui/`
- [ ] Review the component's props and variants
- [ ] Use semantic color classes (not hardcoded)
- [ ] Test keyboard navigation
- [ ] Verify dark mode appearance
- [ ] Check mobile responsiveness
- [ ] Add proper ARIA attributes
- [ ] Include loading/error states where needed

## 🔗 Resources

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Radix UI Documentation](https://www.radix-ui.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)