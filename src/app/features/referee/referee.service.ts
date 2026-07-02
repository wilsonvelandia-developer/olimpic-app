import { inject, Injectable, signal, computed } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import type { MatchDetail, MatchPeriod, Match } from '../../core/models/match.model';
import type { MatchEventItem } from './match-events-log/match-events-log';
import type { PlayerOption } from './scorer-select/scorer-select';
import type { SanctionType } from './sanction-dialog/sanction-dialog';
import type { MatchSetupResult } from './match-setup/match-setup';

type MatchStatus = 'scheduled' | 'in_progress' | 'finished';

interface PlayerInfo {
  id: string;
  name: string;
  jerseyNumber: number;
  position?: string;
  isStarter?: boolean;
}

/**
 * Manages the local state of a match being controlled by the referee.
 * Coordinates API calls and provides reactive signals for the UI.
 * Scoped per-component (provided in RefereePanel).
 */
@Injectable()
export class RefereeService {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  // ── State ─────────────────────────────────────────────────────────────────
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  private readonly _match = signal<Match | null>(null);
  private readonly _periods = signal<MatchPeriod[]>([]);
  readonly events = signal<MatchEventItem[]>([]);

  /** Players loaded from teams API. */
  readonly homePlayers = signal<PlayerOption[]>([]);
  readonly awayPlayers = signal<PlayerOption[]>([]);

  /** Players currently on court (starters minus subbed out + subbed in). */
  private readonly _homeOnCourt = signal<PlayerOption[]>([]);
  private readonly _awayOnCourt = signal<PlayerOption[]>([]);
  private readonly _homeOnBench = signal<PlayerOption[]>([]);
  private readonly _awayOnBench = signal<PlayerOption[]>([]);

  /** Sanction types for the tournament. */
  readonly sanctionTypes = signal<SanctionType[]>([]);

  /** Sport info. */
  readonly sportSlug = signal<string>('football');
  readonly playersPerTeam = signal<number>(11);
  readonly minPlayersPerTeam = signal<number | null>(null);

  /** Substitution tracking. */
  private readonly _homeSubsUsed = signal<number>(0);
  private readonly _awaySubsUsed = signal<number>(0);
  readonly subsMax = signal<number | null>(null);

