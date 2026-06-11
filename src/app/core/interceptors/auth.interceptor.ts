import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * Attaches the correlation ID header for distributed tracing.
 * Handles 401 responses by redirecting to login.
 * Note: JWT is managed via httpOnly cookies by the backend — no token in headers.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  const correlationId = crypto.randomUUID();

  const enrichedReq = req.clone({
    headers: req.headers.set('X-Correlation-ID', correlationId),
    withCredentials: true, // sends httpOnly cookies automatically
  });

  return next(enrichedReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    }),
  );
};
