import { Routes } from '@angular/router';

export const SPORT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./sport-list/sport-list').then((m) => m.SportList),
  },
  {
    path: 'new',
    loadComponent: () => import('./sport-form/sport-form').then((m) => m.SportForm),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./sport-form/sport-form').then((m) => m.SportForm),
  },
  {
    path: ':id',
    loadComponent: () => import('./sport-detail/sport-detail').then((m) => m.SportDetail),
  },
];
