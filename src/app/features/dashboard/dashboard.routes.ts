import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'organizer',
    canActivate: [roleGuard],
    data: { requiredRole: 'organizer' },
    loadComponent: () => import('./organizer-dashboard/organizer-dashboard').then((m) => m.OrganizerDashboard),
  },
  {
    path: 'analytics',
    canActivate: [roleGuard],
    data: { requiredRole: 'organizer' },
    loadComponent: () => import('./analytics-dashboard/analytics-dashboard').then((m) => m.AnalyticsDashboard),
  },
];
