import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

/**
 * Sidebar navigation component. Driven by a static nav config
 * that maps to the lazy-loaded feature routes.
 */
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  readonly isOpen = input<boolean>(true);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: '📊' },
    { label: 'Torneos', route: '/tournaments', icon: '🏆' },
    { label: 'Equipos', route: '/teams', icon: '👥' },
    { label: 'Jugadores', route: '/players', icon: '🏃' },
    { label: 'Partidos', route: '/matches', icon: '⚽' },
    { label: 'Deportes', route: '/sports', icon: '🎯' },
  ];
}
