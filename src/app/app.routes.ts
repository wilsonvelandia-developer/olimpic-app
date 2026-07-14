import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { Shell } from './layout/shell/shell';

export const routes: Routes = [
  // ── Public routes (no authentication) ──────────────────────────
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    // Public spectator views — accessible without login
    path: 'p',
    loadChildren: () => import('./features/public/public.routes').then((m) => m.PUBLIC_ROUTES),
  },

  // ── 403 page (inside shell so navbar/sidebar are still visible) ─
  {
    path: 'forbidden',
    component: Shell,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/forbidden/forbidden').then((m) => m.Forbidden),
      },
    ],
  },

  // ── Protected routes ───────────────────────────────────────────
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },

      // viewer+ (all authenticated users)
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },

      // viewer+ — read access for all
      {
        path: 'tournaments',
        loadChildren: () =>
          import('./features/tournaments/tournaments.routes').then((m) => m.TOURNAMENT_ROUTES),
      },

      // viewer+ — read access for all
      {
        path: 'teams',
        loadChildren: () =>
          import('./features/teams/teams.routes').then((m) => m.TEAM_ROUTES),
      },

      // viewer+ — read access for all
      {
        path: 'players',
        loadChildren: () =>
          import('./features/players/players.routes').then((m) => m.PLAYER_ROUTES),
      },

      // viewer+ — read access for all
      {
        path: 'matches',
        loadChildren: () =>
          import('./features/matches/matches.routes').then((m) => m.MATCH_ROUTES),
      },

      // viewer+ — venue catalog
      {
        path: 'venues',
        loadChildren: () =>
          import('./features/venues/venues.routes').then((m) => m.VENUE_ROUTES),
      },

      // president+ — payment management (coaches/presidents see read-only)
      {
        path: 'payments',
        canActivate: [roleGuard],
        data: { requiredRole: 'president' },
        loadChildren: () =>
          import('./features/payments/payments.routes').then((m) => m.PAYMENT_ROUTES),
      },

      // viewer+ — announcements
      {
        path: 'announcements',
        loadChildren: () =>
          import('./features/announcements/announcements.routes').then((m) => m.ANNOUNCEMENT_ROUTES),
      },

      // viewer+ — gallery
      {
        path: 'gallery',
        loadChildren: () =>
          import('./features/gallery/gallery.routes').then((m) => m.GALLERY_ROUTES),
      },

      // observer+ — observations
      {
        path: 'observations',
        canActivate: [roleGuard],
        data: { requiredRole: 'observer' },
        loadComponent: () =>
          import('./features/observations/observations').then((m) => m.Observations),
      },

      // organizer+ — referee management (history/availability)
      {
        path: 'referee-management',
        canActivate: [roleGuard],
        data: { requiredRole: 'organizer' },
        loadComponent: () =>
          import('./features/referee/referee-history/referee-history').then((m) => m.RefereeHistory),
      },

      // referee+ — referee panel (match selection and scoring)
      {
        path: 'referee',
        canActivate: [roleGuard],
        data: { requiredRole: 'referee' },
        loadChildren: () =>
          import('./features/referee/referee.routes').then((m) => m.REFEREE_ROUTES),
      },

      // president+ — real-time chat
      {
        path: 'chat',
        canActivate: [roleGuard],
        data: { requiredRole: 'president' },
        loadComponent: () =>
          import('./shared/components/chat-panel/chat-panel').then((m) => m.ChatPanel),
      },

      // admin only — sport catalog is master data
      {
        path: 'sports',
        canActivate: [roleGuard],
        data: { requiredRole: 'admin' },
        loadChildren: () =>
          import('./features/sports/sports.routes').then((m) => m.SPORT_ROUTES),
      },

      // organizer+ — user management
      {
        path: 'users',
        canActivate: [roleGuard],
        data: { requiredRole: 'organizer' },
        loadChildren: () =>
          import('./features/users/users.routes').then((m) => m.USER_ROUTES),
      },
    ],
  },

  // Fallback
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
