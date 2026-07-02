import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark' | 'auto';

const STORAGE_KEY = 'olimpicapp-theme';

/**
 * Theme service — manages light/dark mode toggle.
 * Persists preference in localStorage.
 * Applies data-theme attribute to document root.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly currentTheme = signal<Theme>('auto');

  constructor() {
    this.loadSavedTheme();
  }

  /** Toggle between light and dark (skips auto). */
  toggle(): void {
    const current = this.currentTheme();
    const next: Theme = current === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  }

  /** Set a specific theme. */
  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
    this.applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  private loadSavedTheme(): void {
    if (typeof localStorage === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved && ['light', 'dark', 'auto'].includes(saved)) {
      this.currentTheme.set(saved);
      this.applyTheme(saved);
    }
  }

  private applyTheme(theme: Theme): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme === 'auto') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }
}
