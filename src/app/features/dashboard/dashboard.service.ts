import { inject, Injectable } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';

export interface DashboardStats {
  totalTournaments: number;
  activeTournaments: number;
  totalTeams: number;
  totalPlayers: number;
  totalMatches: number;
  pendingMatches: number;
  totalSports: number;
}

export interface RecentTournament {
  id: number;
  name: string;
  status: string;
  sportName: string | null;
  startDate: string;
}

export interface RecentMatch {
  id: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  scheduledAt: string;
  round: string;
}

/**
 * Aggregates data for the dashboard overview.
 * Uses forkJoin to load all counters in parallel for minimal latency.
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);

  /** Loads all stat counters in parallel. */
  getStats(): Observable<DashboardStats> {
    return forkJoin({
      tournaments:    this.api.getPaginated<unknown>('/tournaments', { pageSize: 1 }),
      activeTourneys: this.api.getPaginated<unknown>('/tournaments', { pageSize: 1, status: 'in_progress' }),
      teams:          this.api.getPaginated<unknown>('/teams', { pageSize: 1 }),
      players:        this.api.getPaginated<unknown>('/players', { pageSize: 1 }),
      matches:        this.api.getPaginated<unknown>('/matches', { pageSize: 1 }),
      pending:        this.api.getPaginated<unknown>('/matches', { pageSize: 1, status: 'scheduled' }),
      sports:         this.api.getPaginated<unknown>('/sports', { pageSize: 1 }),
    }).pipe(
      map((results) => ({
        totalTournaments:  results.tournaments.total,
        activeTournaments: results.activeTourneys.total,
        totalTeams:        results.teams.total,
        totalPlayers:      results.players.total,
        totalMatches:      results.matches.total,
        pendingMatches:    results.pending.total,
        totalSports:       results.sports.total,
      })),
    );
  }

  /** Loads the 5 most recent tournaments. */
  getRecentTournaments(): Observable<RecentTournament[]> {
    return this.api
      .getPaginated<RecentTournament>('/tournaments', { pageSize: 5, page: 1 })
      .pipe(map((r) => r.data));
  }

  /** Loads the 5 most recent matches. */
  getRecentMatches(): Observable<RecentMatch[]> {
    return this.api
      .getPaginated<RecentMatch>('/matches', { pageSize: 5, page: 1 })
      .pipe(map((r) => r.data));
  }
}
