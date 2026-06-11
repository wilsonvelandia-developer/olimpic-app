import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

const STATUS_VARIANT_MAP: Record<string, BadgeVariant> = {
  // Tournament statuses
  upcoming: 'info',
  in_progress: 'success',
  completed: 'neutral',
  draft: 'warning',
  cancelled: 'error',
  // Match statuses
  scheduled: 'info',
  postponed: 'warning',
};

const STATUS_LABEL_MAP: Record<string, string> = {
  upcoming: 'Próximo',
  in_progress: 'En curso',
  completed: 'Finalizado',
  draft: 'Borrador',
  cancelled: 'Cancelado',
  scheduled: 'Programado',
  postponed: 'Pospuesto',
};

/**
 * Reusable status badge. Maps domain status strings to visual variants.
 * Works for tournaments, matches, and any other status-driven entity.
 */
@Component({
  selector: 'app-status-badge',
  template: `
    <span class="badge" [class]="'badge--' + variant()">
      {{ label() }}
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadge {
  readonly status = input.required<string>();

  readonly variant = computed<BadgeVariant>(
    () => STATUS_VARIANT_MAP[this.status()] ?? 'neutral',
  );

  readonly label = computed<string>(
    () => STATUS_LABEL_MAP[this.status()] ?? this.status(),
  );
}
