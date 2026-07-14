import { Component, ChangeDetectionStrategy, inject, signal, OnInit, input } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import type { MatchDetail as MatchDetailModel, MatchPeriod } from '../../../core/models/match.model';

/**
 * Match detail view — shows full match info, scores by period/set, teams, and schedule.
 */
@Component({
  selector: 'app-match-detail',
  imports: [LoadingSpinner, StatusBadge],
  template: `
    <section class="page">
      @if (isLoading()) { <app-loading-spinner label="Cargando partido..." /> }

      @if (!isLoading() && match()) {
        <div class="match-detail">
          <button type="button" class="btn btn--ghost btn--sm" (click)="goBack()">← Volver</button>

          <div class="match-detail__header">
            <app-status-badge [status]="match()!.match.status" />
            <span class="match-detail__date">{{ formatDate(match()!.match.scheduledAt) }}</span>
          </div>

          <div class="match-detail__scoreboard">
            <div class="match-detail__team">
              <strong>{{ match()!.match.homeTeamName ?? 'Local' }}</strong>
            </div>
            <div class="match-detail__score">
              @if (match()!.match.status !== 'scheduled') {
                <span class="match-detail__score-main">{{ homeTotal() }} - {{ awayTotal() }}</span>
                @if (isSetBased()) {
                  <span class="match-detail__score-sets">Sets: {{ homeSets() }} - {{ awaySets() }}</span>
                }
              } @else {
                <span class="match-detail__score-vs">VS</span>
              }
            </div>
            <div class="match-detail__team">
              <strong>{{ match()!.match.awayTeamName ?? 'Visitante' }}</strong>
            </div>
          </div>

          @if (match()!.periods.length > 0) {
            <div class="match-detail__periods">
              <h3>Detalle por set/período</h3>
              <table class="table">
                <thead><tr><th>Set</th><th>{{ match()!.match.homeTeamName ?? 'Local' }}</th><th>{{ match()!.match.awayTeamName ?? 'Visitante' }}</th><th>Estado</th></tr></thead>
                <tbody>
                  @for (p of match()!.periods; track p.id) {
                    <tr>
                      <td>{{ p.periodNumber }}</td>
                      <td><strong>{{ p.homeScore }}</strong></td>
                      <td><strong>{{ p.awayScore }}</strong></td>
                      <td><app-status-badge [status]="p.status" /></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

      @if (!isLoading() && !match()) {
        <p class="empty-state">Partido no encontrado.</p>
      }
    </section>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 1.5rem; }
    .match-detail { display: flex; flex-direction: column; gap: 1.25rem; }
    .match-detail__header { display: flex; align-items: center; gap: 1rem; }
    .match-detail__date { color: var(--color-text-secondary); font-size: 0.9rem; }
    .match-detail__scoreboard { display: flex; align-items: center; justify-content: center; gap: 2rem; padding: 1.5rem; background: var(--color-bg-primary); border: 1px solid var(--color-border); border-radius: var(--radius-lg); }
    .match-detail__team { text-align: center; flex: 1; }
    .match-detail__score { text-align: center; display: flex; flex-direction: column; gap: 0.25rem; }
    .match-detail__score-main { font-size: 2rem; font-weight: 700; }
    .match-detail__score-sets { font-size: 0.85rem; color: var(--color-text-secondary); }
    .match-detail__score-vs { font-size: 1.5rem; font-weight: 600; color: var(--color-text-secondary); }
    .match-detail__periods { background: var(--color-bg-primary); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 1rem; }
    .match-detail__periods h3 { font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; }
    .empty-state { text-align: center; color: var(--color-text-secondary); padding: 2rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchDetail implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();
  readonly isLoading = signal(true);
  readonly match = signal<MatchDetailModel | null>(null);

  ngOnInit(): void {
    this.api.get<MatchDetailModel>(`/matches/${this.id()}`).subscribe({
      next: (res) => { if (res.success && res.data) this.match.set(res.data); this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });
  }

  homeTotal(): number {
    return this.match()?.periods.reduce((s, p) => s + p.homeScore, 0) ?? 0;
  }

  awayTotal(): number {
    return this.match()?.periods.reduce((s, p) => s + p.awayScore, 0) ?? 0;
  }

  homeSets(): number {
    return this.match()?.periods.filter((p) => p.status === 'finished' && p.homeScore > p.awayScore).length ?? 0;
  }

  awaySets(): number {
    return this.match()?.periods.filter((p) => p.status === 'finished' && p.awayScore > p.homeScore).length ?? 0;
  }

  isSetBased(): boolean {
    return (this.match()?.periods.length ?? 0) > 2;
  }

  goBack(): void { this.router.navigate(['/matches']); }

  formatDate(d: string | null): string {
    if (!d) return 'Sin programar';
    return new Date(d).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' });
  }
}
