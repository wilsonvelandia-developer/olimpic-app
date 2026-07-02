import { Component, ChangeDetectionStrategy, inject, signal, input, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { Bracket, type BracketRound, type BracketMatch } from '../../../shared/components/bracket/bracket';

interface PhaseData {
  id: string;
  name: string;
  format: string;
  status: string;
}

interface MatchData {
  id: string;
  phaseId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName?: string;
  awayTeamName?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  scheduledAt: string | null;
  status: 'scheduled' | 'in_progress' | 'finished';
  winnerId: string | null;
  round?: string;
}

/**
 * Tournament bracket — fetches knockout phase matches and renders them
 * in an elimination bracket layout.
 */
@Component({
  selector: 'app-tournament-bracket',
  imports: [LoadingSpinner, Bracket],
  templateUrl: './tournament-bracket.html',
  styleUrl: './tournament-bracket.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentBracket implements OnInit {
  private readonly api = inject(ApiService);

  readonly tournamentId = input.required<string>();

  readonly rounds = signal<BracketRound[]>([]);
  readonly thirdPlaceMatch = signal<BracketMatch | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly hasKnockoutPhase = signal<boolean>(false);

  ngOnInit(): void {
    this.loadBracket();
  }

  private loadBracket(): void {
    this.isLoading.set(true);

    // First get phases to find the knockout/elimination phase
    this.api.get<PhaseData[]>(`/tournaments/${this.tournamentId()}/phases`).subscribe({
      next: (res) => {
        const phases = res.data ?? [];
        const knockoutPhase = phases.find((p) =>
          p.format === 'single_elim' || p.format === 'double_elim' || p.name.toLowerCase().includes('eliminat'),
        );

        if (!knockoutPhase) {
          this.hasKnockoutPhase.set(false);
          this.isLoading.set(false);
          return;
        }

        this.hasKnockoutPhase.set(true);
        this.loadMatches(knockoutPhase.id);
      },
      error: () => this.isLoading.set(false),
    });
  }

  private loadMatches(phaseId: string): void {
    this.api.getPaginated<MatchData>('/matches', { phaseId, pageSize: 100 }).subscribe({
      next: (res) => {
        const matches = res.data ?? [];
        this.buildBracketFromMatches(matches);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  private buildBracketFromMatches(matches: MatchData[]): void {
    // Group matches by round label
    const roundMap = new Map<string, MatchData[]>();

    for (const m of matches) {
      const roundLabel = m.round ?? 'Ronda';
      if (!roundMap.has(roundLabel)) roundMap.set(roundLabel, []);
      roundMap.get(roundLabel)!.push(m);
    }

    // Sort rounds by number of matches (more matches = earlier round)
    const sortedEntries = [...roundMap.entries()].sort((a, b) => b[1].length - a[1].length);

    const bracketRounds: BracketRound[] = sortedEntries.map(([name, roundMatches], _idx) => ({
      name: this.formatRoundName(name, roundMatches.length),
      matches: roundMatches.map((m, pos) => ({
        id: m.id,
        round: sortedEntries.findIndex(([n]) => n === name),
        position: pos,
        homeTeamName: m.homeTeamName ?? 'TBD',
        awayTeamName: m.awayTeamName ?? 'TBD',
        homeScore: m.homeScore ?? null,
        awayScore: m.awayScore ?? null,
        winnerId: m.winnerId,
        status: m.status,
      })),
    }));

    // Check if there's a 3rd place match (typically labeled)
    const thirdPlaceIdx = bracketRounds.findIndex((r) =>
      r.name.toLowerCase().includes('tercer') || r.name.toLowerCase().includes('3rd'),
    );
    if (thirdPlaceIdx >= 0) {
      const [thirdRound] = bracketRounds.splice(thirdPlaceIdx, 1);
      if (thirdRound.matches.length > 0) {
        this.thirdPlaceMatch.set(thirdRound.matches[0]);
      }
    }

    this.rounds.set(bracketRounds);
  }

  private formatRoundName(name: string, matchCount: number): string {
    const lower = name.toLowerCase();
    if (lower.includes('final') && matchCount === 1) return 'Final';
    if (lower.includes('semi') || matchCount === 2) return 'Semifinales';
    if (matchCount === 4) return 'Cuartos de final';
    if (matchCount === 8) return 'Octavos de final';
    return name;
  }
}
