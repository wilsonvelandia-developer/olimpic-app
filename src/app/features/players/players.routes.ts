import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const PLAYER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./player-list/player-list').then((m) => m.PlayerList),
  },
  {
    path: 'my-dashboard',
    loadComponent: () => import('./player-dashboard/player-dashboard').then((m) => m.PlayerDashboard),
  },
  {
    path: 'new',
    canActivate: [roleGuard],
    data: { requiredRole: 'organizer' },
    loadComponent: () => import('./player-form/player-form').then((m) => m.PlayerForm),
  },
  {
    path: ':id/edit',
    canActivate: [roleGuard],
    data: { requiredRole: 'organizer' },
    loadComponent: () => import('./player-form/player-form').then((m) => m.PlayerForm),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./player-detail/player-detail').then((m) => m.PlayerDetail),
  },
];
