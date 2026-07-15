import { inject, Injectable, signal, computed } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
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

  /** Public read-only access to periods (for match summary). */
  readonly periods = this._periods.asReadonly();

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
  private tournamentId: string = '';

  /** Sport info. */
  readonly sportSlug = signal<string>('football');
  readonly playersPerTeam = signal<number>(11);
  readonly minPlayersPerTeam = signal<number | null>(null);
  readonly pointsPerSet = signal<number>(25);
  readonly winMargin = signal<number>(2);
  readonly setsToWin = signal<number>(3);

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

  /** Team colors from DB — with conflict resolution. */
  readonly homeColor = computed(() => {
    const m = this._match() as Record<string, unknown> | null;
    return (m?.['homeColorPrimary'] as string) || '#1e40af';
  });
  readonly awayColor = computed(() => {
    const m = this._match() as Record<string, unknown> | null;
    const homeC = (m?.['homeColorPrimary'] as string) || '#1e40af';
    const awayC = (m?.['awayColorPrimary'] as string) || '#dc2626';
    // If colors are the same, use a contrasting fallback for away
    if (awayC.toLowerCase() === homeC.toLowerCase()) return '#f59e0b';
    return awayC;
  });

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
          this.loadSanctionTypes();
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
      pointsPerSet: number | null;
      winMargin: number;
      setsToWin: number | null;
    }>(`/matches/${this.matchId}/sport-rules`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.sportSlug.set(res.data.sportSlug);
          this.playersPerTeam.set(res.data.playersPerTeam);
          this.minPlayersPerTeam.set(res.data.minPlayersPerTeam);
          if (res.data.maxSubstitutions !== null) {
            this.subsMax.set(res.data.maxSubstitutions);
          }
          if (res.data.pointsPerSet) this.pointsPerSet.set(res.data.pointsPerSet);
          if (res.data.winMargin) this.winMargin.set(res.data.winMargin);
          if (res.data.setsToWin) this.setsToWin.set(res.data.setsToWin);
        }
      },
    });
  }

  /** Load sanction types configured for the tournament that owns this match. */
  private loadSanctionTypes(): void {
    this.api.get<SanctionType[]>(`/matches/${this.matchId}/sanctions/types`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.sanctionTypes.set(res.data);
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
          // Split: first N players on court (starters), rest on bench
          const courtSize = this.playersPerTeam() || 6;
          this._homeOnCourt.set(players.slice(0, courtSize));
          this._homeOnBench.set(players.slice(courtSize));
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
          const courtSize = this.playersPerTeam() || 6;
          this._awayOnCourt.set(players.slice(0, courtSize));
          this._awayOnBench.set(players.slice(courtSize));
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
      error: () => { this.toast.error('Error al iniciar el partido'); },
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
      error: () => { this.toast.error('Error al finalizar el partido'); },
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
      error: () => this.toast.error('Error al actualizar marcador'),
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
    // Enrich with player names for event log
    const match = this._match();
    const allPlayers = match?.homeTeamId === dto.teamId
      ? this.homePlayers()
      : this.awayPlayers();
    const playerOut = allPlayers.find((p) => p.id === dto.playerOutId);
    const playerIn = allPlayers.find((p) => p.id === dto.playerInId);

    this.api.post(`/matches/${this.matchId}/substitutions`, dto).subscribe({
      next: () => {
        this.loadSubstitutionCount();
        this.swapPlayer(dto.teamId, dto.playerOutId, dto.playerInId);
        this.toast.success('Cambio registrado');

        // Record an enriched event for the timeline, then reload events
        this.api.post(`/matches/${this.matchId}/events`, {
          eventType: 'substitution',
          teamId: dto.teamId,
          periodNumber: dto.periodNumber,
          matchMinute: dto.minute,
          payload: {
            playerOutId: dto.playerOutId,
            playerInId: dto.playerInId,
            playerOutName: playerOut?.name ?? '',
            playerInName: playerIn?.name ?? '',
            playerOutJersey: playerOut?.jerseyNumber ?? null,
            playerInJersey: playerIn?.jerseyNumber ?? null,
          },
        }).subscribe({
          next: () => this.loadEvents(),
          error: () => this.loadEvents(), // load events even if event creation fails
        });
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Error al registrar sustitución';
        // Only show toast — do NOT set this.error (which hides the whole match view)
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
      error: () => { this.toast.error('Error al registrar sanción'); },
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

  /**
   * Registers a generic event in the match timeline.
   * Used for score, sanction, substitution events with enriched data.
   */
  registerEvent(dto: {
    eventType: string;
    teamId?: string | null;
    playerId?: string | null;
    periodNumber: number;
    matchMinute: number | null;
    payload: Record<string, unknown>;
  }): void {
    this.api.post(`/matches/${this.matchId}/events`, dto).subscribe({
      next: () => this.loadEvents(),
    });
  }

  onTimerExpired(): void {
    // Could auto-end period
  }

  // ── Setup & Lineup loading (for rotation initialization) ──────────────────

  /** Loads the saved match setup (coin toss, field sides, first serve). */
  getMatchSetup(): import('rxjs').Observable<{ firstServeTeamId: string | null; fieldSideHome: string | null; fieldSideAway: string | null } | null> {
    return this.api.get<{ firstServeTeamId: string | null; fieldSideHome: string | null; fieldSideAway: string | null }>(`/matches/${this.matchId}/setup`).pipe(
      map((res) => res.success ? res.data : null),
      catchError(() => of(null)),
    );
  }

  /** Loads saved lineups for both teams. */
  getMatchLineups(): import('rxjs').Observable<{ home: Array<{ playerId: string; isStarter: boolean; isCaptain: boolean; isLibero: boolean; volleyballZone: number | null }>; away: Array<{ playerId: string; isStarter: boolean; isCaptain: boolean; isLibero: boolean; volleyballZone: number | null }> } | null> {
    const homeId = this._match()?.homeTeamId;
    const awayId = this._match()?.awayTeamId;
    if (!homeId || !awayId) return of(null);

    return forkJoin({
      home: this.api.get<Array<{ playerId: string; isStarter: boolean; isCaptain: boolean; isLibero: boolean; volleyballZone: number | null }>>(`/matches/${this.matchId}/match-lineups/${homeId}`).pipe(
        map((r) => r.data ?? []),
        catchError(() => of([])),
      ),
      away: this.api.get<Array<{ playerId: string; isStarter: boolean; isCaptain: boolean; isLibero: boolean; volleyballZone: number | null }>>(`/matches/${this.matchId}/match-lineups/${awayId}`).pipe(
        map((r) => r.data ?? []),
        catchError(() => of([])),
      ),
    });
  }
}
