import {
  Component, ChangeDetectionStrategy, input, inject,
  signal, OnInit, OnDestroy,
} from '@angular/core';
import { RefereeSocketService, MatchScoreUpdate, MatchTimerSync } from '../referee-socket.service';
import { ApiService } from '../../../core/services/api.service';
import { MatchEventsLog, type MatchEventItem } from '../match-events-log/match-events-log';
import type { MatchDetail, Match, MatchPeriod } from '../../../core/models/match.model';

/**
 * Live match view for spectators.
 * Connects to WebSocket to receive real-time score, timer, and event updates.
 * Read-only — no actions, just a live scoreboard.
 */
@Component({
  selector: 'app-live-match',
  imports: [MatchEventsLog],
  templateUrl: './live-match.html',
  styleUrl: './live-match.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveMatch implements OnInit, OnDestroy {
  private readonly socket = inject(RefereeSocketService);
  private readonly api = inject(ApiService);

  readonly id = input.required<string>();

  readonly match = signal<Match | null>(null);
  readonly periods = signal<MatchPeriod[]>([]);
  readonly events = signal<MatchEventItem[]>([]);
  readonly timerElapsed = signal<number>(0);
  readonly timerRunning = signal<boolean>(false);
  readonly isLoading = signal<boolean>(true);
  readonly standingsUpdated = signal<boolean>(false);

  private unsubscribers: Array<() => void> = [];

  ngOnInit(): void {
    this.loadMatch();
    this.connectSocket();
  }

  ngOnDestroy(): void {
    this.socket.leaveAsSpectator(this.id());
    this.unsubscribers.forEach((fn) => fn());
  }

  private loadMatch(): void {
    this.api.get<MatchDetail>(`/matches/${this.id()}`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.match.set(res.data.match);
          this.periods.set(res.data.periods);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });

    this.api.get<MatchEventItem[]>(`/matches/${this.id()}/events`).subscribe({
      next: (res) => {
        if (res.success && res.data) this.events.set(res.data);
      },
    });
  }

  private connectSocket(): void {
    this.socket.connect();
    this.socket.joinAsSpectator(this.id());

    // Listen for score updates
    this.unsubscribers.push(
      this.socket.on<MatchScoreUpdate>('match:score_update', () => {
        // Reload match data on score change
        this.api.get<MatchDetail>(`/matches/${this.id()}`).subscribe({
          next: (res) => {
            if (res.success && res.data) {
              this.match.set(res.data.match);
              this.periods.set(res.data.periods);
            }
          },
        });
      }),
    );

    // Listen for timer sync
    this.unsubscribers.push(
      this.socket.on<MatchTimerSync>('match:timer_sync', (data) => {
        this.timerElapsed.set(data.elapsed);
        this.timerRunning.set(data.running);
      }),
    );

    // Listen for events (reload timeline)
    const eventTypes = ['match:substitution', 'match:sanction', 'match:period_change', 'match:finished'];
    for (const evt of eventTypes) {
      this.unsubscribers.push(
        this.socket.on(evt, () => {
          this.api.get<MatchEventItem[]>(`/matches/${this.id()}/events`).subscribe({
            next: (res) => {
              if (res.success && res.data) this.events.set(res.data);
            },
          });
          // Also reload match
          this.api.get<MatchDetail>(`/matches/${this.id()}`).subscribe({
            next: (res) => {
              if (res.success && res.data) {
                this.match.set(res.data.match);
                this.periods.set(res.data.periods);
              }
            },
          });
        }),
      );
    }

    // Listen for standings updates (after match finishes)
    this.unsubscribers.push(
      this.socket.on<{ phaseId: string; standings: unknown }>('standings:updated', (data) => {
        this.standingsUpdated.set(true);
      }),
    );
  }

  /** Format elapsed seconds as MM:SS. */
  formatTimer(): string {
    const s = this.timerElapsed();
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  /** Get current period score. */
  get currentPeriod(): MatchPeriod | null {
    const p = this.periods();
    return p.find((x) => x.status === 'in_progress') ?? p[p.length - 1] ?? null;
  }
}
