# Access Control System

This site implements a role-based access control system with four distinct user roles:

## User Roles (in hierarchical order)

### 1. **Admin**
- **Full system access**
- Can create, read, update, and delete all content
- Can manage user accounts and assign roles
- Can manage site structure (pages), content (articles), media, and taxonomies (categories)
- Can update global settings (header, footer)

### 2. **Site Builder** 
- **Site structure and design management**
- Can create, read, update, and delete pages
- Can update global settings (header, footer)
- Can read all content but cannot modify articles or media
- Cannot manage users or assign roles

### 3. **Content Editor**
- **Content management**
- Can create, read, update, and delete articles
- Can manage media files
- Can manage categories and taxonomies
- Can read pages but cannot modify site structure
- Cannot manage users or assign roles

### 4. **Authenticated User**
- **Basic read access**
- Can only read published content
- Cannot create, update, or delete any content
- Cannot access admin functionality

## Access Control Implementation

### Collections

- **Users**: Only admins can create/delete users. Users can update their own profile.
- **Articles**: Managed by Content Editors and above
- **Pages**: Managed by Site Builders and above  
- **Media**: Managed by Content Editors and above
- **Categories**: Managed by Content Editors and above (read access for everyone)

### Globals

- **Header/Footer**: Managed by Site Builders and above

### Content Visibility

- **Drafts**: Only visible to users with appropriate edit permissions
- **Published Content**: Visible to all users (including unauthenticated)
- **Unpublished Content**: Only visible to users with edit permissions for that content type

## Role Hierarchy

The system implements role inheritance where higher-level roles automatically include permissions of lower-level roles:

```
Admin → Site Builder → Content Editor → Authenticated
```

## Usage

When creating new users, assign the appropriate role based on their responsibilities:

- **Admin**: Site owners, developers, full system administrators
- **Site Builder**: Designers, developers focused on site structure and layout
- **Content Editor**: Writers, content managers, marketing team
- **Authenticated**: Basic users who need to access private content but not edit