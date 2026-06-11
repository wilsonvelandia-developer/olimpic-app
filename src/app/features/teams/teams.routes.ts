import { Routes } from '@angular/router';

export const TEAM_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./team-list/team-list').then((m) => m.TeamList),
  },
  {
    path: 'new',
    loadComponent: () => import('./team-form/team-form').then((m) => m.TeamForm),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./team-form/team-form').then((m) => m.TeamForm),
  },
  {
    path: ':id',
    loadComponent: () => import('./team-detail/team-detail').then((m) => m.TeamDetail),
  },
];
