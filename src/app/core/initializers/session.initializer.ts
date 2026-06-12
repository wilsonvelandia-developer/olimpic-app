import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, of, timeout, firstValueFrom } from 'rxjs';

/**
 * App initializer compatible with provideAppInitializer (Angular 19+).
 * Attempts to restore the user session from the existing httpOnly cookie
 * before the app renders any route.
 *
 * - Silently ignores 401 errors (no active session → redirect to login)
 * - Times out after 5s if the backend is unreachable so the app
 *   doesn't hang on a white screen.
 */
export function sessionInitializer(): Promise<void> {
  const auth = inject(AuthService);

  return firstValueFrom(
    auth.restoreSession().pipe(
      timeout(5000),
      catchError(() => of(null)),
    ),
  ).then(() => undefined);
}
