import { Component, ChangeDetectionStrategy, inject, effect, signal } from '@angular/core';
import { OnboardingService } from '../../../core/services/onboarding.service';

/**
 * Onboarding overlay — displays tour steps with spotlight highlighting.
 * Renders only when a tour is active.
 */
@Component({
  selector: 'app-onboarding-overlay',
  templateUrl: './onboarding-overlay.html',
  styleUrl: './onboarding-overlay.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingOverlay {
  readonly onboarding = inject(OnboardingService);
  readonly tooltipStyle = signal<Record<string, string>>({});

  constructor() {
    effect(() => {
      const step = this.onboarding.currentStepData();
      if (step) {
        this.positionTooltip(step.target, step.position);
      }
    });
  }

  onNext(): void { this.onboarding.next(); }
  onPrevious(): void { this.onboarding.previous(); }
  onSkip(): void { this.onboarding.skip(); }

  private positionTooltip(selector: string, position: string): void {
    requestAnimationFrame(() => {
      const el = document.querySelector(selector);
      if (!el) {
        this.tooltipStyle.set({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
        return;
      }

      const rect = el.getBoundingClientRect();
      const style: Record<string, string> = {};

      switch (position) {
        case 'bottom':
          style['top'] = `${rect.bottom + 12}px`;
          style['left'] = `${rect.left + rect.width / 2}px`;
          style['transform'] = 'translateX(-50%)';
          break;
        case 'top':
          style['top'] = `${rect.top - 12}px`;
          style['left'] = `${rect.left + rect.width / 2}px`;
          style['transform'] = 'translate(-50%, -100%)';
          break;
        case 'right':
          style['top'] = `${rect.top + rect.height / 2}px`;
          style['left'] = `${rect.right + 12}px`;
          style['transform'] = 'translateY(-50%)';
          break;
        case 'left':
          style['top'] = `${rect.top + rect.height / 2}px`;
          style['left'] = `${rect.left - 12}px`;
          style['transform'] = 'translate(-100%, -50%)';
          break;
      }

      this.tooltipStyle.set(style);

      // Scroll target into view
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
}
