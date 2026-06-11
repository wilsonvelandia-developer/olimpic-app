import { Component, ChangeDetectionStrategy } from '@angular/core';

/**
 * Dashboard feature — entry point for the main overview screen.
 */
@Component({
  selector: 'app-dashboard',
  template: `
    <div class="dashboard">
      <h1 class="dashboard__title">Dashboard</h1>
      <p class="dashboard__subtitle">Bienvenido a OlimpicApp</p>
    </div>
  `,
  styles: [`
    .dashboard { padding: 1rem; }
    .dashboard__title { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem; }
    .dashboard__subtitle { color: var(--color-text-secondary); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {}
