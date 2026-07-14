import {
  Component, ChangeDetectionStrategy, input, inject,
  signal, computed, OnInit, OnDestroy, viewChild, effect,
} from '@angular/core';
import { Router } from '@angular/router';
import { Timer, TimerMode } from '../timer/timer';
import { MatchEventsLog } from '../match-events-log/match-events-log';
import { ScorerSelect, type ScorerSelection, type PlayerOption } from '../scorer-select/scorer-select';
import { SubstitutionDialog, type SubstitutionSelection } from '../substitution-dialog/substitution-dialog';
import { SanctionDialog, type SanctionSelection, type SanctionType } from '../sanction-dialog/sanction-dialog';
import { MatchSetup, type MatchSetupResult, type TeamPlayers } from '../match-setup/match-setup';
import { RefereeService } from '../referee.service';
import { RefereeSocketService } from '../referee-socket.service';
import { VolleyballCourt, type CourtPlayer, type CourtState } from '../volleyball-court/volleyball-court';
import { RotationService } from '../volleyball-court/rotation.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

/**
 * Referee Panel — full-screen match control interface.
 * Optimized for tablet/mobile in landscape orientation.
 * Integrates: scoreboard, timer, scorer-select, substitution, sanction, match-setup, events log.
 * Emits all events via WebSocket for real-time broadcast to spectators.
 */
