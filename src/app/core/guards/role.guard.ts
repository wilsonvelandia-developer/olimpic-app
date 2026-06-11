import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import type { AppRole } from '../models/role.model';
import { hasMinimumRole } from '../models/role.model';

/**
 * Role-based route guard.
 *
 * Usage in route config:
 * ```ts
 * {
 *   path: 'sports',
 *   canActivate: [authGuard, roleGuard],
 *   data: { requiredRole: 'admin' },
 * }
 * ```
 *
 * Redirects to /403 when the user is authenticated but lacks the required role.
 * Redirects to /auth/login when unauthenticated (authGuard should run first).
 *
 * NOTE: This guard enforces UI-level access only.
 * The backend must independently validate roles on every request.
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const requiredRole = route.data['requiredRole'] as AppRole | undefined;

  // No role restriction configured — allow access
  if (!requiredRole) return true;

  const userRole = auth.currentRole();

  // Not authenticated — let authGuard handle this, but guard defensively
  if (!userRole) {
    return router.createUrlTree(['/auth/login']);
  }

  if (hasMinimumRole(userRole, requiredRole)) {
    return true;
  }

  // Authenticated but insufficient role → 403
  return router.createUrlTree(['/forbidden']);
};
