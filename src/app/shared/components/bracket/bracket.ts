import { Component, ChangeDetectionStrategy, input } from '@angular/core';

export interface BracketMatch {
  id: string;
  round: number;
  position: number;
  homeTeamName: string | null;
  awayTeamName: string | null;
  homeScore: number | null;
  awayScore: number | null;
  winnerId: string | null;
  status: 'scheduled' | 'in_progress' | 'finished';
}

export interface BracketRound {
  name: string;
  matches: BracketMatch[];
}

/**
 * Bracket component — displays elimination-style tournament bracket.
 * Uses CSS grid for layout with connecting lines between rounds.
 * Supports: quarterfinals, semifinals, final, and 3rd place match.
 *
 * Layout example (8 teams):
 *   QF1 ─┐
 *         ├─ SF1 ─┐
 *   QF2 ─┘       │
 *                 ├─ FINAL
 *   QF3 ─┐       │
 *         ├─ SF2 ─┘
 *   QF4 ─┘
 */
@Component({
  selector: 'app-bracket',
  templateUrl: './bracket.html',
  styleUrl: './bracket.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Bracket {
  /** Rounds ordered from earliest to latest (QF → SF → Final). */
  readonly rounds = input.required<BracketRound[]>();

  /** Optional 3rd place match shown separately. */
  readonly thirdPlaceMatch = input<BracketMatch | null>(null);

  /** Title for the bracket. */
  readonly title = input<string>('');

  getMatchClass(match: BracketMatch): string {
    if (match.status === 'in_progress') return 'bracket-match--live';
    if (match.status === 'finished') return 'bracket-match--finished';
    return '';
  }

  getTeamClass(match: BracketMatch, side: 'home' | 'away'): string {
    if (match.status !== 'finished' || match.winnerId === null) return '';
    const isWinner = side === 'home'
      ? (match.homeScore ?? 0) > (match.awayScore ?? 0)
      : (match.awayScore ?? 0) > (match.homeScore ?? 0);
    return isWinner ? 'bracket-team--winner' : 'bracket-team--loser';
  }
}
