import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const TEAM_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./team-list/team-list').then((m) => m.TeamList),
  },
  {
    path: 'new',
    canActivate: [roleGuard],
    data: { requiredRole: 'organizer' },
    loadComponent: () => import('./team-form/team-form').then((m) => m.TeamForm),
  },
  {
    path: ':id/edit',
    canActivate: [roleGuard],
    data: { requiredRole: 'organizer' },
    loadComponent: () => import('./team-form/team-form').then((m) => m.TeamForm),
  },
  {
    path: ':id',
    loadComponent: () => import('./team-detail/team-detail').then((m) => m.TeamDetail),
  },
];
