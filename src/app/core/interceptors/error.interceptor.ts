import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, retry, timer } from 'rxjs';
import { ToastService } from '../../shared/components/toast/toast.service';

/** Max retries for transient errors (5xx, timeout). */
const MAX_RETRIES = 2;

/** Base delay in ms for exponential backoff. */
const BASE_DELAY_MS = 1000;

/**
 * Global HTTP error interceptor with automatic retry for transient errors.
 *
 * Retry logic:
 *  - Only retries on 5xx and status 0 (network error/timeout)
 *  - Only retries GET/HEAD requests (mutations are never retried)
 *  - Exponential backoff: 1s, 2s (max 2 retries)
 *
 * Toast notifications:
 *  - Shows user-friendly messages for unrecoverable errors
 *  - Skips 401 (handled by auth interceptor) and 404 (handled by components)
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  const isRetryable = req.method === 'GET' || req.method === 'HEAD';

  return next(req).pipe(
    // Retry only idempotent requests on transient errors
    retry({
      count: isRetryable ? MAX_RETRIES : 0,
      delay: (error, retryCount) => {
        if (!(error instanceof HttpErrorResponse)) return throwError(() => error);
        // Only retry on 5xx or network errors (status 0)
        if (error.status !== 0 && error.status < 500) return throwError(() => error);
        // Exponential backoff: 1s, 2s, 4s...
        const delayMs = BASE_DELAY_MS * Math.pow(2, retryCount - 1);
        return timer(delayMs);
      },
    }),

    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const correlationId = req.headers.get('X-Correlation-ID') ?? 'unknown';

        console.error('[HTTP Error]', {
          status: error.status,
          url: error.url,
          correlationId,
        });

        // Skip toast for auth session restore and login endpoints
        const isAuthEndpoint = req.url.includes('/auth/me') || req.url.includes('/auth/login');

        if (error.status !== 401 && !isAuthEndpoint) {
          const message = getErrorMessage(error);
          if (error.status >= 500) {
            toast.error(message);
          } else if (error.status === 403) {
            toast.warning('No tienes permisos para esta acción.');
          } else if (error.status === 404) {
            // Silent — let component handle 404
          } else if (error.status === 422 && req.method !== 'GET') {
            toast.warning(message);
          } else if (error.status === 0) {
            toast.error('Error de conexión. Verifica tu internet.');
          }
        }
      }
      return throwError(() => error);
    }),
  );
};

/**
 * Extracts a user-friendly error message from the HTTP response.
 * Never exposes stack traces or internal details.
 */
function getErrorMessage(error: HttpErrorResponse): string {
  if (error.status === 0) return 'Sin conexión al servidor.';
  if (error.status >= 500) return 'Error interno del servidor. Intenta nuevamente.';

  const body = error.error as { message?: string; detail?: string } | null;
  if (body?.message && body.message.length < 200) return body.message;
  if (body?.detail && body.detail.length < 200) return body.detail;

  return 'Ocurrió un error inesperado.';
}
