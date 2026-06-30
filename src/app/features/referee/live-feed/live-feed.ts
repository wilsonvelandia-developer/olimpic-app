import {
  Component, ChangeDetectionStrategy, inject,
  signal, OnInit, OnDestroy,
} from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { RefereeSocketService } from '../referee-socket.service';
import type { Match } from '../../../core/models/match.model';

/**
 * Live feed widget — shows in-progress matches with real-time score updates.
 * Designed to be embedded in the dashboard or any other view.
 * Connects to WebSocket to get live score updates without polling.
 */
@Component({
  selector: 'app-live-feed',
  templateUrl: './live-feed.html',
  styleUrl: './live-feed.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveFeed implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly socket = inject(RefereeSocketService);
  private readonly router = inject(Router);

  readonly liveMatches = signal<Match[]>([]);
  readonly isLoading = signal<boolean>(false);

  private unsubscribers: Array<() => void> = [];

  ngOnInit(): void {
    this.loadLiveMatches();
    this.connectSocket();
  }

  ngOnDestroy(): void {
    this.unsubscribers.forEach((fn) => fn());
    // Don't disconnect socket here — it's shared and other components may use it
  }

  private loadLiveMatches(): void {
    this.isLoading.set(true);
    this.api.get<Match[]>('/matches?status=in_progress').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.liveMatches.set(res.data);
          // Join rooms for all live matches
          for (const match of res.data) {
            this.socket.joinAsSpectator(match.id);
          }
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  private connectSocket(): void {
    this.socket.connect();

    // Listen for score updates and reload
    this.unsubscribers.push(
      this.socket.on('match:score_update', () => {
        this.loadLiveMatches();
      }),
    );

    // Listen for match finished (remove from live)
    this.unsubscribers.push(
      this.socket.on('match:finished', () => {
        this.loadLiveMatches();
      }),
    );
  }

  /** Navigate to spectator live view. */
  watchMatch(matchId: string): void {
    this.router.navigate(['/referee/live', matchId]);
  }

  /** Reload matches manually. */
  refresh(): void {
    this.loadLiveMatches();
  }
}
