import {
  Component,
  ChangeDetectionStrategy,
  output,
  inject,
} from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

/**
 * Top navigation bar. Emits a toggle event for the sidebar.
 */
@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  private readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);

  readonly menuToggle = output<void>();

  readonly currentUser = this.auth.currentUser;

  onMenuToggle(): void {
    this.menuToggle.emit();
  }

  onToggleTheme(): void {
    this.theme.toggle();
  }

  onLogout(): void {
    this.auth.logout().subscribe();
  }
}
