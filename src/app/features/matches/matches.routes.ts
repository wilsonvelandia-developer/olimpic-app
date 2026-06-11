import { Routes } from '@angular/router';

export const MATCH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./match-list/match-list').then((m) => m.MatchList),
  },
  {
    path: 'new',
    loadComponent: () => import('./match-form/match-form').then((m) => m.MatchForm),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./match-form/match-form').then((m) => m.MatchForm),
  },
  {
    path: ':id/result',
    loadComponent: () => import('./match-result/match-result').then((m) => m.MatchResult),
  },
];
