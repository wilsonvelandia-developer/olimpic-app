import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * Global HTTP error interceptor.
 * Logs errors internally without exposing sensitive details to the UI.
 * The component layer receives a normalized error message.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
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
      }
      return throwError(() => error);
    }),
  );
};
