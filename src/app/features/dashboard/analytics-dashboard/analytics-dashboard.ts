import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { BarChart, type BarChartData } from '../../../shared/components/bar-chart/bar-chart';
import { DonutChart, type DonutChartSegment } from '../../../shared/components/donut-chart/donut-chart';

/**
 * Analytics/BI dashboard — shows visual metrics with charts.
 * Accessible by organizers and admins.
 */
@Component({
  selector: 'app-analytics-dashboard',
  imports: [LoadingSpinner, BarChart, DonutChart],
  templateUrl: './analytics-dashboard.html',
  styleUrl: './analytics-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsDashboard implements OnInit {
  private readonly api = inject(ApiService);

  readonly isLoading = signal<boolean>(true);
  readonly matchesByStatus = signal<DonutChartSegment[]>([]);
  readonly paymentsByMethod = signal<DonutChartSegment[]>([]);
  readonly teamsByTournament = signal<BarChartData[]>([]);
  readonly matchesByRound = signal<BarChartData[]>([]);

  ngOnInit(): void {
    this.loadAnalytics();
  }

  private loadAnalytics(): void {
    this.isLoading.set(true);

    // Load matches for status distribution
    this.api.get<Array<{ status: string }>>('/matches?pageSize=500').subscribe({
      next: (res) => {
        const data = res.data ?? [];
        const scheduled = data.filter((m) => m.status === 'scheduled').length;
        const inProgress = data.filter((m) => m.status === 'in_progress').length;
        const finished = data.filter((m) => m.status === 'finished').length;
        this.matchesByStatus.set([
          { label: 'Programados', value: scheduled, color: '#3b82f6' },
          { label: 'En curso', value: inProgress, color: '#f59e0b' },
          { label: 'Finalizados', value: finished, color: '#10b981' },
        ]);

        // Group matches by round for bar chart
        const roundCounts = new Map<string, number>();
        data.forEach((m) => {
          const round = (m as unknown as { round?: string }).round ?? 'Sin ronda';
          roundCounts.set(round, (roundCounts.get(round) ?? 0) + 1);
        });
        this.matchesByRound.set(
          [...roundCounts.entries()].slice(0, 8).map(([label, value]) => ({ label, value })),
        );
      },
    });

    // Load payments for method distribution
    this.api.get<Array<{ paymentMethod: string; payment_method?: string }>>('/payments?pageSize=500').subscribe({
      next: (res) => {
        const data = res.data ?? [];
        const methodColors: Record<string, string> = {
          cash: '#10b981', transfer: '#3b82f6', card: '#8b5cf6', nequi: '#ec4899', other: '#6b7280',
        };
        const methodCounts = new Map<string, number>();
        data.forEach((p) => {
          const method = p.paymentMethod ?? p.payment_method ?? 'other';
          methodCounts.set(method, (methodCounts.get(method) ?? 0) + 1);
        });
        this.paymentsByMethod.set(
          [...methodCounts.entries()].map(([label, value]) => ({
            label, value, color: methodColors[label] ?? '#6b7280',
          })),
        );
      },
    });

    // Load teams grouped by tournament
    this.api.get<Array<{ id: string; name: string; tournamentId?: string }>>('/teams?pageSize=500').subscribe({
      next: (res) => {
        const data = res.data ?? [];
        // Just count total and show top tournaments
        this.teamsByTournament.set([
          { label: 'Total equipos', value: data.length, color: '#1a56db' },
        ]);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }
}
