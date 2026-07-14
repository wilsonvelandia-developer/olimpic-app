import { Component, ChangeDetectionStrategy, input, output, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import type { AppRole } from '../../core/models/role.model';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  /** Minimum role required to see this nav item. Default: 'viewer' (all users). */
  minRole?: AppRole;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',      route: '/dashboard',            icon: '📊' },
  { label: 'Panel Org.',     route: '/dashboard/organizer',  icon: '📈', minRole: 'organizer' },
  { label: 'Torneos',        route: '/tournaments',          icon: '🏆' },
  { label: 'Equipos',        route: '/teams',                icon: '👥' },
  { label: 'Jugadores',      route: '/players',              icon: '🏃' },
  { label: 'Partidos',       route: '/matches',              icon: '⚽' },
  { label: 'Sedes',          route: '/venues',               icon: '🏟️' },
  { label: 'Comunicados',    route: '/announcements',        icon: '📢' },
  { label: 'Galería',        route: '/gallery',              icon: '📸' },
  { label: 'Pagos',          route: '/payments',             icon: '💰', minRole: 'president' },
  { label: 'Árbitros',       route: '/referee-management',   icon: '🧑‍⚖️', minRole: 'organizer' },
  { label: 'Chat',           route: '/chat',                 icon: '💬', minRole: 'president' },
  { label: 'Árbitro',        route: '/referee',              icon: '🏁', minRole: 'referee' },
  { label: 'Observaciones',  route: '/observations',         icon: '📝', minRole: 'observer' },
  { label: 'Deportes',       route: '/sports',               icon: '🎯', minRole: 'admin' },
  { label: 'Usuarios',       route: '/users',                icon: '🔐', minRole: 'organizer' },
];

/**
 * Sidebar navigation. Filters nav items based on the current user's role.
 * Items with minRole are hidden from users with insufficient privileges.
 * Emits linkClicked when a navigation link is tapped (used to close sidebar on mobile).
 */
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  private readonly auth = inject(AuthService);

  readonly isOpen = input<boolean>(false);
  readonly linkClicked = output<void>();

  /** Only include items the current user can access. */
  readonly visibleNavItems = computed<NavItem[]>(() =>
    ALL_NAV_ITEMS.filter(
      (item) => !item.minRole || this.auth.hasRole(item.minRole),
    ),
  );

  onLinkClick(): void {
    this.linkClicked.emit();
  }
}
