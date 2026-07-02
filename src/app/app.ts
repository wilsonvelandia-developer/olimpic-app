import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainer } from './shared/components/toast/toast-container';

/**
 * Root application component.
 * Acts only as the router outlet host — layout and navigation
 * are handled by the Shell component inside the route config.
 * ToastContainer is global — renders toasts on top of everything.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainer],
  template: `<router-outlet /><app-toast-container />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
