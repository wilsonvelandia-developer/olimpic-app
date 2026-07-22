import { ErrorHandler, Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Global error handler — catches unhandled errors in the Angular app.
 *
 * Instead of letting the entire app crash with a white screen:
 *  - Logs the error to console (structured)
 *  - Prevents re-throwing in production
 *  - Shows a fallback notification if possible
 *
 * For truly unrecoverable errors (e.g. chunk load failures),
 * prompts the user to reload the page.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly router = inject(Router);

  handleError(error: unknown): void {
    // Extract useful info
    const err = error instanceof Error ? error : new Error(String(error));

    // Structured console log (never expose to UI)
    console.error('[GlobalErrorHandler]', {
      message: err.message,
      name:    err.name,
      stack:   err.stack?.split('\n').slice(0, 5).join('\n'),
    });

    // Chunk load failure = deployment happened while user had old cached app
    if (this.isChunkLoadError(err)) {
      this.handleChunkLoadError();
      return;
    }

    // For other errors, the app remains functional — Angular will continue working.
    // The error is logged but doesn't crash the app.
  }

  /**
   * Detects chunk/module loading failures that happen after a deployment.
   */
  private isChunkLoadError(error: Error): boolean {
    const msg = error.message?.toLowerCase() ?? '';
    return (
      msg.includes('loading chunk') ||
      msg.includes('failed to fetch dynamically imported module') ||
      msg.includes('chunkloaderror')
    );
  }

  /**
   * Handles chunk load errors by prompting the user to reload.
   * This happens when a new deployment invalidates the old bundle hashes.
   */
  private handleChunkLoadError(): void {
    const shouldReload = confirm(
      'Se ha actualizado la aplicación. Es necesario recargar la página para continuar.\n\n¿Recargar ahora?'
    );
    if (shouldReload) {
      window.location.reload();
    }
  }
}
