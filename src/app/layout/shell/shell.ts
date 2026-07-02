import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { Sidebar } from '../sidebar/sidebar';
import { OnboardingOverlay } from '../../shared/components/onboarding-overlay/onboarding-overlay';

/** Breakpoint at which the sidebar becomes an overlay. */
const MOBILE_BREAKPOINT = 768;

/**
 * Main application shell. Wraps all authenticated routes.
 * Contains the navbar, sidebar, and main content area.
 * On mobile (< 768px), the sidebar is displayed as an overlay with backdrop.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Navbar, Sidebar, OnboardingOverlay],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
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

  toggleSidebar(): void {
    this.isSidebarOpen.update((open) => !open);
  }

  /**
   * Close sidebar when on mobile (backdrop click or link navigation).
   * Uses matchMedia to reliably detect the current viewport, even after resize.
   */
  closeSidebarOnMobile(): void {
    if (this.isMobileQuery?.matches) {
      this.isSidebarOpen.set(false);
    }
  }
}
