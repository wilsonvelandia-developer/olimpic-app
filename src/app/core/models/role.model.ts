/**
 * Application roles in order of descending privilege.
 * Authorization is always enforced on the backend — this is UI-level enforcement only.
 */
export type AppRole = 'admin' | 'editor' | 'viewer';

/**
 * Role hierarchy: each role includes the permissions of roles below it.
 */
export const ROLE_HIERARCHY: Record<AppRole, number> = {
  admin:  3,
  editor: 2,
  viewer: 1,
};

/**
 * Returns true if the user's role meets or exceeds the required role.
 */
export function hasMinimumRole(userRole: AppRole, requiredRole: AppRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
