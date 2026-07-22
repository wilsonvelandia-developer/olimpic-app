import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  input,
  OnInit,
} from '@angular/core';
import { PlayerService, type PlayerStats } from '../player.service';

/**
 * Player statistics card.
 * Displays aggregated stats: goals, cards, matches, win ratio.
 * Used inside player-detail as a sub-component.
 */
@Component({
  selector: 'app-player-stats',
  templateUrl: './player-stats.html',
  styleUrl: './player-stats.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerStatsComponent implements OnInit {
  private readonly playerService = inject(PlayerService);

  /** Team ID — required to build the API path. */
  readonly teamId = input.required<string>();

  /** Player ID. */
  readonly playerId = input.required<string>();

  readonly stats = signal<PlayerStats | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadStats();
  }

  private loadStats(): void {
    this.isLoading.set(true);
    this.playerService.getStats(this.teamId(), this.playerId()).subscribe({
      next: (data) => {
        this.stats.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudieron cargar las estadísticas.');
        this.isLoading.set(false);
      },
    });
  }

  /** Win percentage (0-100). */
  get winRate(): number {
    const s = this.stats();
    if (!s || s.matchesPlayed === 0) return 0;
    return Math.round((s.matchResults.wins / s.matchesPlayed) * 100);
  }
}
