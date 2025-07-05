import type { Access } from 'payload'
import { UserRole, hasRole } from './roles'

export const siteBuilderAccess: Access = ({ req: { user } }) => {
  return hasRole(user?.role, UserRole.SITE_BUILDER)
}

export const siteBuilderReadAccess: Access = ({ req: { user } }) => {
  // Site builders and above can read all content
  if (hasRole(user?.role, UserRole.SITE_BUILDER)) {
    return true
  }
  
  // For others, only show published content
  return {
    _status: {
      equals: 'published'
    }
  }
}