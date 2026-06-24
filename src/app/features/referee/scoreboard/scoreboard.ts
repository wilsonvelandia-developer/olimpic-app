import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

/**
 * Scoreboard component — displays team names, scores, and +/- buttons.
 * Touch-optimized with large buttons (min 48x48px).
 */
@Component({
  selector: 'app-scoreboard',
  templateUrl: './scoreboard.html',
  styleUrl: './scoreboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Scoreboard {
  readonly homeTeamName = input.required<string>();
  readonly awayTeamName = input.required<string>();
  readonly homeScore = input.required<number>();
  readonly awayScore = input.required<number>();
  readonly homeSetsWon = input<number>(0);
  readonly awaySetsWon = input<number>(0);
  readonly periodLabel = input<string>('P1');
  readonly hasSets = input<boolean>(false);
  readonly disabled = input<boolean>(false);

  readonly homeScoreUp = output<void>();
  readonly homeScoreDown = output<void>();
  readonly awayScoreUp = output<void>();
  readonly awayScoreDown = output<void>();
}
