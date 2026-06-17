import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import type { Match } from '../../../core/models';

/**
 * Compact match history list for the tournament detail view.
 * Groups matches by round (or by phase if round is absent).
 */
@Component({
  selector: 'app-match-history',
  imports: [StatusBadge],
  templateUrl: './match-history.html',
  styleUrl: './match-history.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchHistory {
  readonly matches      = input.required<Match[]>();
  readonly totalMatches = input<number>(0);
  readonly currentPage  = input<number>(1);
  readonly isLoading    = input<boolean>(false);

  readonly pageChange = output<number>();
  readonly matchClick = output<string>();   // UUID string

  readonly pageSize = 20;

  readonly totalPages = computed(() => Math.ceil(this.totalMatches() / this.pageSize));
  readonly pageRange  = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1),
  );

  /** Group matches by round label (fallback: phaseId). */
  readonly matchesByRound = computed<Record<string, Match[]>>(() => {
    const groups: Record<string, Match[]> = {};
    this.matches().forEach((m) => {
      const key = m.round ?? m.phaseId ?? 'Sin ronda';
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    return groups;
  });

  readonly rounds = computed(() => Object.keys(this.matchesByRound()));

  onPageChange(page: number): void {
    this.pageChange.emit(page);
  }

  onMatchClick(id: string): void {
    this.matchClick.emit(id);
  }

  formatDateTime(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('es-CO', {
      day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
    });
  }

  teamLabel(match: Match, side: 'home' | 'away'): string {
    if (side === 'home') return match.homeTeamName ?? match.homeTeamId;
    return match.awayTeamName ?? match.awayTeamId;
  }
}
