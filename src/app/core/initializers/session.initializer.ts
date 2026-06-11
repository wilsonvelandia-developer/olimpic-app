import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, of } from 'rxjs';

/**
 * APP_INITIALIZER factory: attempts to restore the user session from
 * the existing httpOnly cookie before the app renders any route.
 * Silently ignores 401 errors (no active session) to allow public routes.
 */
export function sessionInitializer(): () => Promise<void> {
  const auth = inject(AuthService);

  return () =>
    new Promise((resolve) => {
      auth
        .restoreSession()
        .pipe(catchError(() => of(null))) // 401 = no session, continue normally
        .subscribe(() => resolve());
    });
}
