import { Routes } from '@angular/router';

export const MATCH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./match-list/match-list').then((m) => m.MatchList),
  },
];
