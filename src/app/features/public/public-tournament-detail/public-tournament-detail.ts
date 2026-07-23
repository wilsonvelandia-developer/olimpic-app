import { Component, ChangeDetectionStrategy, inject, signal, input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PublicApiService } from '../public-api.service';
import type { Tournament } from '../../../core/models/tournament.model';
import type { Match } from '../../../core/models/match.model';

interface StandingEntry {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

/**
 * Public tournament detail — shows standings, fixture, and results.
 * Accessible without login via shareable URL /p/tournament/:id.
 */
@Component({
  selector: 'app-public-tournament-detail',
  templateUrl: './public-tournament-detail.html',
  styleUrl: './public-tournament-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicTournamentDetail implements OnInit {
  private readonly api = inject(PublicApiService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();

  readonly tournament = signal<Tournament | null>(null);
  readonly standings = signal<StandingEntry[]>([]);
  readonly matches = signal<Match[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly activeTab = signal<'standings' | 'fixture' | 'results'>('standings');

  ngOnInit(): void {
    const id = this.id();
    this.loadData(id);
  }

  private loadData(id: string): void {
    // Load tournament info
    this.api.get<Tournament>(`/tournaments/${id}`).subscribe({
      next: (data) => {
        this.tournament.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });

    // Load matches
    this.api.get<Match[]>(`/matches?phaseId=&teamId=`).subscribe({
      next: (data) => this.matches.set(data ?? []),
    });

    // Load standings (first phase)
    this.api.get<{ phases: Array<{ id: string }> }>(`/tournaments/${id}/phases`).subscribe({
      next: (phases) => {
        if (phases && Array.isArray(phases) && phases.length > 0) {
          const firstPhaseId = (phases as Array<{ id: string }>)[0].id;
          this.api.get<StandingEntry[]>(`/standings/${firstPhaseId}`).subscribe({
            next: (s) => this.standings.set(s ?? []),
          });

          // Load matches for this phase
          this.api.get<Match[]>(`/matches?phaseId=${firstPhaseId}`).subscribe({
            next: (m) => this.matches.set(m ?? []),
          });
        }
      },
    });
  }

  setTab(tab: 'standings' | 'fixture' | 'results'): void {
    this.activeTab.set(tab);
  }

  get scheduledMatches(): Match[] {
    return this.matches().filter((m) => m.status === 'scheduled');
  }

  get finishedMatches(): Match[] {
    return this.matches().filter((m) => m.status === 'finished');
  }

  get inProgressMatches(): Match[] {
    return this.matches().filter((m) => m.status === 'in_progress');
  }

  openMatch(matchId: string): void {
    this.router.navigate(['/p/match', matchId]);
  }

  goBack(): void {
    this.router.navigate(['/p']);
  }

  /** Share the public tournament link via Web Share API or clipboard. */
  async shareTournament(): Promise<void> {
    const name = this.tournament()?.name ?? 'Torneo';
    const url = window.location.href;

    if (navigator.share) {
      await navigator.share({ title: name, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
    }
  }

  /** Navigate to the enrollment form for this tournament. */
  goToEnroll(): void {
    this.router.navigate(['/p/tournament', this.id(), 'enroll']);
  }
}
