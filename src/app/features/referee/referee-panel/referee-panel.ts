import {
  Component, ChangeDetectionStrategy, input, inject,
  signal, computed, OnInit, OnDestroy, viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { Scoreboard } from '../scoreboard/scoreboard';
import { Timer, TimerMode } from '../timer/timer';
import { MatchEventsLog } from '../match-events-log/match-events-log';
import { ScorerSelect, type ScorerSelection, type PlayerOption } from '../scorer-select/scorer-select';
import { SubstitutionDialog, type SubstitutionSelection } from '../substitution-dialog/substitution-dialog';
import { SanctionDialog, type SanctionSelection, type SanctionType } from '../sanction-dialog/sanction-dialog';
import { MatchSetup, type MatchSetupResult, type TeamPlayers } from '../match-setup/match-setup';
import { RefereeService } from '../referee.service';
import { RefereeSocketService } from '../referee-socket.service';
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
    Scoreboard, Timer, MatchEventsLog, LoadingSpinner,
    ScorerSelect, SubstitutionDialog, SanctionDialog, MatchSetup,
  ],
  templateUrl: './referee-panel.html',
  styleUrl: './referee-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RefereeService],
})
export class RefereePanel implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly socket = inject(RefereeSocketService);
  readonly ref = inject(RefereeService);

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
    return Math.floor(timer.elapsed() / 60);
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

  /** Timer sync interval for broadcasting to spectators. */
  private timerSyncInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.ref.loadMatch(this.id());
    this.connectWebSocket();
  }

  ngOnDestroy(): void {
    this.socket.leaveAsReferee(this.id());
    this.socket.disconnect();
    if (this.timerSyncInterval) clearInterval(this.timerSyncInterval);
  }

  /** Connect WebSocket and join match room as referee. */
  private async connectWebSocket(): Promise<void> {
    this.socket.connect();
    // Wait a moment for connection then join
    setTimeout(async () => {
      const res = await this.socket.joinAsReferee(this.id());
      if (!res.success) {
        this.ref.error.set(res.message ?? 'No se pudo tomar control del partido');
      }
      // Start timer sync broadcast every 5 seconds
      this.timerSyncInterval = setInterval(() => {
        const timer = this.timerComponent();
        if (timer && timer.isRunning()) {
          this.socket.emitTimerSync({
            matchId: this.id(),
            elapsed: timer.elapsed(),
            running: true,
          });
        }
      }, 5000);
    }, 1000);
  }

  // ── Score Actions (now opens scorer-select dialog) ────────────────────────

  onHomeScoreUp(): void {
    this.scoringTeamSide.set('home');
    this.ref.addPoint('home');
    this.showScorerSelect.set(true);
    this.timerComponent()?.autoPause();
  }

  onHomeScoreDown(): void {
    this.ref.removePoint('home');
  }

  onAwayScoreUp(): void {
    this.scoringTeamSide.set('away');
    this.ref.addPoint('away');
    this.showScorerSelect.set(true);
    this.timerComponent()?.autoPause();
  }

  onAwayScoreDown(): void {
    this.ref.removePoint('away');
  }

  // ── Scorer Select Dialog ──────────────────────────────────────────────────

  onScorerSelected(selection: ScorerSelection): void {
    const period = this.ref.currentPeriod();
    if (!period) return;

    const dto = {
      teamId: this.scoringTeamId(),
      playerId: selection.playerId,
      periodNumber: period.periodNumber,
      matchMinute: this.currentMinute(),
      points: 1,
    };

    this.ref.registerScorer(dto);

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
    this.ref.endCurrentPeriod();
  }

  onFinishMatch(): void {
    this.timerComponent()?.pause();
    this.ref.finishMatch();

    // Emit match end via WebSocket
    this.socket.emitMatchEnd(this.id());
  }

  // ── Timer ─────────────────────────────────────────────────────────────────

  onTimerPaused(elapsed: number): void {
    this.ref.recordTimerPause(elapsed);
    // Broadcast timer pause to spectators
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
