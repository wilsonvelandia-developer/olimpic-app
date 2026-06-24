import { inject, Injectable, signal, computed } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import type { MatchDetail, MatchPeriod, Match } from '../../core/models/match.model';
import type { MatchEventItem } from './match-events-log/match-events-log';

type MatchStatus = 'scheduled' | 'in_progress' | 'finished';

/**
 * Manages the local state of a match being controlled by the referee.
 * Coordinates API calls and provides reactive signals for the UI.
 * Scoped per-component (provided in RefereePanel).
 */
@Injectable()
export class RefereeService {
  private readonly api = inject(ApiService);

  // ── State ─────────────────────────────────────────────────────────────────
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  private readonly _match = signal<Match | null>(null);
  private readonly _periods = signal<MatchPeriod[]>([]);
  readonly events = signal<MatchEventItem[]>([]);

  // ── Computed ──────────────────────────────────────────────────────────────
  readonly matchStatus = computed<MatchStatus>(() => this._match()?.status ?? 'scheduled');
  readonly homeTeamName = computed(() => this._match()?.homeTeamName ?? 'Local');
  readonly awayTeamName = computed(() => this._match()?.awayTeamName ?? 'Visitante');

  readonly hasSets = computed(() => {
    const periods = this._periods();
    return periods.length > 2;
  });

  readonly currentPeriod = computed<MatchPeriod | null>(() => {
    const periods = this._periods();
    return periods.find((p) => p.status === 'in_progress') ?? periods[periods.length - 1] ?? null;
  });

  readonly currentPeriodLabel = computed(() => {
    const period = this.currentPeriod();
    if (!period) return 'P1';
    const hasSets = this.hasSets();
    return hasSets ? `SET ${period.periodNumber}` : `P${period.periodNumber}`;
  });

  readonly currentPeriodHomeScore = computed(() => this.currentPeriod()?.homeScore ?? 0);
  readonly currentPeriodAwayScore = computed(() => this.currentPeriod()?.awayScore ?? 0);

  readonly homeSetsWon = computed(() => {
    return this._periods().filter(
      (p) => p.status === 'finished' && p.homeScore > p.awayScore,
    ).length;
  });

  readonly awaySetsWon = computed(() => {
    return this._periods().filter(
      (p) => p.status === 'finished' && p.awayScore > p.homeScore,
    ).length;
  });

  private matchId = '';

  // ── Load Match ────────────────────────────────────────────────────────────

  /** Loads match data from the API. */
  loadMatch(matchId: string): void {
    this.matchId = matchId;
    this.isLoading.set(true);
    this.error.set(null);

    this.api.get<MatchDetail>(`/matches/${matchId}`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this._match.set(res.data.match);
          this._periods.set(res.data.periods);
          this.loadEvents();
        } else {
          this.error.set('No se pudo cargar el partido');
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar el partido');
        this.isLoading.set(false);
      },
    });
  }

  /** Loads match events timeline. */
  private loadEvents(): void {
    this.api.get<MatchEventItem[]>(`/matches/${this.matchId}/events`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.events.set(res.data);
        }
      },
    });
  }

  // ── Match Lifecycle ───────────────────────────────────────────────────────

  /** Start the match (changes status to in_progress, creates periods). */
  startMatch(): void {
    this.api.put<MatchDetail>(`/matches/${this.matchId}/start`, {}).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this._match.set(res.data.match);
          this._periods.set(res.data.periods);
        }
      },
      error: () => this.error.set('Error al iniciar el partido'),
    });
  }

  /** Finish the match (computes winner). */
  finishMatch(): void {
    this.api.put<MatchDetail>(`/matches/${this.matchId}/finish`, {}).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this._match.set(res.data.match);
          this._periods.set(res.data.periods);
        }
      },
      error: () => this.error.set('Error al finalizar el partido'),
    });
  }

  // ── Scoring ───────────────────────────────────────────────────────────────

  /** Add a point to the specified side. */
  addPoint(side: 'home' | 'away'): void {
    const period = this.currentPeriod();
    if (!period) return;

    const homeScore = side === 'home' ? period.homeScore + 1 : period.homeScore;
    const awayScore = side === 'away' ? period.awayScore + 1 : period.awayScore;

    this.updateScore(period.periodNumber, homeScore, awayScore);
  }

  /** Remove a point from the specified side. */
  removePoint(side: 'home' | 'away'): void {
    const period = this.currentPeriod();
    if (!period) return;

    const homeScore = side === 'home' ? Math.max(0, period.homeScore - 1) : period.homeScore;
    const awayScore = side === 'away' ? Math.max(0, period.awayScore - 1) : period.awayScore;

    this.updateScore(period.periodNumber, homeScore, awayScore);
  }

  private updateScore(periodNumber: number, homeScore: number, awayScore: number): void {
    this.api.put<MatchDetail>(
      `/matches/${this.matchId}/periods/${periodNumber}/score`,
      { homeScore, awayScore },
    ).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this._match.set(res.data.match);
          this._periods.set(res.data.periods);
        }
      },
      error: () => this.error.set('Error al actualizar marcador'),
    });
  }

  // ── Period Management ─────────────────────────────────────────────────────

  /** End the current period — the backend handles activating the next. */
  endCurrentPeriod(): void {
    const period = this.currentPeriod();
    if (!period) return;

    // The score update endpoint auto-finishes periods when rules are met.
    // For non-set sports, we just reload to get the latest state.
    this.loadMatch(this.matchId);
  }

  // ── Timer Events ──────────────────────────────────────────────────────────

  /** Record timer pause event for timeline. */
  recordTimerPause(elapsed: number): void {
    const period = this.currentPeriod();
    if (!period) return;

    this.api.post(`/matches/${this.matchId}/events`, {
      eventType: 'timeout',
      periodNumber: period.periodNumber,
      matchMinute: Math.floor(elapsed / 60),
      payload: { elapsedSeconds: elapsed },
    }).subscribe();
  }

  /** Called when countdown timer reaches zero. */
  onTimerExpired(): void {
    // Could auto-end period in the future
  }
}
