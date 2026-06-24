import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const REFEREE_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard],
    data: { requiredRole: 'referee' },
    loadComponent: () =>
      import('./referee-select/referee-select').then((m) => m.RefereeSelect),
  },
  {
    path: 'match/:id',
    canActivate: [roleGuard],
    data: { requiredRole: 'referee' },
    loadComponent: () =>
      import('./referee-panel/referee-panel').then((m) => m.RefereePanel),
  },
];
