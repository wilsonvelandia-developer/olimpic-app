import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Route guard that verifies the user is authenticated before allowing navigation.
 * Redirects to /auth/login if no active session is found.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated$()) {
    return true;
  }
  return router.createUrlTree(['/auth/login']);
};
