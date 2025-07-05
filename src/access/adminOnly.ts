import type { Access } from 'payload'
import { UserRole, hasRole } from './roles'

export const adminOnly: Access = ({ req: { user } }) => {
  return hasRole(user?.role, UserRole.ADMIN)
}