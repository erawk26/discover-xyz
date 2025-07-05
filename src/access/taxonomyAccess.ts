import type { Access } from 'payload'
import { UserRole, hasRole } from './roles'

// Taxonomy collections (Categories) - can be managed by content editors and above
export const taxonomyAccess: Access = ({ req: { user } }) => {
  return hasRole(user?.role, UserRole.CONTENT_EDITOR)
}

export const taxonomyReadAccess: Access = () => {
  // Anyone can read taxonomies
  return true
}