import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../../shared/components/toast/toast.service';

/**
 * Global HTTP error interceptor.
 * Shows toast notifications for common errors while logging internally.
 * Does NOT intercept 401 (handled by auth guard) or silent endpoints.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const correlationId = req.headers.get('X-Correlation-ID') ?? 'unknown';

        // Internal log — never exposed to the client
        console.error('[HTTP Error]', {
          status: error.status,
          url: error.url,
          correlationId,
        });

        // Skip toast for auth session restore and login endpoints
        const isAuthEndpoint = req.url.includes('/auth/me') || req.url.includes('/auth/login');

        // Show user-friendly toast (skip 401 — handled by auth flow)
        if (error.status !== 401 && !isAuthEndpoint) {
          const message = getErrorMessage(error);
          if (error.status >= 500) {
            toast.error(message);
          } else if (error.status === 403) {
            toast.warning('No tienes permisos para esta acción.');
          } else if (error.status === 404) {
            // Silent — let component handle 404 specifically
          } else if (error.status === 422 && req.method !== 'GET') {
            // Only show validation toast for mutations (user input errors)
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
