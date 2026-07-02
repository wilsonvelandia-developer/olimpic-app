import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { AuthService } from '../../../core/services/auth.service';
import type { PaginatedResponse } from '../../../core/models';

interface MetricCard {
  icon: string;
  label: string;
  value: number | string;
  color: string;
  route?: string;
}

interface RecentPayment {
  id: string;
  teamName: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: string;
}

interface UpcomingMatch {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  scheduledAt: string;
  venue: string | null;
}

/**
 * Organizer dashboard — shows key metrics, recent payments, and upcoming matches.
 */
@Component({
  selector: 'app-organizer-dashboard',
  imports: [LoadingSpinner],
  templateUrl: './organizer-dashboard.html',
  styleUrl: './organizer-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizerDashboard implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly metrics = signal<MetricCard[]>([]);
  readonly recentPayments = signal<RecentPayment[]>([]);
  readonly upcomingMatches = signal<UpcomingMatch[]>([]);
  readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadMetrics();
  }

  private loadMetrics(): void {
    this.isLoading.set(true);

    forkJoin({
      tournaments: this.api.getPaginated<unknown>('/tournaments', { pageSize: 1 }),
      teams: this.api.getPaginated<unknown>('/teams', { pageSize: 1 }),
      matches: this.api.getPaginated<unknown>('/matches', { pageSize: 1 }),
      payments: this.api.get<RecentPayment[]>('/payments?pageSize=5'),
      upcoming: this.api.get<UpcomingMatch[]>('/matches?status=scheduled&pageSize=5'),
    }).subscribe({
      next: ({ tournaments, teams, matches, payments, upcoming }) => {
        this.metrics.set([
          { icon: '🏆', label: 'Torneos', value: (tournaments as PaginatedResponse<unknown>).total, color: 'primary', route: '/tournaments' },
          { icon: '👥', label: 'Equipos', value: (teams as PaginatedResponse<unknown>).total, color: 'success', route: '/teams' },
          { icon: '⚽', label: 'Partidos', value: (matches as PaginatedResponse<unknown>).total, color: 'info', route: '/matches' },
          { icon: '💰', label: 'Pagos', value: this.calcTotalPayments(payments.data ?? []), color: 'warning', route: '/payments' },
        ]);
        this.recentPayments.set((payments.data ?? []).slice(0, 5));
        this.upcomingMatches.set((upcoming.data ?? []).slice(0, 5));
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  private calcTotalPayments(payments: RecentPayment[]): string {
    const total = payments.reduce((sum, p) => sum + (p.status === 'confirmed' ? p.amount : 0), 0);
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(total);
  }

  onNavigate(route: string | undefined): void {
    if (route) this.router.navigate([route]);
  }

  onViewPayment(id: string): void { this.router.navigate(['/payments', id]); }
  onViewMatch(id: string): void { this.router.navigate(['/matches', id]); }

  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: currency || 'COP', maximumFractionDigits: 0 }).format(amount);
  }

  formatDate(dt: string): string {
    return new Date(dt).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
