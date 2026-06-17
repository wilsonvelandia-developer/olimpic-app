import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import type { AppRole } from '../models/role.model';
import { hasMinimumRole } from '../models/role.model';

/**
 * Role-based route guard.
 * Checks if the user's highest role meets or exceeds the required role level.
 * Redirects to /forbidden if insufficient.
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  const requiredRole = route.data['requiredRole'] as AppRole | undefined;
  if (!requiredRole) return true;

  const userRole = auth.primaryRole();
  if (!userRole) return router.createUrlTree(['/auth/login']);

  if (hasMinimumRole(userRole, requiredRole)) return true;

  return router.createUrlTree(['/forbidden']);
};
