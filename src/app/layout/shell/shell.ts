import { Component, ChangeDetectionStrategy, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { Navbar } from '../navbar/navbar';
import { Sidebar } from '../sidebar/sidebar';
import { OnboardingOverlay } from '../../shared/components/onboarding-overlay/onboarding-overlay';

/** Breakpoint at which the sidebar becomes an overlay. */
const MOBILE_BREAKPOINT = 768;

/**
 * Main application shell. Wraps all authenticated routes.
 * Contains the navbar, sidebar, and main content area.
 * On mobile (< 768px), the sidebar is displayed as an overlay with backdrop.
 *
 * Accessibility:
 *  - Skip-link targets #main-content
 *  - Focus moves to main content on route changes (keyboard users)
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Navbar, Sidebar, OnboardingOverlay],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private routerSub: Subscription | null = null;

  readonly isSidebarOpen = signal(true);

  private readonly isMobileQuery: MediaQueryList | null =
    typeof window !== 'undefined'
      ? window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
      : null;

  constructor() {
    // Start with sidebar closed on mobile
    if (this.isMobileQuery?.matches) {
      this.isSidebarOpen.set(false);
    }
  }

  ngOnInit(): void {
    // Move focus to main content after each navigation (accessibility)
    this.routerSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        const main = document.getElementById('main-content');
        if (main) {
          main.setAttribute('tabindex', '-1');
          main.focus({ preventScroll: true });
        }
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  toggleSidebar(): void {
    this.isSidebarOpen.update((open) => !open);
  }

  /**
   * Close sidebar when on mobile (backdrop click or link navigation).
   */
  closeSidebarOnMobile(): void {
    if (this.isMobileQuery?.matches) {
      this.isSidebarOpen.set(false);
    }
  }
}
