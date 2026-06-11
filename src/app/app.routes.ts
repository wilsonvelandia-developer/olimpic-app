import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { Shell } from './layout/shell/shell';

export const routes: Routes = [
  // Public routes
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },

  // Protected routes — wrapped in the shell layout
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
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: 'tournaments',
        loadChildren: () =>
          import('./features/tournaments/tournaments.routes').then((m) => m.TOURNAMENT_ROUTES),
      },
      {
        path: 'teams',
        loadChildren: () =>
          import('./features/teams/teams.routes').then((m) => m.TEAM_ROUTES),
      },
      {
        path: 'players',
        loadChildren: () =>
          import('./features/players/players.routes').then((m) => m.PLAYER_ROUTES),
      },
      {
        path: 'matches',
        loadChildren: () =>
          import('./features/matches/matches.routes').then((m) => m.MATCH_ROUTES),
      },
      {
        path: 'sports',
        loadChildren: () =>
          import('./features/sports/sports.routes').then((m) => m.SPORT_ROUTES),
      },
    ],
  },

  // Fallback
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
