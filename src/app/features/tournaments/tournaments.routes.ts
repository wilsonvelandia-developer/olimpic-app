import { Routes } from '@angular/router';

export const TOURNAMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./tournament-list/tournament-list').then((m) => m.TournamentList),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./tournament-form/tournament-form').then((m) => m.TournamentForm),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./tournament-form/tournament-form').then((m) => m.TournamentForm),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./tournament-detail/tournament-detail').then((m) => m.TournamentDetail),
  },
];
