# Branding Configuration Guide

[← Back to Main Documentation](./README.md)

This guide explains how to customize and brand your Payload CMS admin interface.

## 🚨 Important: Set Your Site Name

**Before customizing the branding, make sure to set your site name in the environment variables:**

1. **Update `.env` file**:
   ```bash
   SITE_NAME=Your Site Name
   ```

2. **Restart your development server** after changing the SITE_NAME to see the changes take effect throughout the application.

The SITE_NAME environment variable is used across the entire application including:
- Admin panel title suffix
- Logo display text  
- Page metadata
- SEO titles
- Homepage content

## ✅ Implemented Features

### 1. Custom Branding Components
- **Logo Component**: Custom logo displayed on login page (`src/components/graphics/Logo.tsx`)
- **Icon Component**: Compact icon shown in the admin navigation (`src/components/graphics/Icon.tsx`)

### 2. Meta Configuration
- **Custom Title Suffix**: Admin pages show "- DiscoverXYZ Admin"
- **Custom Favicon**: Located at `/admin/favicon.svg`
- **Theme Support**: Configured for light/dark mode switching

### 3. Custom CSS Branding
- **Location**: `src/app/(payload)/admin/custom.scss`
- **Features**:
  - Custom color scheme with brand colors
  - Gradient login background
  - Custom button styling
  - Navigation customizations
  - Form field styling
  - Table and status indicator styling
  - Dark mode support
  - Smooth animations

### 4. Brand Colors (Tailwind Configuration)
Brand colors are defined in `tailwind.config.ts` and available as utility classes:

- **Primary Colors**:
  - `brand-primary` - `#2563eb` (Blue)
  - `brand-primary-hover` - `#1d4ed8` (Darker blue)
  - `brand-primary-active` - `#1e40af` (Active state)
- **Secondary**: `brand-secondary` - `#7c3aed` (Purple)  
- **Accent**: `brand-accent` - `#06b6d4` (Cyan)

**Usage Examples**:
```html
<!-- Background colors -->
<div class="bg-brand-primary">Primary background</div>
<div class="bg-brand-secondary">Secondary background</div>

<!-- Text colors -->
<p class="text-brand-primary">Primary text</p>
<p class="text-brand-accent">Accent text</p>

<!-- Border colors -->
<div class="border-brand-primary">Primary border</div>
```

## 🎨 Customization Options

### Updating Logo and Icon

1. **Replace the Logo**:
   ```tsx
   // Edit src/components/graphics/Logo.tsx
   // Replace the SVG content with your logo
   ```

2. **Replace the Icon**:
   ```tsx
   // Edit src/components/graphics/Icon.tsx
   // Replace the SVG content with your icon
   ```

### Updating Colors

1. **Edit Tailwind Configuration** (Recommended):
   ```ts
   // In tailwind.config.ts
   colors: {
     brand: {
       primary: {
         DEFAULT: '#your-primary-color',
         hover: '#your-primary-hover-color',
         active: '#your-primary-active-color',
       },
       secondary: '#your-secondary-color',
       accent: '#your-accent-color',
     },
   }
   ```

2. **Using Brand Colors in Components**:
   ```tsx
   // Use Tailwind utilities in your React components
   <button className="bg-brand-primary hover:bg-brand-primary-hover text-white">
     Primary Button
   </button>
   
   <div className="border-brand-accent text-brand-secondary">
     Branded Content
   </div>
   ```

3. **Advanced SCSS Usage**:
   ```scss
   // In custom.scss, reference Tailwind colors
   .custom-element {
     background: theme(colors.brand.primary.DEFAULT);
     color: theme(colors.brand.secondary);
   }
   ```

### Adding Custom Favicon

1. **Replace Files**:
   - Update `/public/admin/favicon.svg`
   - Add `/public/admin/favicon.ico` for older browsers
   - Update `/public/admin/og-image.jpg` for social sharing

### Custom Title and Meta

The site name is now controlled by the `SITE_NAME` environment variable. The system automatically uses this value for:

1. **Admin Title Suffix**: Displays as "- {SITE_NAME} Admin"
2. **Logo Text**: Shows your site name in the logo component
3. **Meta Titles**: Used in page titles and SEO

To customize further:
   ```ts
   // In src/payload.config.ts
   admin: {
     meta: {
       titleSuffix: `- ${process.env.SITE_NAME || 'DiscoverXYZ'} Admin`,
     },
   }
   ```

## 🚀 Advanced Customization

### Adding Custom Components

1. **Create Custom Components**:
   ```tsx
   // src/components/admin/CustomComponent.tsx
   export const CustomComponent = () => {
     return <div>Your custom content</div>
   }
   ```

2. **Register in Config**:
   ```ts
   admin: {
     components: {
       beforeDashboard: ['@/components/admin/CustomComponent'],
     }
   }
   ```

### Custom CSS Targeting

The CSS uses BEM naming conventions and CSS layers for easy customization:

```scss
@layer payload {
  // Your custom styles here
  .login__wrap {
    // Customize login form
  }
  
  .nav__link {
    // Customize navigation
  }
  
  .btn--style-primary {
    // Customize primary buttons
  }
}
```

### Removing Payload Branding

The current CSS includes:
```scss
.branding {
  display: none !important;
}

.powered-by {
  display: none !important;
}
```

## 📱 Theme Support

The configuration supports:
- **Light Mode**: Clean, modern light interface
- **Dark Mode**: Elegant dark interface with adjusted colors
- **Auto Mode**: Follows system preference

## 🔧 Development Notes

### File Structure
```
src/
├── components/graphics/
│   ├── Logo.tsx          # Main logo component
│   └── Icon.tsx          # Navigation icon
├── app/(payload)/admin/
│   └── custom.scss       # Custom CSS styles
└── payload.config.ts     # Main configuration
```

### Configuration in `payload.config.ts`
```ts
admin: {
  components: {
    graphics: {
      Logo,
      Icon,
    },
  },
  meta: {
    titleSuffix: '- DiscoverXYZ Admin',
  },
  css: path.resolve(dirname, 'app/(payload)/admin/custom.scss'),
  theme: 'all',
}
```

## 🎯 Next Steps

To further customize your branding:

1. **Set your SITE_NAME** in the `.env` file (most important step!)
2. **Add your actual logo files** to replace the placeholder SVGs
3. **Update the color scheme** to match your brand
4. **Add custom favicon files** for better branding
5. **Customize the login page** with additional styling
6. **Add custom dashboard components** for enhanced functionality

## 🔍 Testing Your Changes

1. **Set your SITE_NAME** in `.env` and restart the server
2. Start the development server: `npm run dev`
3. Navigate to `/admin` to see your branded interface
4. Test both light and dark modes
5. Verify the site name appears in the logo and titles
6. Verify the favicon appears correctly
7. Check that all custom styling is applied

Your Payload CMS admin interface is now fully branded and ready for production!