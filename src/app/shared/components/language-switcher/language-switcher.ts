import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import type { AppLanguage } from '../../../core/i18n/i18n.service';

/**
 * Language switcher — dropdown to change app language.
 * Placed in the navbar for easy access.
 */
@Component({
  selector: 'app-language-switcher',
  template: `
    <select class="lang-select" [value]="i18n.currentLang()"
      (change)="onChange($event)" aria-label="Idioma">
      @for (lang of i18n.availableLanguages; track lang.code) {
        <option [value]="lang.code">{{ lang.label }}</option>
      }
    </select>
  `,
  styles: [`
    .lang-select {
      padding: 0.25rem 0.5rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: var(--color-bg-primary);
      color: var(--color-text-primary);
      font-size: 0.8rem;
      cursor: pointer;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcher {
  readonly i18n = inject(I18nService);

  onChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as AppLanguage;
    this.i18n.setLanguage(value);
  }
}
