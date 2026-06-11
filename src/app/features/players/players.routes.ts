import { Routes } from '@angular/router';

export const PLAYER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./player-list/player-list').then((m) => m.PlayerList),
  },
];
