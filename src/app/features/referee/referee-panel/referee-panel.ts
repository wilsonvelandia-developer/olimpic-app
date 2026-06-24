import {
  Component, ChangeDetectionStrategy, input, inject,
  signal, OnInit, viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { Scoreboard } from '../scoreboard/scoreboard';
import { Timer, TimerMode } from '../timer/timer';
import { MatchEventsLog } from '../match-events-log/match-events-log';
import { RefereeService } from '../referee.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

/**
 * Referee Panel — full-screen match control interface.
 * Optimized for tablet/mobile in landscape orientation.
 * Coordinates scoreboard, timer, and action buttons.
 */
@Component({
  selector: 'app-referee-panel',
  imports: [Scoreboard, Timer, MatchEventsLog, LoadingSpinner],
  templateUrl: './referee-panel.html',
  styleUrl: './referee-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RefereeService],
})
export class RefereePanel implements OnInit {
  private readonly router = inject(Router);
  readonly ref = inject(RefereeService);

  /** Match ID from route parameter. */
  readonly id = input.required<string>();

  readonly timerComponent = viewChild<Timer>('timerRef');

  /** Timer mode: referee can toggle between progressive/countdown. */
  readonly timerMode = signal<TimerMode>('progressive');
  readonly countdownTarget = signal<number>(0);
  readonly showEventsLog = signal<boolean>(false);

  ngOnInit(): void {
    this.ref.loadMatch(this.id());
  }

  // ── Score Actions ─────────────────────────────────────────────────────────

  onHomeScoreUp(): void {
    this.ref.addPoint('home');
  }

  onHomeScoreDown(): void {
    this.ref.removePoint('home');
  }

  onAwayScoreUp(): void {
    this.ref.addPoint('away');
  }

  onAwayScoreDown(): void {
    this.ref.removePoint('away');
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
  }

  // ── Timer ─────────────────────────────────────────────────────────────────

  onTimerPaused(elapsed: number): void {
    this.ref.recordTimerPause(elapsed);
  }

  onTimerFinished(): void {
    // Countdown reached zero — notify referee
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
