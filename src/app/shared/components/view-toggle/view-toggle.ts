import { Component, ChangeDetectionStrategy, model } from '@angular/core';

export type ViewMode = 'card' | 'list';

/**
 * Reusable view mode toggle button (card/list).
 * Uses model() for two-way binding with the parent signal.
 */
@Component({
  selector: 'app-view-toggle',
  template: `
    <div class="view-toggle" role="group" aria-label="Modo de visualización">
      <button type="button" class="view-toggle__btn"
        [class.view-toggle__btn--active]="mode() === 'card'"
        (click)="mode.set('card')" aria-label="Vista de tarjetas">
        🃏
      </button>
      <button type="button" class="view-toggle__btn"
        [class.view-toggle__btn--active]="mode() === 'list'"
        (click)="mode.set('list')" aria-label="Vista de lista">
        📋
      </button>
    </div>
  `,
  styles: [`
    .view-toggle {
      display: flex;
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: 0.5rem;
      overflow: hidden;
    }
    .view-toggle__btn {
      padding: 0.4rem 0.6rem;
      font-size: 1.1rem;
      cursor: pointer;
      background: var(--color-bg-primary, #fff);
      border: none;
      transition: background 0.15s;
    }
    .view-toggle__btn:hover {
      background: var(--color-bg-secondary, #f1f5f9);
    }
    .view-toggle__btn--active {
      background: var(--color-primary, #4f46e5);
      color: white;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewToggle {
  readonly mode = model<ViewMode>('card');
}
