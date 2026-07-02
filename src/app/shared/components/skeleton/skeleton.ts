import { Component, ChangeDetectionStrategy, input } from '@angular/core';

/**
 * Skeleton loader — animated placeholder while content loads.
 * Usage:
 *   <app-skeleton type="text" />
 *   <app-skeleton type="card" />
 *   <app-skeleton type="table" [rows]="5" />
 *   <app-skeleton type="avatar" />
 */
@Component({
  selector: 'app-skeleton',
  template: `
    @switch (type()) {
      @case ('text') {
        <div class="skeleton skeleton--text">
          <div class="skeleton__line skeleton__line--full"></div>
          <div class="skeleton__line skeleton__line--75"></div>
          <div class="skeleton__line skeleton__line--50"></div>
        </div>
      }
      @case ('card') {
        <div class="skeleton skeleton--card">
          <div class="skeleton__rect skeleton__rect--img"></div>
          <div class="skeleton__line skeleton__line--full"></div>
          <div class="skeleton__line skeleton__line--75"></div>
        </div>
      }
      @case ('table') {
        <div class="skeleton skeleton--table">
          @for (i of rowsArray(); track i) {
            <div class="skeleton__row">
              <div class="skeleton__cell skeleton__cell--sm"></div>
              <div class="skeleton__cell skeleton__cell--lg"></div>
              <div class="skeleton__cell skeleton__cell--md"></div>
              <div class="skeleton__cell skeleton__cell--sm"></div>
            </div>
          }
        </div>
      }
      @case ('avatar') {
        <div class="skeleton skeleton--avatar">
          <div class="skeleton__circle"></div>
          <div class="skeleton__line skeleton__line--75"></div>
        </div>
      }
      @default {
        <div class="skeleton skeleton--text">
          <div class="skeleton__line skeleton__line--full"></div>
        </div>
      }
    }
  `,
  styles: [`
    .skeleton { animation: pulse 1.5s ease-in-out infinite; }

    .skeleton__line {
      height: 14px;
      border-radius: 4px;
      background: var(--color-bg-secondary);
      margin-bottom: 0.5rem;
    }
    .skeleton__line--full { width: 100%; }
    .skeleton__line--75   { width: 75%; }
    .skeleton__line--50   { width: 50%; }

    .skeleton__rect {
      border-radius: var(--radius-md);
      background: var(--color-bg-secondary);
    }
    .skeleton__rect--img { width: 100%; height: 120px; margin-bottom: 0.75rem; }

    .skeleton--card {
      padding: 1rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
    }

    .skeleton--table { display: flex; flex-direction: column; gap: 0.5rem; }
    .skeleton__row { display: flex; gap: 0.75rem; align-items: center; }
    .skeleton__cell {
      height: 16px;
      border-radius: 4px;
      background: var(--color-bg-secondary);
    }
    .skeleton__cell--sm { width: 50px; }
    .skeleton__cell--md { width: 120px; flex: 1; }
    .skeleton__cell--lg { width: 200px; flex: 2; }

    .skeleton--avatar { display: flex; align-items: center; gap: 0.75rem; }
    .skeleton__circle { width: 40px; height: 40px; border-radius: 50%; background: var(--color-bg-secondary); flex-shrink: 0; }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Skeleton {
  readonly type = input<'text' | 'card' | 'table' | 'avatar'>('text');
  readonly rows = input<number>(5);

  readonly rowsArray = () => Array.from({ length: this.rows() }, (_, i) => i);
}
