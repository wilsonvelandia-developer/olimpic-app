import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const PAYMENT_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard],
    data: { requiredRole: 'organizer' },
    loadComponent: () => import('./payment-list/payment-list').then((m) => m.PaymentList),
  },
  {
    path: 'new',
    canActivate: [roleGuard],
    data: { requiredRole: 'organizer' },
    loadComponent: () => import('./payment-form/payment-form').then((m) => m.PaymentForm),
  },
  {
    path: ':id/edit',
    canActivate: [roleGuard],
    data: { requiredRole: 'organizer' },
    loadComponent: () => import('./payment-form/payment-form').then((m) => m.PaymentForm),
  },
  {
    path: ':id',
    canActivate: [roleGuard],
    data: { requiredRole: 'organizer' },
    loadComponent: () => import('./payment-detail/payment-detail').then((m) => m.PaymentDetail),
  },
];
