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
    data: { requiredRole: 'editor' },
    loadComponent: () => import('./match-form/match-form').then((m) => m.MatchForm),
  },
  {
    path: ':id/edit',
    canActivate: [roleGuard],
    data: { requiredRole: 'editor' },
    loadComponent: () => import('./match-form/match-form').then((m) => m.MatchForm),
  },
  {
    // Registering results requires at least editor role
    path: ':id/result',
    canActivate: [roleGuard],
    data: { requiredRole: 'editor' },
    loadComponent: () => import('./match-result/match-result').then((m) => m.MatchResult),
  },
];
