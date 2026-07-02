import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ToastService } from './toast.service';

/**
 * Toast container — renders all active toasts in a fixed position.
 * Place once in the root app component.
 */
@Component({
  selector: 'app-toast-container',
  template: `
    <div class="toast-container" aria-live="polite" aria-atomic="true">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="toast toast--{{ toast.type }}"
          role="alert"
          (click)="toastService.dismiss(toast.id)"
        >
          <span class="toast__icon">{{ getIcon(toast.type) }}</span>
          <span class="toast__message">{{ toast.message }}</span>
          <button
            type="button"
            class="toast__close"
            aria-label="Cerrar"
            (click)="toastService.dismiss(toast.id); $event.stopPropagation()"
          >×</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 380px;
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md, 6px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-size: 0.875rem;
      font-weight: 500;
      pointer-events: auto;
      cursor: pointer;
      animation: toastSlideIn 0.25s ease;
      transition: opacity 0.2s, transform 0.2s;
    }

    .toast:hover {
      transform: translateX(-2px);
    }

    .toast--success {
      background: #d1fae5;
      color: #065f46;
      border-left: 4px solid #10b981;
    }

    .toast--error {
      background: #fee2e2;
      color: #991b1b;
      border-left: 4px solid #ef4444;
    }

    .toast--warning {
      background: #fef3c7;
      color: #92400e;
      border-left: 4px solid #f59e0b;
    }

    .toast--info {
      background: #dbeafe;
      color: #1e40af;
      border-left: 4px solid #3b82f6;
    }

    .toast__icon {
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .toast__message {
      flex: 1;
      line-height: 1.3;
    }

    .toast__close {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      opacity: 0.6;
      color: inherit;
      padding: 0 0.25rem;
      flex-shrink: 0;
    }

    .toast__close:hover {
      opacity: 1;
    }

    @keyframes toastSlideIn {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @media (max-width: 480px) {
      .toast-container {
        top: auto;
        bottom: 1rem;
        right: 0.5rem;
        left: 0.5rem;
        max-width: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainer {
  readonly toastService = inject(ToastService);

  getIcon(type: string): string {
    switch (type) {
      case 'success': return '✓';
      case 'error':   return '✕';
      case 'warning': return '⚠';
      case 'info':    return 'ℹ';
      default:        return '';
    }
  }
}
