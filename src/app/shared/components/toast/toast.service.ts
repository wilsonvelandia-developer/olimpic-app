import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

/**
 * Global toast notification service.
 * Lightweight, signal-based, no external dependencies.
 * Auto-dismisses after the specified duration.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  private counter = 0;

  /** Show a success toast (green). */
  success(message: string, duration = 3000): void {
    this.add(message, 'success', duration);
  }

  /** Show an error toast (red). */
  error(message: string, duration = 5000): void {
    this.add(message, 'error', duration);
  }

  /** Show a warning toast (yellow). */
  warning(message: string, duration = 4000): void {
    this.add(message, 'warning', duration);
  }

  /** Show an info toast (blue). */
  info(message: string, duration = 3000): void {
    this.add(message, 'info', duration);
  }

  /** Dismiss a specific toast immediately. */
  dismiss(id: string): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private add(message: string, type: ToastType, duration: number): void {
    const id = `toast-${++this.counter}-${Date.now()}`;
    const toast: Toast = { id, message, type, duration };

    this.toasts.update((list) => [...list, toast]);

    // Auto-dismiss after duration
    setTimeout(() => this.dismiss(id), duration);
  }
}
