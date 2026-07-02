import { Injectable, signal, computed } from '@angular/core';
import { ES_TRANSLATIONS } from './translations/es';
import { EN_TRANSLATIONS } from './translations/en';

export type AppLanguage = 'es' | 'en';

const TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  es: ES_TRANSLATIONS,
  en: EN_TRANSLATIONS,
};

const STORAGE_KEY = 'olimpicapp_lang';

/**
 * Internationalization service.
 * Provides translation lookup and language switching.
 * Persists the selected language in localStorage.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly _currentLang = signal<AppLanguage>(this.loadLanguage());

  readonly currentLang = this._currentLang.asReadonly();
  readonly isSpanish = computed(() => this._currentLang() === 'es');
  readonly isEnglish = computed(() => this._currentLang() === 'en');

  readonly availableLanguages: { code: AppLanguage; label: string }[] = [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
  ];

  /**
   * Translates a key to the current language.
   * Returns the key itself if no translation is found (fallback).
   * @param key - dot-notation translation key (e.g. 'nav.dashboard')
   * @param params - optional interpolation params ({{name}} patterns)
   */
  t(key: string, params?: Record<string, string | number>): string {
    const lang = this._currentLang();
    let text = TRANSLATIONS[lang][key] ?? TRANSLATIONS['es'][key] ?? key;

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      });
    }

    return text;
  }

  /**
   * Changes the active language and persists the choice.
   */
  setLanguage(lang: AppLanguage): void {
    this._currentLang.set(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // localStorage not available (private browsing, etc.)
    }
    document.documentElement.lang = lang;
  }

  /**
   * Loads the persisted language or detects from browser.
   */
  private loadLanguage(): AppLanguage {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as AppLanguage | null;
      if (stored && stored in TRANSLATIONS) return stored;
    } catch {
      // localStorage not available
    }
    const browserLang = navigator.language.slice(0, 2);
    return browserLang === 'en' ? 'en' : 'es';
  }
}
