import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const TOURNAMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./tournament-list/tournament-list').then((m) => m.TournamentList),
  },
  {
    // editor+ can create tournaments
    path: 'new',
    canActivate: [roleGuard],
    data: { requiredRole: 'organizer' },
    loadComponent: () =>
      import('./tournament-form/tournament-form').then((m) => m.TournamentForm),
  },
  {
    // editor+ can edit tournaments
    path: ':id/edit',
    canActivate: [roleGuard],
    data: { requiredRole: 'organizer' },
    loadComponent: () =>
      import('./tournament-form/tournament-form').then((m) => m.TournamentForm),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./tournament-detail/tournament-detail').then((m) => m.TournamentDetail),
  },
];
