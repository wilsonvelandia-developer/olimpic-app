import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const GALLERY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./gallery-list/gallery-list').then((m) => m.GalleryList),
  },
  {
    path: 'new',
    canActivate: [roleGuard],
    data: { requiredRole: 'organizer' },
    loadComponent: () => import('./gallery-form/gallery-form').then((m) => m.GalleryForm),
  },
  {
    path: ':id/edit',
    canActivate: [roleGuard],
    data: { requiredRole: 'organizer' },
    loadComponent: () => import('./gallery-form/gallery-form').then((m) => m.GalleryForm),
  },
  {
    path: ':id',
    loadComponent: () => import('./gallery-detail/gallery-detail').then((m) => m.GalleryDetail),
  },
];
