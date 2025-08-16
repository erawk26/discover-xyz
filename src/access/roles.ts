export enum UserRole {
  ADMIN = 'admin',
  SITE_BUILDER = 'site-builder', 
  CONTENT_EDITOR = 'content-editor',
  AUTHENTICATED = 'authenticated'
}

export const roleHierarchy = {
  [UserRole.ADMIN]: [UserRole.ADMIN, UserRole.SITE_BUILDER, UserRole.CONTENT_EDITOR, UserRole.AUTHENTICATED],
  [UserRole.SITE_BUILDER]: [UserRole.SITE_BUILDER, UserRole.CONTENT_EDITOR, UserRole.AUTHENTICATED],
  [UserRole.CONTENT_EDITOR]: [UserRole.CONTENT_EDITOR, UserRole.AUTHENTICATED],
  [UserRole.AUTHENTICATED]: [UserRole.AUTHENTICATED]
}

export function hasRole(userRole: string | null | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false
  
  return roleHierarchy[userRole as UserRole]?.includes(requiredRole) ?? false
}