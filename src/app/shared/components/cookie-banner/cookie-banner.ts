import { Component, ChangeDetectionStrategy, signal, OnInit } from '@angular/core';

/**
 * Cookie consent banner.
 * Shows a fixed bottom banner on first visit. Hides after the user accepts.
 * Consent is stored in localStorage ('cookie_consent' = 'accepted').
 */
@Component({
  selector: 'app-cookie-banner',
  templateUrl: './cookie-banner.html',
  styleUrl: './cookie-banner.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CookieBanner implements OnInit {
  readonly isVisible = signal<boolean>(false);

  private readonly STORAGE_KEY = 'cookie_consent';

  ngOnInit(): void {
    if (typeof window === 'undefined') return;
    const consent = localStorage.getItem(this.STORAGE_KEY);
    if (!consent) {
      this.isVisible.set(true);
    }
  }

  accept(): void {
    localStorage.setItem(this.STORAGE_KEY, 'accepted');
    this.isVisible.set(false);
  }

  reject(): void {
    // User rejects non-essential cookies — we still use essential auth cookies
    localStorage.setItem(this.STORAGE_KEY, 'essential_only');
    this.isVisible.set(false);
  }
}
