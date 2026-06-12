import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, of, timeout } from 'rxjs';

/**
 * APP_INITIALIZER factory: attempts to restore the user session from
 * the existing httpOnly cookie before the app renders any route.
 *
 * - Silently ignores 401 errors (no active session → redirect to login)
 * - Times out after 5s if the backend is unreachable, so the app
 *   doesn't hang on a white screen waiting for a server that's down.
 */
export function sessionInitializer(): () => Promise<void> {
  const auth = inject(AuthService);

  return () =>
    new Promise((resolve) => {
      auth
        .restoreSession()
        .pipe(
          timeout(5000),                  // don't block more than 5s
          catchError(() => of(null)),     // 401, timeout, CORS → continue
        )
        .subscribe(() => resolve());
    });
}
