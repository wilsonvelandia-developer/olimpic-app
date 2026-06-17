/**
 * Application roles — matches the backend roles catalog.
 */
export type AppRole =
  | 'admin'
  | 'organizer'
  | 'coach'
  | 'assistant'
  | 'delegate'
  | 'fitness_coach'
  | 'coordinator'
  | 'president'
  | 'player'
  | 'parent'
  | 'companion'
  | 'referee'
  | 'observer';

/**
 * Role hierarchy levels for permission checks.
 * Higher number = more permissions.
 */
export const ROLE_HIERARCHY: Record<AppRole, number> = {
  admin:         100,
  organizer:      80,
  referee:        70,
  coach:          60,
  assistant:      55,
  delegate:       55,
  fitness_coach:  55,
  coordinator:    55,
  president:      55,
  observer:       30,
  player:         10,
  parent:         10,
  companion:      10,
};

/** Roles that are read-only (no write permissions). */
export const READ_ONLY_ROLES: AppRole[] = ['player', 'parent', 'companion', 'observer'];

/** Roles that can manage match events (referee flow). */
export const MATCH_MANAGEMENT_ROLES: AppRole[] = ['admin', 'referee'];

/** Roles that can manage their own teams. */
export const TEAM_MANAGEMENT_ROLES: AppRole[] = [
  'admin', 'organizer', 'coach', 'assistant', 'delegate',
  'fitness_coach', 'coordinator', 'president',
];

/**
 * Returns true if the user's highest role meets or exceeds the required role.
 */
export function hasMinimumRole(userRole: AppRole, requiredRole: AppRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Given an array of roles, returns the highest-privilege one.
 */
export function getHighestRole(roles: AppRole[]): AppRole {
  if (roles.length === 0) return 'player';
  return roles.sort((a, b) => ROLE_HIERARCHY[b] - ROLE_HIERARCHY[a])[0];
}
