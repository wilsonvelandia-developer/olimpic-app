import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DashboardService } from './dashboard.service';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';
import { AuthService } from '../../core/services/auth.service';
import { OnboardingService } from '../../core/services/onboarding.service';
import type { DashboardStats, RecentTournament, RecentMatch } from './dashboard.service';

interface StatCard {
  label: string;
  value: number;
  icon: string;
  route: string;
  accent: 'primary' | 'success' | 'warning' | 'info';
}

/**
 * Dashboard overview. Loads stats and recent activity in parallel.
 */
@Component({
  selector: 'app-dashboard',
  imports: [StatusBadge, LoadingSpinner],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  private readonly onboarding = inject(OnboardingService);

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly stats = signal<DashboardStats | null>(null);
  readonly recentTournaments = signal<RecentTournament[]>([]);
  readonly recentMatches = signal<RecentMatch[]>([]);

  readonly statCards = signal<StatCard[]>([]);

  ngOnInit(): void {
    this.loadDashboard();
    // Start onboarding tour for first-time users
    this.onboarding.startIfNew();
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      stats:       this.dashboardService.getStats(),
      tournaments: this.dashboardService.getRecentTournaments(),
      matches:     this.dashboardService.getRecentMatches(),
    }).subscribe({
      next: ({ stats, tournaments, matches }) => {
        this.stats.set(stats);
        this.recentTournaments.set(tournaments);
        this.recentMatches.set(matches);
        this.statCards.set(this.buildStatCards(stats));
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudieron cargar las estadísticas.');
        this.isLoading.set(false);
      },
    });
  }

  private buildStatCards(s: DashboardStats): StatCard[] {
    return [
      { label: 'Torneos activos',   value: s.activeTournaments, icon: '🏆', route: '/tournaments', accent: 'primary' },
      { label: 'Total torneos',     value: s.totalTournaments,  icon: '📋', route: '/tournaments', accent: 'info' },
      { label: 'Equipos',           value: s.totalTeams,        icon: '👥', route: '/teams',       accent: 'success' },
      { label: 'Jugadores',         value: s.totalPlayers,      icon: '🏃', route: '/players',     accent: 'success' },
      { label: 'Partidos pendientes', value: s.pendingMatches,  icon: '⏰', route: '/matches',     accent: 'warning' },
      { label: 'Total partidos',    value: s.totalMatches,      icon: '⚽', route: '/matches',     accent: 'info' },
      { label: 'Deportes',          value: s.totalSports,       icon: '🎯', route: '/sports',      accent: 'primary' },
    ];
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-CO', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('es-CO', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  }
}
