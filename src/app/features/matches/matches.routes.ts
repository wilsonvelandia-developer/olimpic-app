import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const MATCH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./match-list/match-list').then((m) => m.MatchList),
  },
  {
    path: 'new',
    canActivate: [roleGuard],
    data: { requiredRole: 'organizer' },
    loadComponent: () => import('./match-form/match-form').then((m) => m.MatchForm),
  },
  {
    path: ':id/edit',
    canActivate: [roleGuard],
    data: { requiredRole: 'organizer' },
    loadComponent: () => import('./match-form/match-form').then((m) => m.MatchForm),
  },
  {
    // Registering results requires at least editor role
    path: ':id/result',
    canActivate: [roleGuard],
    data: { requiredRole: 'organizer' },
    loadComponent: () => import('./match-result/match-result').then((m) => m.MatchResult),
  },
  {
    // Match sheet — official digital report (planilla)
    path: ':id/sheet',
    loadComponent: () => import('./match-sheet/match-sheet').then((m) => m.MatchSheet),
  },
  {
    // Match detail — view match info, scores, teams
    path: ':id',
    loadComponent: () => import('./match-detail/match-detail').then((m) => m.MatchDetail),
  },
];
