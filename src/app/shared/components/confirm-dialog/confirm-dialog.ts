import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

/**
 * Generic confirmation dialog for destructive actions (delete, cancel, etc.).
 * Emits `confirmed` or `cancelled` — parent controls visibility.
 */
@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {
  readonly title = input<string>('¿Confirmar acción?');
  readonly message = input<string>('Esta acción no se puede deshacer.');
  readonly confirmLabel = input<string>('Confirmar');
  readonly cancelLabel = input<string>('Cancelar');
  readonly isDanger = input<boolean>(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