  // ── Computed ──────────────────────────────────────────────────────────────
  readonly matchStatus = computed<MatchStatus>(() => this._match()?.status ?? 'scheduled');
  readonly homeTeamName = computed(() => this._match()?.homeTeamName ?? 'Local');
  readonly awayTeamName = computed(() => this._match()?.awayTeamName ?? 'Visitante');
  readonly homeTeamId = computed(() => this._match()?.homeTeamId ?? '');
  readonly awayTeamId = computed(() => this._match()?.awayTeamId ?? '');

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
    return this.hasSets() ? `SET ${period.periodNumber}` : `P${period.periodNumber}`;
  });

  readonly currentPeriodHomeScore = computed(() => this.currentPeriod()?.homeScore ?? 0);
  readonly currentPeriodAwayScore = computed(() => this.currentPeriod()?.awayScore ?? 0);

  readonly homeSetsWon = computed(() =>
    this._periods().filter((p) => p.status === 'finished' && p.homeScore > p.awayScore).length,
  );

  readonly awaySetsWon = computed(() =>
    this._periods().filter((p) => p.status === 'finished' && p.awayScore > p.homeScore).length,
  );

  private matchId = '';

  // ── Public getters for dialogs ────────────────────────────────────────────

  getPlayersOnCourt(side: 'home' | 'away'): PlayerOption[] {
    return side === 'home' ? this._homeOnCourt() : this._awayOnCourt();
  }

  getPlayersOnBench(side: 'home' | 'away'): PlayerOption[] {
    return side === 'home' ? this._homeOnBench() : this._awayOnBench();
  }

  getSubsUsed(side: 'home' | 'away'): number {
    return side === 'home' ? this._homeSubsUsed() : this._awaySubsUsed();
  }

  // ── Load Match ────────────────────────────────────────────────────────────

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
          this.loadPlayers();
          this.loadSubstitutionCount();
          this.loadSportRules();
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

  private loadEvents(): void {
    this.api.get<MatchEventItem[]>(`/matches/${this.matchId}/events`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.events.set(res.data);
        }
      },
    });
  }

  /** Load sport rules for this match to get playersPerTeam, sportSlug, etc. */
  private loadSportRules(): void {
    this.api.get<{
      sportSlug: string;
      playersPerTeam: number;
      minPlayersPerTeam: number | null;
      hasSets: boolean;
      hasRotation: boolean;
      maxSubstitutions: number | null;
    }>(`/matches/${this.matchId}/sport-rules`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.sportSlug.set(res.data.sportSlug);
          this.playersPerTeam.set(res.data.playersPerTeam);
          this.minPlayersPerTeam.set(res.data.minPlayersPerTeam);
          if (res.data.maxSubstitutions !== null) {
            this.subsMax.set(res.data.maxSubstitutions);
          }
        }
      },
    });
  }

  private loadPlayers(): void {
    const match = this._match();
    if (!match) return;

    // Load home team players
    this.api.get<PlayerInfo[]>(`/teams/${match.homeTeamId}/players`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const players = res.data.map((p) => ({
            id: p.id,
            name: p.name,
            jerseyNumber: p.jerseyNumber,
            position: p.position,
          }));
          this.homePlayers.set(players);
          // Initially all players are "on court" (until lineup is loaded)
          this._homeOnCourt.set(players);
          this._homeOnBench.set([]);
        }
      },
    });

    // Load away team players
    this.api.get<PlayerInfo[]>(`/teams/${match.awayTeamId}/players`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const players = res.data.map((p) => ({
            id: p.id,
            name: p.name,
            jerseyNumber: p.jerseyNumber,
            position: p.position,
          }));
          this.awayPlayers.set(players);
          this._awayOnCourt.set(players);
          this._awayOnBench.set([]);
        }
      },
    });
  }

  private loadSubstitutionCount(): void {
    this.api.get<unknown[]>(`/matches/${this.matchId}/substitutions`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const subs = res.data as Array<{ teamId: string }>;
          const match = this._match();
          if (match) {
            this._homeSubsUsed.set(subs.filter((s) => s.teamId === match.homeTeamId).length);
            this._awaySubsUsed.set(subs.filter((s) => s.teamId === match.awayTeamId).length);
          }
        }
      },
    });
  }

  // ── Match Lifecycle ───────────────────────────────────────────────────────

  startMatch(): void {
    this.api.put<MatchDetail>(`/matches/${this.matchId}/start`, {}).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this._match.set(res.data.match);
          this._periods.set(res.data.periods);
          this.toast.success('Partido iniciado');
        }
      },
      error: () => { this.error.set('Error al iniciar el partido'); this.toast.error('Error al iniciar el partido'); },
    });
  }

  finishMatch(): void {
    this.api.put<MatchDetail>(`/matches/${this.matchId}/finish`, {}).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this._match.set(res.data.match);
          this._periods.set(res.data.periods);
          this.toast.success('Partido finalizado');
        }
      },
      error: () => { this.error.set('Error al finalizar el partido'); this.toast.error('Error al finalizar el partido'); },
    });
  }

  // ── Scoring ───────────────────────────────────────────────────────────────

  addPoint(side: 'home' | 'away'): void {
    const period = this.currentPeriod();
    if (!period) return;

    const homeScore = side === 'home' ? period.homeScore + 1 : period.homeScore;
    const awayScore = side === 'away' ? period.awayScore + 1 : period.awayScore;
    this.updateScore(period.periodNumber, homeScore, awayScore);
  }

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

  // ── Register Scorer ───────────────────────────────────────────────────────

  registerScorer(dto: {
    teamId: string;
    playerId: string;
    periodNumber: number;
    matchMinute: number | null;
    points: number;
  }): void {
    this.api.post(`/matches/${this.matchId}/scorers`, dto).subscribe({
      next: () => this.loadEvents(),
    });
  }

  // ── Register Substitution ─────────────────────────────────────────────────

  registerSubstitution(dto: {
    teamId: string;
    periodNumber: number;
    playerOutId: string;
    playerInId: string;
    minute: number | null;
  }): void {
    this.api.post(`/matches/${this.matchId}/substitutions`, dto).subscribe({
      next: () => {
        this.loadEvents();
        this.loadSubstitutionCount();
        this.swapPlayer(dto.teamId, dto.playerOutId, dto.playerInId);
        this.toast.success('Cambio registrado');
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Error al registrar sustitución';
        this.error.set(msg);
        this.toast.error(msg);
      },
    });
  }

  private swapPlayer(teamId: string, playerOutId: string, playerInId: string): void {
    const match = this._match();
    if (!match) return;

    const isHome = teamId === match.homeTeamId;
    const onCourt = isHome ? [...this._homeOnCourt()] : [...this._awayOnCourt()];
    const onBench = isHome ? [...this._homeOnBench()] : [...this._awayOnBench()];

    const outIdx = onCourt.findIndex((p) => p.id === playerOutId);
    const inIdx = onBench.findIndex((p) => p.id === playerInId);

    if (outIdx >= 0 && inIdx >= 0) {
      const outPlayer = onCourt[outIdx];
      const inPlayer = onBench[inIdx];
      onCourt[outIdx] = inPlayer;
      onBench[inIdx] = outPlayer;
    }

    if (isHome) {
      this._homeOnCourt.set(onCourt);
      this._homeOnBench.set(onBench);
    } else {
      this._awayOnCourt.set(onCourt);
      this._awayOnBench.set(onBench);
    }
  }

  // ── Register Sanction ─────────────────────────────────────────────────────

  registerSanction(dto: {
    sanctionTypeId: string;
    teamId: string;
    playerId: string | null;
    periodNumber: number;
    minute: number | null;
  }): void {
    this.api.post(`/matches/${this.matchId}/sanctions`, dto).subscribe({
      next: () => { this.loadEvents(); this.toast.warning('Sanción registrada'); },
      error: () => { this.error.set('Error al registrar sanción'); this.toast.error('Error al registrar sanción'); },
    });
  }

  // ── Match Setup ───────────────────────────────────────────────────────────

  saveMatchSetup(result: MatchSetupResult): void {
    // Save coin toss / field sides
    this.api.put(`/matches/${this.matchId}/setup`, {
      coinTossWinnerTeamId: result.coinTossWinnerTeamId,
      fieldSideHome: result.fieldSideHome,
      fieldSideAway: result.fieldSideAway,
      firstServeTeamId: result.firstServeTeamId,
    }).subscribe();

    // Save home lineup
    const match = this._match();
    if (match && result.homeLineup.length > 0) {
      this.api.post(`/matches/${this.matchId}/match-lineups`, {
        teamId: match.homeTeamId,
        periodNumber: 1,
        players: result.homeLineup,
      }).subscribe();
    }

    // Save away lineup
    if (match && result.awayLineup.length > 0) {
      this.api.post(`/matches/${this.matchId}/match-lineups`, {
        teamId: match.awayTeamId,
        periodNumber: 1,
        players: result.awayLineup,
      }).subscribe();
    }
  }

  // ── Period Management ─────────────────────────────────────────────────────

  endCurrentPeriod(): void {
    this.loadMatch(this.matchId);
  }

  // ── Undo Last Action ──────────────────────────────────────────────────────

  /** Undo the last scorer registered (remove last match_scorers entry). */
  undoLastScorer(): void {
    this.api.delete(`/matches/${this.matchId}/scorers/last`).subscribe({
      next: () => { this.loadEvents(); this.toast.info('Último anotador revertido'); },
      error: () => this.toast.error('No se pudo revertir'),
    });
  }

  /** Undo the last event (generic). Reloads match data. */
  undoLastEvent(): void {
    this.api.delete(`/matches/${this.matchId}/events/last`).subscribe({
      next: () => { this.loadMatch(this.matchId); this.toast.info('Última acción revertida'); },
      error: () => this.toast.error('No se pudo revertir'),
    });
  }

  // ── Timer Events ──────────────────────────────────────────────────────────

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

  onTimerExpired(): void {
    // Could auto-end period
  }
}
