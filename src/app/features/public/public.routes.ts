import { Routes } from '@angular/router';

/**
 * Public routes — accessible without authentication.
 * Used by spectators, parents, and anyone with the shareable link.
 */
export const PUBLIC_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./public-tournaments/public-tournaments').then((m) => m.PublicTournaments),
  },
  {
    path: 'tournament/:id',
    loadComponent: () =>
      import('./public-tournament-detail/public-tournament-detail').then((m) => m.PublicTournamentDetail),
  },
  {
    path: 'tournament/:tournamentId/enroll',
    loadComponent: () =>
      import('./public-enrollment/public-enrollment').then((m) => m.PublicEnrollment),
  },
  {
    path: 'match/:id',
    loadComponent: () =>
      import('./public-match/public-match').then((m) => m.PublicMatch),
  },
  {
    path: 'match/:id/sheet',
    loadComponent: () =>
      import('../matches/match-sheet/match-sheet').then((m) => m.MatchSheet),
  },
];
