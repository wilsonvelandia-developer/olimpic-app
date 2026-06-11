import { Routes } from '@angular/router';

export const SPORT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./sport-list/sport-list').then((m) => m.SportList),
  },
];
