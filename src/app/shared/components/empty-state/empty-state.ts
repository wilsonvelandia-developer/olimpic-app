import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

/**
 * Reusable empty state component with illustration and call-to-action.
 */
@Component({
  selector: 'app-empty-state',
  template: `
    <div class="empty-state">
      <svg class="empty-state__illustration" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <!-- Clipboard -->
        <rect x="35" y="10" width="50" height="70" rx="4" fill="var(--color-bg-secondary)" stroke="var(--color-border)" stroke-width="2"/>
        <rect x="45" y="5" width="30" height="10" rx="3" fill="var(--color-bg-primary)" stroke="var(--color-border)" stroke-width="1.5"/>
        <circle cx="60" cy="10" r="2" fill="var(--color-primary)"/>
        <!-- Lines -->
        <rect x="45" y="28" width="30" height="3" rx="1.5" fill="var(--color-border)"/>
        <rect x="45" y="37" width="25" height="3" rx="1.5" fill="var(--color-border)" opacity="0.6"/>
        <rect x="45" y="46" width="28" height="3" rx="1.5" fill="var(--color-border)" opacity="0.4"/>
        <!-- Magnifying glass -->
        <circle cx="85" cy="65" r="10" stroke="var(--color-primary)" stroke-width="2.5" fill="none"/>
        <line x1="92" y1="72" x2="100" y2="80" stroke="var(--color-primary)" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
      <h3 class="empty-state__title">{{ title() }}</h3>
      <p class="empty-state__message">{{ message() }}</p>
      @if (actionLabel()) {
        <button type="button" class="btn btn--primary" (click)="actionClicked.emit()">{{ actionLabel() }}</button>
      }
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.5rem;
      text-align: center;
      gap: 0.75rem;
    }
    .empty-state__illustration {
      width: 120px;
      height: 100px;
      margin-bottom: 0.5rem;
      opacity: 0.8;
    }
    .empty-state__title {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }
    .empty-state__message {
      font-size: 0.9rem;
      color: var(--color-text-secondary);
      max-width: 320px;
      line-height: 1.5;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyState {
  readonly title = input<string>('Sin resultados');
  readonly message = input<string>('No se encontraron datos para mostrar.');
  readonly actionLabel = input<string>('');
  readonly actionClicked = output<void>();
}