@Component({
  selector: 'app-referee-panel',
  imports: [
    Timer, MatchEventsLog, LoadingSpinner,
    ScorerSelect, SubstitutionDialog, SanctionDialog, MatchSetup,
    VolleyballCourt,
  ],
  templateUrl: './referee-panel.html',
  styleUrl: './referee-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RefereeService, RotationService],
})
export class RefereePanel implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly socket = inject(RefereeSocketService);
  readonly ref = inject(RefereeService);
  readonly rotation = inject(RotationService);

  /** Match ID from route parameter. */
  readonly id = input.required<string>();

  readonly timerComponent = viewChild<Timer>('timerRef');

  // ── Timer state ───────────────────────────────────────────────────────────
  readonly timerMode = signal<TimerMode>('progressive');
  readonly countdownTarget = signal<number>(0);

  // ── Dialog visibility ─────────────────────────────────────────────────────
  readonly showEventsLog = signal<boolean>(false);
  readonly showScorerSelect = signal<boolean>(false);
  readonly showSubstitution = signal<boolean>(false);
  readonly showSanction = signal<boolean>(false);
  readonly showSetup = signal<boolean>(false);

  /** WebSocket connection status. */
  readonly wsConnected = this.socket.isConnected;
  readonly wsError = this.socket.connectionError;

  /** Which team is scoring (used by scorer-select dialog). */
  readonly scoringTeamSide = signal<'home' | 'away'>('home');

  /** Which team is substituting/receiving sanction. */
  readonly activeTeamSide = signal<'home' | 'away'>('home');

  // ── Computed for dialogs ──────────────────────────────────────────────────
  readonly scoringTeamName = computed(() =>
    this.scoringTeamSide() === 'home' ? this.ref.homeTeamName() : this.ref.awayTeamName(),
  );

  readonly scoringTeamId = computed(() =>
    this.scoringTeamSide() === 'home' ? this.ref.homeTeamId() : this.ref.awayTeamId(),
  );

  readonly activeTeamName = computed(() =>
    this.activeTeamSide() === 'home' ? this.ref.homeTeamName() : this.ref.awayTeamName(),
  );

  readonly activeTeamId = computed(() =>
    this.activeTeamSide() === 'home' ? this.ref.homeTeamId() : this.ref.awayTeamId(),
  );

  readonly currentMinute = computed(() => {
    const timer = this.timerComponent();
    if (!timer) return null;
    return timer.elapsed();
  });

  // ── Match setup data ──────────────────────────────────────────────────────
  readonly homeTeamPlayers = computed<TeamPlayers>(() => ({
    teamId: this.ref.homeTeamId(),
    teamName: this.ref.homeTeamName(),
    players: this.ref.homePlayers(),
  }));

  readonly awayTeamPlayers = computed<TeamPlayers>(() => ({
    teamId: this.ref.awayTeamId(),
    teamName: this.ref.awayTeamName(),
    players: this.ref.awayPlayers(),
  }));

  /** Volleyball court state — computed from rotation service. */
  readonly courtState = computed<CourtState>(() => {
    const sideA = this.rotation.sideATeam();
    // Side A = bottom of court (away half in component)
    // Side B = top of court (home half in component)
    const homeOnA = sideA === 'home';
    return {
      // Top of court (home half) = Side B team
      homePlayers: homeOnA ? this.rotation.awayPositions() : this.rotation.homePositions(),
      // Bottom of court (away half) = Side A team
      awayPlayers: homeOnA ? this.rotation.homePositions() : this.rotation.awayPositions(),
      homeColor: homeOnA ? this.ref.awayColor() : this.ref.homeColor(),
      awayColor: homeOnA ? this.ref.homeColor() : this.ref.awayColor(),
      servingTeam: this.rotation.servingTeam(),
    };
  });

  /** Whether to show the volleyball court (only for volleyball matches). */
  readonly showCourt = computed(() =>
    this.ref.sportSlug() === 'volleyball' && this.ref.matchStatus() === 'in_progress',
  );

  /**
   * Side tracking — derived from rotation service's sideATeam.
   */
  readonly sideATeam = computed<'home' | 'away'>(() => this.rotation.sideATeam());
  readonly sideBTeam = computed<'home' | 'away'>(() => this.rotation.sideATeam() === 'home' ? 'away' : 'home');

  readonly sideAName = computed(() => this.sideATeam() === 'home' ? this.ref.homeTeamName() : this.ref.awayTeamName());
  readonly sideBName = computed(() => this.sideBTeam() === 'home' ? this.ref.homeTeamName() : this.ref.awayTeamName());

  readonly sideAScore = computed(() => this.sideATeam() === 'home' ? this.ref.currentPeriodHomeScore() : this.ref.currentPeriodAwayScore());
  readonly sideBScore = computed(() => this.sideBTeam() === 'home' ? this.ref.currentPeriodHomeScore() : this.ref.currentPeriodAwayScore());

  readonly sideASets = computed(() => this.sideATeam() === 'home' ? this.ref.homeSetsWon() : this.ref.awaySetsWon());
  readonly sideBSets = computed(() => this.sideBTeam() === 'home' ? this.ref.homeSetsWon() : this.ref.awaySetsWon());

  readonly sideAColor = computed(() => this.sideATeam() === 'home' ? this.ref.homeColor() : this.ref.awayColor());
  readonly sideBColor = computed(() => this.sideBTeam() === 'home' ? this.ref.homeColor() : this.ref.awayColor());

  /** Is side A currently serving? */
  readonly isServingSideA = computed(() => {
    const servingTeam = this.rotation.servingTeam();
    return servingTeam === this.sideATeam();
  });

  /** Does the decisive set need a new toss? */
  readonly showDecisiveToss = computed(() => this.rotation.needsDecisiveToss());

  /** Sport-specific ball icon. */
  readonly sportBallIcon = computed(() => {
    const slug = this.ref.sportSlug();
    switch (slug) {
      case 'volleyball': return '🏐';
      case 'football':   return '⚽';
      case 'basketball': return '🏀';
      case 'tennis':     return '🎾';
      default:           return '🏐';
    }
  });

  /** Array for @for loop to render set-won dots. */
  readonly sideASetsArray = computed(() => Array.from({ length: this.sideASets() }, (_, i) => i));
  readonly sideBSetsArray = computed(() => Array.from({ length: this.sideBSets() }, (_, i) => i));

  /** Timer sync interval for broadcasting to spectators. */
  private timerSyncInterval: ReturnType<typeof setInterval> | null = null;
  private rotationInitialized = false;

  constructor() {
    // Auto-initialize rotation when players are loaded and match is volleyball in_progress
    effect(() => {
      const status = this.ref.matchStatus();
      const sport = this.ref.sportSlug();
      const homePlayers = this.ref.homePlayers();
      const awayPlayers = this.ref.awayPlayers();

      if (sport === 'volleyball' && status === 'in_progress' && homePlayers.length > 0 && awayPlayers.length > 0 && !this.rotationInitialized) {
        this.rotationInitialized = true;

        // Try to restore from localStorage first (preserves state on page reload)
        const restored = this.rotation.restoreState(this.id());
        if (restored) {
          // State restored — no need to re-initialize from API
          return;
        }

        // No saved state — initialize from API data
        this.initializeRotationFromData(homePlayers, awayPlayers);
      }
    });
  }

  /**
   * Initializes rotation from loaded player data.
   * Tries to load the saved setup from the API for real positions/serve/side.
   * Falls back to default if setup isn't available.
   */
  private initializeRotationFromData(
    homePlayers: Array<{ id: string; jerseyNumber: number; name: string }>,
    awayPlayers: Array<{ id: string; jerseyNumber: number; name: string }>,
  ): void {
    // Set matchId for persistence
    this.rotation.restoreState(this.id()); // sets the matchId internally

    // Try to load match setup for serve/side info
    this.ref.getMatchSetup().subscribe({
      next: (setup) => {
        let firstServe: 'home' | 'away' = 'home';
        let sideA: 'home' | 'away' = 'home';

        if (setup) {
          // Determine serve from setup
          if (setup.firstServeTeamId === this.ref.awayTeamId()) firstServe = 'away';
          // Determine side from setup (fieldSideHome = 'A' means home is on side A)
          if (setup.fieldSideHome === 'B' || setup.fieldSideAway === 'A') sideA = 'away';
        }

        // Try to load lineups for real zone positions
        this.ref.getMatchLineups().subscribe({
          next: (lineups) => {
            let homeStarters: CourtPlayer[];
            let awayStarters: CourtPlayer[];

            if (lineups && lineups.home && lineups.home.length >= 6) {
              homeStarters = lineups.home.filter((p: { isStarter: boolean }) => p.isStarter).map((p: { playerId: string; volleyballZone: number | null; isCaptain: boolean; isLibero: boolean }) => {
                const player = homePlayers.find((pl) => pl.id === p.playerId);
                return {
                  playerId: p.playerId,
                  jerseyNumber: player?.jerseyNumber ?? 0,
                  name: player?.name ?? '',
                  position: p.volleyballZone ?? 1,
                  isCaptain: p.isCaptain,
                  isLibero: p.isLibero,
                };
              });
            } else {
              homeStarters = homePlayers.slice(0, 6).map((p, i) => ({
                playerId: p.id, jerseyNumber: p.jerseyNumber, name: p.name,
                position: i + 1, isCaptain: i === 0, isLibero: false,
              }));
            }

            if (lineups && lineups.away && lineups.away.length >= 6) {
              awayStarters = lineups.away.filter((p: { isStarter: boolean }) => p.isStarter).map((p: { playerId: string; volleyballZone: number | null; isCaptain: boolean; isLibero: boolean }) => {
                const player = awayPlayers.find((pl) => pl.id === p.playerId);
                return {
                  playerId: p.playerId,
                  jerseyNumber: player?.jerseyNumber ?? 0,
                  name: player?.name ?? '',
                  position: p.volleyballZone ?? 1,
                  isCaptain: p.isCaptain,
                  isLibero: p.isLibero,
                };
              });
            } else {
              awayStarters = awayPlayers.slice(0, 6).map((p, i) => ({
                playerId: p.id, jerseyNumber: p.jerseyNumber, name: p.name,
                position: i + 1, isCaptain: i === 0, isLibero: false,
              }));
            }

            this.rotation.initialize(homeStarters, awayStarters, firstServe, sideA);
          },
          error: () => {
            // Fallback: use sequential positions
            const homeStarters = homePlayers.slice(0, 6).map((p, i) => ({
              playerId: p.id, jerseyNumber: p.jerseyNumber, name: p.name,
              position: i + 1, isCaptain: i === 0, isLibero: false,
            }));
            const awayStarters = awayPlayers.slice(0, 6).map((p, i) => ({
              playerId: p.id, jerseyNumber: p.jerseyNumber, name: p.name,
              position: i + 1, isCaptain: i === 0, isLibero: false,
            }));
            this.rotation.initialize(homeStarters, awayStarters, firstServe, sideA);
          },
        });
      },
      error: () => {
        // Fallback: default initialization
        const homeStarters = homePlayers.slice(0, 6).map((p, i) => ({
          playerId: p.id, jerseyNumber: p.jerseyNumber, name: p.name,
          position: i + 1, isCaptain: i === 0, isLibero: false,
        }));
        const awayStarters = awayPlayers.slice(0, 6).map((p, i) => ({
          playerId: p.id, jerseyNumber: p.jerseyNumber, name: p.name,
          position: i + 1, isCaptain: i === 0, isLibero: false,
        }));
        this.rotation.initialize(homeStarters, awayStarters, 'home', 'home');
      },
    });
  }

  /** Bench players for the court component — follows side swap. */
  readonly homeBenchPlayers = computed<CourtPlayer[]>(() => {
    const all = this.ref.homePlayers();
    const onCourt = this.rotation.homePositions();
    const courtIds = new Set(onCourt.map((p) => p.playerId));
    return all.filter((p) => !courtIds.has(p.id)).map((p) => ({
      playerId: p.id, jerseyNumber: p.jerseyNumber, name: p.name, position: 0,
    }));
  });

  readonly awayBenchPlayers = computed<CourtPlayer[]>(() => {
    const all = this.ref.awayPlayers();
    const onCourt = this.rotation.awayPositions();
    const courtIds = new Set(onCourt.map((p) => p.playerId));
    return all.filter((p) => !courtIds.has(p.id)).map((p) => ({
      playerId: p.id, jerseyNumber: p.jerseyNumber, name: p.name, position: 0,
    }));
  });

  /** Side-aware bench: Side B = top of court (home half in component). */
  readonly sideBBenchPlayers = computed<CourtPlayer[]>(() => {
    const sideB = this.sideBTeam();
    return sideB === 'home' ? this.homeBenchPlayers() : this.awayBenchPlayers();
  });

  /** Side-aware bench: Side A = bottom of court (away half in component). */
  readonly sideABenchPlayers = computed<CourtPlayer[]>(() => {
    const sideA = this.sideATeam();
    return sideA === 'home' ? this.homeBenchPlayers() : this.awayBenchPlayers();
  });

  /**
   * For substitution dialog: players on court as PlayerOption[] derived from rotation.
   * For volleyball uses rotation; for other sports uses ref service.
   */
  readonly activePlayersOnCourt = computed<PlayerOption[]>(() => {
    if (this.ref.sportSlug() === 'volleyball') {
      const side = this.activeTeamSide();
      const onCourt = side === 'home' ? this.rotation.homePositions() : this.rotation.awayPositions();
      return onCourt.map((p) => ({ id: p.playerId, name: p.name, jerseyNumber: p.jerseyNumber }));
    }
    return this.ref.getPlayersOnCourt(this.activeTeamSide());
  });

  /**
   * For substitution dialog: players on bench as PlayerOption[] derived from rotation.
   */
  readonly activePlayersOnBench = computed<PlayerOption[]>(() => {
    if (this.ref.sportSlug() === 'volleyball') {
      const side = this.activeTeamSide();
      const allPlayers = side === 'home' ? this.ref.homePlayers() : this.ref.awayPlayers();
      const onCourt = side === 'home' ? this.rotation.homePositions() : this.rotation.awayPositions();
      const courtIds = new Set(onCourt.map((p) => p.playerId));
      return allPlayers.filter((p) => !courtIds.has(p.id));
    }
    return this.ref.getPlayersOnBench(this.activeTeamSide());
  });

  /**
   * For scorer-select dialog: players of the scoring team on court.
   */
  readonly scoringPlayersOnCourt = computed<PlayerOption[]>(() => {
    if (this.ref.sportSlug() === 'volleyball') {
      const side = this.scoringTeamSide();
      const onCourt = side === 'home' ? this.rotation.homePositions() : this.rotation.awayPositions();
      return onCourt.map((p) => ({ id: p.playerId, name: p.name, jerseyNumber: p.jerseyNumber }));
    }
    return this.ref.getPlayersOnCourt(this.scoringTeamSide());
  });

  ngOnInit(): void {
    this.ref.loadMatch(this.id());
    // WebSocket is optional — don't block the panel if it fails
    this.connectWebSocket();
  }

  ngOnDestroy(): void {
    this.socket.leaveAsReferee(this.id());
    this.socket.disconnect();
    if (this.timerSyncInterval) clearInterval(this.timerSyncInterval);
  }

  /**
   * Connect WebSocket and join match room as referee.
   * This is non-blocking — if WebSocket fails, the panel still works via REST.
   */
  private connectWebSocket(): void {
    this.socket.connect();

    // Listen for successful connection to join the room
    const unsubConnect = this.socket.on('__internal_connected', () => {});

    // Poll for connection (retry up to 5 seconds)
    let attempts = 0;
    const joinInterval = setInterval(async () => {
      attempts++;
      if (this.socket.isConnected()) {
        clearInterval(joinInterval);
        const res = await this.socket.joinAsReferee(this.id());
        if (!res.success) {
          // Not critical — just means real-time broadcast won't work
          console.warn('WebSocket referee join failed:', res.message);
        }
        // Start timer sync broadcast every 5 seconds
        this.timerSyncInterval = setInterval(() => {
          const timer = this.timerComponent();
          if (timer && timer.isRunning() && this.socket.isConnected()) {
            this.socket.emitTimerSync({
              matchId: this.id(),
              elapsed: timer.elapsed(),
              running: true,
            });
          }
        }, 5000);
      } else if (attempts >= 10) {
        // Give up after 5 seconds — panel works without WebSocket
        clearInterval(joinInterval);
        console.warn('WebSocket connection not available — panel running in REST-only mode');
      }
    }, 500);
  }

  // ── Score Actions (now opens scorer-select dialog) ────────────────────────

  onHomeScoreUp(): void {
    this.scoringTeamSide.set('home');
    this.ref.addPoint('home');
    if (this.ref.sportSlug() === 'volleyball') {
      this.rotation.onPointScored('home');
      this.checkAutoSetEnd();
    }
    this.showScorerSelect.set(true);
    this.timerComponent()?.autoPause();
  }

  onHomeScoreDown(): void {
    this.ref.removePoint('home');
    if (this.ref.sportSlug() === 'volleyball') {
      this.rotation.undoLastPoint('home');
    }
  }

  onAwayScoreUp(): void {
    this.scoringTeamSide.set('away');
    this.ref.addPoint('away');
    if (this.ref.sportSlug() === 'volleyball') {
      this.rotation.onPointScored('away');
      this.checkAutoSetEnd();
    }
    this.showScorerSelect.set(true);
    this.timerComponent()?.autoPause();
  }

  onAwayScoreDown(): void {
    this.ref.removePoint('away');
    if (this.ref.sportSlug() === 'volleyball') {
      this.rotation.undoLastPoint('away');
    }
  }

  // ── Side-aware score wrappers ─────────────────────────────────────────────

  onSideAScoreUp(): void {
    const team = this.sideATeam();
    team === 'home' ? this.onHomeScoreUp() : this.onAwayScoreUp();
  }

  onSideAScoreDown(): void {
    const team = this.sideATeam();
    team === 'home' ? this.onHomeScoreDown() : this.onAwayScoreDown();
  }

  onSideBScoreUp(): void {
    const team = this.sideBTeam();
    team === 'home' ? this.onHomeScoreUp() : this.onAwayScoreUp();
  }

  onSideBScoreDown(): void {
    const team = this.sideBTeam();
    team === 'home' ? this.onHomeScoreDown() : this.onAwayScoreDown();
  }

  // ── Manual rotation (corrections) ────────────────────────────────────────

  onManualRotate(team: 'home' | 'away', direction: 'forward' | 'backward'): void {
    if (direction === 'forward') {
      this.rotation.manualRotateForward(team);
    } else {
      this.rotation.manualRotateBackward(team);
    }
  }

  // ── Undo last action ──────────────────────────────────────────────────────

  onUndoLast(): void {
    this.ref.undoLastEvent();
  }

  // ── Official Timeout ──────────────────────────────────────────────────────

  onTimeout(): void {
    this.timerComponent()?.pause();
    this.ref.recordTimerPause(this.timerComponent()?.elapsed() ?? 0);
  }

  /**
   * Checks if the current set is won (a team reached pointsPerSet with winMargin).
   * If so, automatically ends the set and triggers side/serve swap.
   */
  private checkAutoSetEnd(): void {
    // Small delay to let the score update propagate
    setTimeout(() => {
      const homeScore = this.ref.currentPeriodHomeScore();
      const awayScore = this.ref.currentPeriodAwayScore();
      const target = this.ref.pointsPerSet();
      const margin = this.ref.winMargin();
      const max = Math.max(homeScore, awayScore);
      const min = Math.min(homeScore, awayScore);

      // Set is won when one team reaches target AND has required margin
      if (max >= target && (max - min) >= margin) {
        this.onEndPeriod();
      }
    }, 500);
  }

  // ── Scorer Select Dialog ──────────────────────────────────────────────────

  onScorerSelected(selection: ScorerSelection): void {
    const period = this.ref.currentPeriod();
    if (!period) return;

    const teamId = this.scoringTeamId();
    const dto = {
      teamId,
      playerId: selection.playerId,
      periodNumber: period.periodNumber,
      matchMinute: this.currentMinute(),
      points: 1,
    };

    this.ref.registerScorer(dto);

    // Also register a score event for the timeline with enriched info
    this.ref.registerEvent({
      eventType: 'score',
      teamId,
      playerId: selection.playerId,
      periodNumber: period.periodNumber,
      matchMinute: this.currentMinute(),
      payload: { points: 1, playerName: selection.playerName, jerseyNumber: selection.jerseyNumber },
    });

    // Emit via WebSocket for real-time broadcast
    this.socket.emitScore({
      matchId: this.id(),
      periodNumber: period.periodNumber,
      homeScore: this.ref.currentPeriodHomeScore(),
      awayScore: this.ref.currentPeriodAwayScore(),
      scorerPlayerId: selection.playerId,
      scorerTeamId: this.scoringTeamId(),
      points: 1,
      matchMinute: this.currentMinute() ?? undefined,
    });

    this.showScorerSelect.set(false);
    this.timerComponent()?.start();
  }

  onScorerSkipped(): void {
    // Still emit score update even without scorer
    const period = this.ref.currentPeriod();
    if (period) {
      this.socket.emitScore({
        matchId: this.id(),
        periodNumber: period.periodNumber,
        homeScore: this.ref.currentPeriodHomeScore(),
        awayScore: this.ref.currentPeriodAwayScore(),
      });
    }
    this.showScorerSelect.set(false);
    this.timerComponent()?.start();
  }

  // ── Substitution Dialog ───────────────────────────────────────────────────

  openSubstitution(side: 'home' | 'away'): void {
    this.activeTeamSide.set(side);
    this.showSubstitution.set(true);
    this.timerComponent()?.autoPause();
  }

  onSubstitutionConfirmed(selection: SubstitutionSelection): void {
    const period = this.ref.currentPeriod();
    if (!period) return;

    const minute = this.currentMinute();
    const side = this.activeTeamSide();

    // Apply substitution to the rotation service (visual update)
    if (this.ref.sportSlug() === 'volleyball') {
      const allPlayers = side === 'home' ? this.ref.homePlayers() : this.ref.awayPlayers();
      const inPlayer = allPlayers.find((p) => p.id === selection.playerInId);
      if (inPlayer) {
        this.rotation.substitute(side, selection.playerOutId, {
          playerId: inPlayer.id,
          jerseyNumber: inPlayer.jerseyNumber,
          name: inPlayer.name,
          position: 0, // will be replaced by the outgoing player's zone
        });
      }
    }

    this.ref.registerSubstitution({
      teamId: selection.teamId,
      periodNumber: period.periodNumber,
      playerOutId: selection.playerOutId,
      playerInId: selection.playerInId,
      minute,
    });

    // Emit via WebSocket
    this.socket.emitSubstitution({
      matchId: this.id(),
      teamId: selection.teamId,
      periodNumber: period.periodNumber,
      playerOutId: selection.playerOutId,
      playerInId: selection.playerInId,
      minute,
    });

    this.showSubstitution.set(false);
    this.timerComponent()?.start();
  }

  onSubstitutionClosed(): void {
    this.showSubstitution.set(false);
    this.timerComponent()?.start();
  }

  // ── Sanction Dialog ───────────────────────────────────────────────────────

  openSanction(side: 'home' | 'away'): void {
    this.activeTeamSide.set(side);
    this.showSanction.set(true);
    this.timerComponent()?.autoPause();
  }

  onSanctionConfirmed(selection: SanctionSelection): void {
    const period = this.ref.currentPeriod();
    if (!period) return;

    const minute = this.currentMinute();

    this.ref.registerSanction({
      sanctionTypeId: selection.sanctionTypeId,
      teamId: selection.teamId,
      playerId: selection.playerId,
      periodNumber: period.periodNumber,
      minute,
    });

    // Register sanction event in the timeline
    this.ref.registerEvent({
      eventType: 'sanction',
      teamId: selection.teamId,
      playerId: selection.playerId,
      periodNumber: period.periodNumber,
      matchMinute: minute,
      payload: {
        sanctionTypeId: selection.sanctionTypeId,
        sanctionName: selection.sanctionName ?? '',
        playerName: selection.playerName ?? '',
      },
    });

    // Emit via WebSocket
    this.socket.emitSanction({
      matchId: this.id(),
      sanctionTypeId: selection.sanctionTypeId,
      teamId: selection.teamId,
      playerId: selection.playerId,
      periodNumber: period.periodNumber,
      minute,
    });

    this.showSanction.set(false);
    this.timerComponent()?.start();
  }

  onSanctionClosed(): void {
    this.showSanction.set(false);
    this.timerComponent()?.start();
  }

  // ── Match Setup ───────────────────────────────────────────────────────────

  openSetup(): void {
    this.showSetup.set(true);
  }

  onSetupCompleted(result: MatchSetupResult): void {
    this.ref.saveMatchSetup(result);
    this.showSetup.set(false);

    // Initialize volleyball rotation from setup lineup
    if (this.ref.sportSlug() === 'volleyball') {
      const homeStarters = result.homeLineup.filter((p) => p.isStarter && p.volleyballZone);
      const awayStarters = result.awayLineup.filter((p) => p.isStarter && p.volleyballZone);

      const homePlayers = this.ref.homePlayers();
      const awayPlayers = this.ref.awayPlayers();

      const mapToCourtPlayers = (
        lineup: typeof homeStarters,
        allPlayers: Array<{ id: string; name: string; jerseyNumber: number }>,
      ): CourtPlayer[] =>
        lineup.map((p) => {
          const player = allPlayers.find((pl) => pl.id === p.playerId);
          return {
            playerId: p.playerId,
            jerseyNumber: player?.jerseyNumber ?? 0,
            name: player?.name ?? '',
            position: p.volleyballZone!,
            isCaptain: p.isCaptain,
            isLibero: p.isLibero,
          };
        });

      if (homeStarters.length >= 6 && awayStarters.length >= 6) {
        const firstServe: 'home' | 'away' = result.firstServeTeamId === this.ref.homeTeamId() ? 'home' : 'away';
        const sideA: 'home' | 'away' = (result.fieldSideHome === 'A' || result.fieldSideAway === 'B') ? 'home' : 'away';
        this.rotation.initialize(
          mapToCourtPlayers(homeStarters, homePlayers),
          mapToCourtPlayers(awayStarters, awayPlayers),
          firstServe,
          sideA,
        );
      }
    }

    // Auto-start the match after setup is confirmed
    this.ref.startMatch();
  }

  onSetupClosed(): void {
    this.showSetup.set(false);
  }

  // ── Match Lifecycle ───────────────────────────────────────────────────────

  onStartMatch(): void {
    this.ref.startMatch();
  }

  onEndPeriod(): void {
    this.timerComponent()?.pause();

    if (this.ref.sportSlug() === 'volleyball') {
      // Pass current sets won for decisive set detection
      const homeSets = this.ref.homeSetsWon();
      const awaySets = this.ref.awaySetsWon();
      this.rotation.onSetEnd(homeSets, awaySets);
    }

    this.ref.endCurrentPeriod();
  }

  /** Apply decisive set toss result. */
  onDecisiveToss(serve: 'home' | 'away', sideA: 'home' | 'away'): void {
    this.rotation.applyDecisiveToss(serve, sideA);
  }

  onFinishMatch(): void {
    this.timerComponent()?.pause();
    this.timerComponent()?.clearState();
    this.ref.finishMatch();
    this.rotation.clearState();

    // Emit match end via WebSocket
    this.socket.emitMatchEnd(this.id());
  }

  // ── Timer ─────────────────────────────────────────────────────────────────

  onTimerPaused(elapsed: number): void {
    // Only record as timeout event if user explicitly paused (not auto-pause from scoring)
    // Auto-pause is triggered internally and should not generate a timeline event
    // Broadcast timer state to spectators
    this.socket.emitTimerSync({
      matchId: this.id(),
      elapsed,
      running: false,
    });
  }

  onTimerFinished(): void {
    this.ref.onTimerExpired();
  }

  toggleTimerMode(): void {
    const current = this.timerMode();
    this.timerMode.set(current === 'progressive' ? 'countdown' : 'progressive');
  }

  toggleEventsLog(): void {
    this.showEventsLog.update((v) => !v);
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  goBack(): void {
    this.router.navigate(['/matches']);
  }
}
