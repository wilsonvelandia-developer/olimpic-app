import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

export interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

/**
 * Simple SVG bar chart component.
 * Renders horizontal bars with labels and values.
 */
@Component({
  selector: 'app-bar-chart',
  template: `
    <div class="bar-chart">
      @if (title()) { <h4 class="bar-chart__title">{{ title() }}</h4> }
      <div class="bar-chart__bars">
        @for (item of data(); track item.label) {
          <div class="bar-row">
            <span class="bar-row__label">{{ item.label }}</span>
            <div class="bar-row__track">
              <div class="bar-row__fill" [style.width.%]="getWidth(item.value)" [style.background]="item.color || '#1a56db'"></div>
            </div>
            <span class="bar-row__value">{{ item.value }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .bar-chart__title { font-size: 0.9rem; font-weight: 600; margin-bottom: 0.75rem; }
    .bar-chart__bars { display: flex; flex-direction: column; gap: 0.5rem; }
    .bar-row { display: grid; grid-template-columns: 100px 1fr 40px; align-items: center; gap: 0.5rem; }
    .bar-row__label { font-size: 0.8rem; color: var(--color-text-secondary); text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .bar-row__track { height: 20px; background: var(--color-bg-secondary); border-radius: var(--radius-sm); overflow: hidden; }
    .bar-row__fill { height: 100%; border-radius: var(--radius-sm); transition: width 0.3s ease; min-width: 2px; }
    .bar-row__value { font-size: 0.8rem; font-weight: 600; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarChart {
  readonly data = input<BarChartData[]>([]);
  readonly title = input<string>('');

  private readonly maxValue = computed(() =>
    Math.max(1, ...this.data().map((d) => d.value)),
  );

  getWidth(value: number): number {
    return (value / this.maxValue()) * 100;
  }
}
