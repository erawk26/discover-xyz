import type { FieldAccess } from 'payload'
import { UserRole, hasRole } from './roles'

export const adminOnlyField: FieldAccess = ({ req: { user } }) => {
  return hasRole(user?.role, UserRole.ADMIN)
}