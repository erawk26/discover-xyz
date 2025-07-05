import type { Access } from 'payload'
import { UserRole, hasRole } from './roles'

export const contentAccess: Access = ({ req: { user } }) => {
  return hasRole(user?.role, UserRole.CONTENT_EDITOR)
}

export const contentCreateAccess: Access = ({ req: { user } }) => {
  return hasRole(user?.role, UserRole.CONTENT_EDITOR)
}

export const contentReadAccess: Access = ({ req: { user } }) => {
  // Content can be read by content editors and above, or if published
  if (hasRole(user?.role, UserRole.CONTENT_EDITOR)) {
    return true
  }
  
  // For non-editors, only show published content
  return {
    _status: {
      equals: 'published'
    }
  }
}

export const contentUpdateAccess: Access = ({ req: { user } }) => {
  return hasRole(user?.role, UserRole.CONTENT_EDITOR)
}

export const contentDeleteAccess: Access = ({ req: { user } }) => {
  return hasRole(user?.role, UserRole.CONTENT_EDITOR)
}