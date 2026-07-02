import { Component, ChangeDetectionStrategy, output, inject, ViewChild } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { OnboardingService } from '../../core/services/onboarding.service';
import { LanguageSwitcher } from '../../shared/components/language-switcher/language-switcher';
import { NotificationBell } from '../../shared/components/notification-bell/notification-bell';
import { GlobalSearch } from '../../shared/components/global-search/global-search';

/**
 * Top navigation bar. Emits a toggle event for the sidebar.
 */
@Component({
  selector: 'app-navbar',
  imports: [LanguageSwitcher, NotificationBell, GlobalSearch],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  private readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  private readonly onboarding = inject(OnboardingService);

  @ViewChild(GlobalSearch) private globalSearch!: GlobalSearch;

  readonly menuToggle = output<void>();
  readonly currentUser = this.auth.currentUser;

  onMenuToggle(): void { this.menuToggle.emit(); }
  onToggleTheme(): void { this.theme.toggle(); }
  onOpenSearch(): void { this.globalSearch.open(); }
  onStartTour(): void { this.onboarding.reset(); this.onboarding.startTour(); }
  onLogout(): void { this.auth.logout().subscribe(); }
}
