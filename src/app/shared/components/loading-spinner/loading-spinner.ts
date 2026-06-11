import { Component, ChangeDetectionStrategy, input } from '@angular/core';

/**
 * Accessible loading spinner for async operations.
 */
@Component({
  selector: 'app-loading-spinner',
  template: `
    <div class="spinner-wrapper" role="status" [attr.aria-label]="label()">
      <div class="spinner"></div>
      @if (showLabel()) {
        <span class="spinner__text">{{ label() }}</span>
      }
    </div>
  `,
  styles: [`
    .spinner-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 2rem;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--color-border);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner__text {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingSpinner {
  readonly label = input<string>('Cargando...');
  readonly showLabel = input<boolean>(true);
}
