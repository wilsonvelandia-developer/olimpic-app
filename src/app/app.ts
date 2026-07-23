import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainer } from './shared/components/toast/toast-container';
import { CookieBanner } from './shared/components/cookie-banner/cookie-banner';

/**
 * Root application component.
 * Acts only as the router outlet host — layout and navigation
 * are handled by the Shell component inside the route config.
 * ToastContainer is global — renders toasts on top of everything.
 * CookieBanner is global — shows cookie consent on first visit.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainer, CookieBanner],
  template: `<router-outlet /><app-toast-container /><app-cookie-banner />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
