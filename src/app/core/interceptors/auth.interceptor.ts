import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Tracks whether a refresh is currently in progress to avoid concurrent refreshes. */
let isRefreshing = false;

/**
 * Auth interceptor with automatic token refresh.
 *
 * 1. Attaches correlation ID header for distributed tracing.
 * 2. On 401 response: attempts to refresh the token via /auth/refresh.
 * 3. If refresh succeeds: retries the original request.
 * 4. If refresh fails: redirects to login.
 *
 * Note: JWT is managed via httpOnly cookies — no token in headers.
 */
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  const correlationId = crypto.randomUUID();

  // Don't send auth cookies to public endpoints (they don't need them)
  const isPublicRequest = req.url.includes('/public/');

  const enrichedReq = req.clone({
    headers: req.headers.set('X-Correlation-ID', correlationId),
    withCredentials: !isPublicRequest,
  });

  return next(enrichedReq).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      // Don't redirect to login for public routes — they don't need auth
      const currentUrl = router.url;
      if (currentUrl.startsWith('/p') || currentUrl.startsWith('/auth')) {
        return throwError(() => error);
      }

      // Don't retry refresh or login endpoints to avoid infinite loops
      const url = req.url;
      if (url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout') || url.includes('/auth/me')) {
        return throwError(() => error);
      }

      // Attempt token refresh (only once at a time)
      if (isRefreshing) {
        router.navigate(['/auth/login']);
        return throwError(() => error);
      }

      isRefreshing = true;

      return auth.refreshSession().pipe(
        switchMap((refreshResponse) => {
          isRefreshing = false;

          if (!refreshResponse.success) {
            router.navigate(['/auth/login']);
            return throwError(() => error);
          }

          // Retry the original request with fresh cookies
          return next(enrichedReq);
        }),
        catchError((refreshError) => {
          isRefreshing = false;
          router.navigate(['/auth/login']);
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
