import { Injectable, signal } from '@angular/core';

export interface TournamentTheme {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  bannerUrl: string | null;
}

const DEFAULT_THEME: TournamentTheme = {
  primaryColor: '#1a56db',
  secondaryColor: '#f59e0b',
  logoUrl: null,
  bannerUrl: null,
};

/**
 * Tournament theme service — applies custom colors and branding
 * to the public tournament view. Sets CSS custom properties dynamically.
 */
@Injectable({ providedIn: 'root' })
export class TournamentThemeService {
  readonly currentTheme = signal<TournamentTheme>(DEFAULT_THEME);
  readonly isCustomized = signal<boolean>(false);

  /**
   * Applies a tournament's custom theme by setting CSS variables on :root.
   * @param theme - tournament-specific theme configuration
   */
  applyTheme(theme: Partial<TournamentTheme>): void {
    const merged: TournamentTheme = { ...DEFAULT_THEME, ...theme };
    this.currentTheme.set(merged);
    this.isCustomized.set(true);

    const root = document.documentElement;
    root.style.setProperty('--tournament-primary', merged.primaryColor);
    root.style.setProperty('--tournament-secondary', merged.secondaryColor);

    // Generate light version for backgrounds
    root.style.setProperty('--tournament-primary-light', this.lightenColor(merged.primaryColor, 0.9));
  }

  /**
   * Resets to default theme (used when navigating away from public view).
   */
  resetTheme(): void {
    this.currentTheme.set(DEFAULT_THEME);
    this.isCustomized.set(false);

    const root = document.documentElement;
    root.style.removeProperty('--tournament-primary');
    root.style.removeProperty('--tournament-secondary');
    root.style.removeProperty('--tournament-primary-light');
  }

  /**
   * Generates a lighter version of a hex color.
   * @param hex - hex color string (e.g. '#1a56db')
   * @param amount - lightness factor (0-1, higher = lighter)
   */
  private lightenColor(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.round(((num >> 16) & 0xff) + (255 - ((num >> 16) & 0xff)) * amount));
    const g = Math.min(255, Math.round(((num >> 8) & 0xff) + (255 - ((num >> 8) & 0xff)) * amount));
    const b = Math.min(255, Math.round((num & 0xff) + (255 - (num & 0xff)) * amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }
}
