import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

interface PlayerTeamInfo {
  teamId: string;
  teamName: string;
  tournamentId: string;
  tournamentName: string;
  category: string | null;
  sportName: string;
  jerseyNumber: number;
  position: string | null;
}

interface PlayerStats {
  totalGoals: number;
  totalMatches: number;
  yellowCards: number;
  redCards: number;
}

/**
 * Player dashboard — shows the logged-in player's teams, tournaments, and personal stats.
 * Only visible to users with 'player' role.
 */
@Component({
  selector: 'app-player-dashboard',
  templateUrl: './player-dashboard.html',
  styleUrl: './player-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerDashboard implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly teams = signal<PlayerTeamInfo[]>([]);
  readonly stats = signal<PlayerStats | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly userName = this.auth.currentUser;

  ngOnInit(): void {
    this.loadPlayerData();
  }

  private loadPlayerData(): void {
    const userId = this.auth.currentUser()?.id;
    if (!userId) { this.isLoading.set(false); return; }

    // Load player stats
    this.api.get<PlayerStats>(`/standings/player-stats/${userId}`).subscribe({
      next: (res) => { if (res.success && res.data) this.stats.set(res.data); },
    });

    // Load teams/tournaments the player belongs to
    // We query players by user_id through a custom endpoint
    this.api.get<PlayerTeamInfo[]>(`/teams/my-teams`).subscribe({
      next: (res) => {
        if (res.success && res.data) this.teams.set(res.data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  openTournament(tournamentId: string): void {
    this.router.navigate(['/tournaments', tournamentId]);
  }

  openTeam(teamId: string): void {
    this.router.navigate(['/teams', teamId]);
  }
}
