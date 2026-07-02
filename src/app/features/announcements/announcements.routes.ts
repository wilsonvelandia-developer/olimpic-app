import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const ANNOUNCEMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./announcement-list/announcement-list').then((m) => m.AnnouncementList),
  },
  {
    path: 'new',
    canActivate: [roleGuard],
    data: { requiredRole: 'organizer' },
    loadComponent: () => import('./announcement-form/announcement-form').then((m) => m.AnnouncementForm),
  },
  {
    path: ':id/edit',
    canActivate: [roleGuard],
    data: { requiredRole: 'organizer' },
    loadComponent: () => import('./announcement-form/announcement-form').then((m) => m.AnnouncementForm),
  },
  {
    path: ':id',
    loadComponent: () => import('./announcement-detail/announcement-detail').then((m) => m.AnnouncementDetail),
  },
];
