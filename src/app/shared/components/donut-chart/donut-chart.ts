import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

export interface DonutChartSegment {
  label: string;
  value: number;
  color: string;
}

/**
 * Simple SVG donut chart component.
 * Renders a donut with colored segments and a center label.
 */
@Component({
  selector: 'app-donut-chart',
  template: `
    <div class="donut-chart">
      @if (title()) { <h4 class="donut-chart__title">{{ title() }}</h4> }
      <div class="donut-chart__wrapper">
        <svg viewBox="0 0 100 100" class="donut-svg">
          @for (seg of segments(); track seg.label) {
            <circle class="donut-segment" cx="50" cy="50" r="35"
              fill="none" [attr.stroke]="seg.color" stroke-width="12"
              [attr.stroke-dasharray]="seg.dashArray"
              [attr.stroke-dashoffset]="seg.dashOffset"
              transform="rotate(-90 50 50)" />
          }
        </svg>
        <div class="donut-center">
          <span class="donut-center__value">{{ total() }}</span>
          <span class="donut-center__label">Total</span>
        </div>
      </div>
      <div class="donut-legend">
        @for (seg of data(); track seg.label) {
          <div class="donut-legend__item">
            <span class="donut-legend__dot" [style.background]="seg.color"></span>
            <span class="donut-legend__label">{{ seg.label }}</span>
            <span class="donut-legend__value">{{ seg.value }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .donut-chart__title { font-size: 0.9rem; font-weight: 600; margin-bottom: 0.75rem; }
    .donut-chart__wrapper { position: relative; width: 140px; height: 140px; margin: 0 auto; }
    .donut-svg { width: 100%; height: 100%; }
    .donut-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .donut-center__value { font-size: 1.25rem; font-weight: 700; }
    .donut-center__label { font-size: 0.7rem; color: var(--color-text-secondary); }
    .donut-legend { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem; justify-content: center; }
    .donut-legend__item { display: flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; }
    .donut-legend__dot { width: 8px; height: 8px; border-radius: 50%; }
    .donut-legend__value { font-weight: 600; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DonutChart {
  readonly data = input<DonutChartSegment[]>([]);
  readonly title = input<string>('');

  readonly total = computed(() => this.data().reduce((sum, d) => sum + d.value, 0));

  readonly segments = computed(() => {
    const t = this.total();
    if (t === 0) return [];
    const circumference = 2 * Math.PI * 35;
    let offset = 0;
    return this.data().map((d) => {
      const pct = d.value / t;
      const dashArray = `${pct * circumference} ${circumference}`;
      const dashOffset = `${-offset * circumference}`;
      offset += pct;
      return { ...d, dashArray, dashOffset };
    });
  });
}
