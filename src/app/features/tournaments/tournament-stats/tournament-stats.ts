import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import type { TournamentStatsData } from '../../../core/models';

/**
 * Displays aggregated statistics for a tournament as a card grid.
 */
@Component({
  selector: 'app-tournament-stats',
  templateUrl: './tournament-stats.html',
  styleUrl: './tournament-stats.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentStats {
  readonly stats = input.required<TournamentStatsData>();
}
