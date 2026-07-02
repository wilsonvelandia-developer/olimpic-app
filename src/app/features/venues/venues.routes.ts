import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const VENUE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./venue-list/venue-list').then((m) => m.VenueList),
  },
  {
    path: 'new',
    canActivate: [roleGuard],
    data: { requiredRole: 'organizer' },
    loadComponent: () => import('./venue-form/venue-form').then((m) => m.VenueForm),
  },
  {
    path: ':id/edit',
    canActivate: [roleGuard],
    data: { requiredRole: 'organizer' },
    loadComponent: () => import('./venue-form/venue-form').then((m) => m.VenueForm),
  },
  {
    path: ':id',
    loadComponent: () => import('./venue-detail/venue-detail').then((m) => m.VenueDetail),
  },
];
