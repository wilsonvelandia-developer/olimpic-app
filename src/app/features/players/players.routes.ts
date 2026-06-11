import { Routes } from '@angular/router';

export const PLAYER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./player-list/player-list').then((m) => m.PlayerList),
  },
  {
    path: 'new',
    loadComponent: () => import('./player-form/player-form').then((m) => m.PlayerForm),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./player-form/player-form').then((m) => m.PlayerForm),
  },
  {
    path: ':id',
    loadComponent: () => import('./player-detail/player-detail').then((m) => m.PlayerDetail),
  },
];
