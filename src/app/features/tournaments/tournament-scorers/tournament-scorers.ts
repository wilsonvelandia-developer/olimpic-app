import { Component, ChangeDetectionStrategy, inject, signal, input, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

interface Scorer {
  playerId: string;
  playerName: string;
  teamName: string;
  teamShort: string | null;
  goals: number;
  assists: number;
  matchesPlayed: number;
  goalsPerMatch: number;
}

/**
 * Tournament scorers — ranking of top goal scorers (goleadores).
 * Shows goals, assists, matches played, and goals/match ratio.
 */
@Component({
  selector: 'app-tournament-scorers',
  imports: [LoadingSpinner],
  templateUrl: './tournament-scorers.html',
  styleUrl: './tournament-scorers.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentScorers implements OnInit {
  private readonly api = inject(ApiService);

  readonly tournamentId = input.required<string>();

  readonly scorers = signal<Scorer[]>([]);
  readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadScorers();
  }

  loadScorers(): void {
    this.isLoading.set(true);
    this.api.get<Scorer[]>(`/matches/scorers?tournamentId=${this.tournamentId()}`).subscribe({
      next: (res) => {
        const data = (res.data ?? []).sort((a, b) => b.goals - a.goals);
        this.scorers.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  getMedalIcon(position: number): string {
    if (position === 0) return '🥇';
    if (position === 1) return '🥈';
    if (position === 2) return '🥉';
    return String(position + 1);
  }
}
