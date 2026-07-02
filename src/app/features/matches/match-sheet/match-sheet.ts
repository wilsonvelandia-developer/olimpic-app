import { Component, ChangeDetectionStrategy, inject, signal, input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import type { MatchDetail, Match, MatchPeriod } from '../../../core/models/match.model';

interface MatchSheetData {
  match: Match;
  periods: MatchPeriod[];
  lineups: { home: LineupEntry[]; away: LineupEntry[] };
  scorers: ScorerEntry[];
  substitutions: SubEntry[];
  sanctions: SanctionEntry[];
  referees: RefereeEntry[];
}

interface LineupEntry {
  playerName: string;
  jerseyNumber: number;
  isStarter: boolean;
  isCaptain: boolean;
  isGoalkeeper: boolean;
  isLibero: boolean;
}

interface ScorerEntry {
  playerName: string;
  jerseyNumber: number;
  teamName: string;
  periodNumber: number;
  matchMinute: number | null;
  points: number;
}

interface SubEntry {
  teamName: string;
  playerOutName: string;
  playerInName: string;
  periodNumber: number;
  minute: number | null;
}

interface SanctionEntry {
  playerName: string | null;
  teamName: string;
  sanctionName: string;
  sanctionColor: string | null;
  sanctionIcon: string | null;
  periodNumber: number | null;
  minute: number | null;
}

interface RefereeEntry {
  userName: string;
  refereeRole: string;
}

/**
 * Match Sheet — official digital match report (planilla).
 * Shows all match data in a printable format:
 * lineups, scorers, substitutions, sanctions, periods, referees.
 */
@Component({
  selector: 'app-match-sheet',
  imports: [DatePipe],
  templateUrl: './match-sheet.html',
  styleUrl: './match-sheet.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchSheet implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();

  readonly data = signal<MatchSheetData | null>(null);
  readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    const matchId = this.id();

    // Load match detail
    this.api.get<MatchDetail>(`/matches/${matchId}`).subscribe({
      next: (res) => {
        if (!res.success || !res.data) { this.isLoading.set(false); return; }
        const { match, periods } = res.data;

        // Load additional data in parallel
        const lineups = { home: [] as LineupEntry[], away: [] as LineupEntry[] };
        const scorers: ScorerEntry[] = [];
        const substitutions: SubEntry[] = [];
        const sanctions: SanctionEntry[] = [];
        const referees: RefereeEntry[] = [];

        let pending = 5;
        const checkDone = () => {
          pending--;
          if (pending <= 0) {
            this.data.set({ match, periods, lineups, scorers, substitutions, sanctions, referees });
            this.isLoading.set(false);
          }
        };

        // Lineups home
        this.api.get<LineupEntry[]>(`/matches/${matchId}/match-lineups/${match.homeTeamId}`).subscribe({
          next: (r) => { if (r.success && r.data) lineups.home = r.data; checkDone(); },
          error: () => checkDone(),
        });

        // Lineups away
        this.api.get<LineupEntry[]>(`/matches/${matchId}/match-lineups/${match.awayTeamId}`).subscribe({
          next: (r) => { if (r.success && r.data) lineups.away = r.data; checkDone(); },
          error: () => checkDone(),
        });

        // Scorers
        this.api.get<ScorerEntry[]>(`/matches/${matchId}/scorers`).subscribe({
          next: (r) => { if (r.success && r.data) scorers.push(...r.data); checkDone(); },
          error: () => checkDone(),
        });

        // Substitutions
        this.api.get<SubEntry[]>(`/matches/${matchId}/substitutions`).subscribe({
          next: (r) => { if (r.success && r.data) substitutions.push(...r.data); checkDone(); },
          error: () => checkDone(),
        });

        // Sanctions
        this.api.get<SanctionEntry[]>(`/matches/${matchId}/sanctions`).subscribe({
          next: (r) => { if (r.success && r.data) sanctions.push(...r.data); checkDone(); },
          error: () => checkDone(),
        });
      },
      error: () => this.isLoading.set(false),
    });
  }

  get totalHome(): number {
    return this.data()?.periods.reduce((s, p) => s + p.homeScore, 0) ?? 0;
  }

  get totalAway(): number {
    return this.data()?.periods.reduce((s, p) => s + p.awayScore, 0) ?? 0;
  }

  goBack(): void {
    this.router.navigate(['/matches']);
  }

  print(): void {
    window.print();
  }
}
