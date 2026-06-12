import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { sessionInitializer } from './core/initializers/session.initializer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    // Zoneless change detection — Angular 21 stable, no Zone.js required
    provideZonelessChangeDetection(),

    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),

    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, errorInterceptor]),
    ),

    // provideAppInitializer replaces the deprecated APP_INITIALIZER token in Angular 19+
    provideAppInitializer(sessionInitializer),
  ],
};
