import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import type { StandingsEntry } from '../../../core/models';

/**
 * Reusable standings table component.
 * Renders a sorted table of team positions with full stats.
 */
@Component({
  selector: 'app-standings-table',
  templateUrl: './standings-table.html',
  styleUrl: './standings-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StandingsTable {
  readonly entries = input.required<StandingsEntry[]>();
  /** UUID of the team to highlight, or null. */
  readonly highlightTeamId = input<string | null>(null);

  readonly isEmpty = computed(() => this.entries().length === 0);

  positionClass(pos: number): string {
    if (pos === 1) return 'pos--gold';
    if (pos === 2) return 'pos--silver';
    if (pos === 3) return 'pos--bronze';
    return '';
  }

  positionIcon(pos: number): string {
    if (pos === 1) return '🥇';
    if (pos === 2) return '🥈';
    if (pos === 3) return '🥉';
    return String(pos);
  }

  isHighlighted(entry: StandingsEntry): boolean {
    const id = this.highlightTeamId();
    return id !== null && entry.teamId === id;
  }
}
