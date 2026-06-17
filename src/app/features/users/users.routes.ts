import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const USER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./user-list/user-list').then((m) => m.UserList),
  },
  {
    path: 'new',
    canActivate: [roleGuard],
    data: { requiredRole: 'organizer' },
    loadComponent: () => import('./user-form/user-form').then((m) => m.UserForm),
  },
];
