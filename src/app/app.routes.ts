import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { Shell } from './layout/shell/shell';

export const routes: Routes = [
  // ── Public routes ──────────────────────────────────────────────
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
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
