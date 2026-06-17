import { inject, Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import type { Match, Team } from '../../core/models';

export interface DashboardStats {
  totalTournaments:  number;
  activeTournaments: number;
  totalTeams:        number;
  totalPlayers:      number;
  totalMatches:      number;
  pendingMatches:    number;
  totalSports:       number;
}

export interface RecentTournament {
  id:     string;
  name:   string;
  status: string;
  season: string | null;
}

export interface RecentMatch {
  id:           string;
  homeTeamId:   string;
  awayTeamId:   string;
  homeTeamName: string;
  awayTeamName: string;
  status:       string;
  scheduledAt:  string | null;
}

const EMPTY_PAGE = { data: [] as unknown[], total: 0, page: 1, pageSize: 10, totalPages: 0, success: true, message: '' };

/**
 * Aggregates data for the dashboard.
 * Enriches matches with team names by loading teams in parallel.
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);

  getStats(): Observable<DashboardStats> {
    return forkJoin({
      tournaments:    this.api.getPaginated<unknown>('/tournaments', { pageSize: 200 }).pipe(catchError(() => of(EMPTY_PAGE))),
      activeTourneys: this.api.getPaginated<unknown>('/tournaments', { pageSize: 200, status: 'active' }).pipe(catchError(() => of(EMPTY_PAGE))),
      teams:          this.api.getPaginated<unknown>('/teams', { pageSize: 200 }).pipe(catchError(() => of(EMPTY_PAGE))),
      matches:        this.api.getPaginated<unknown>('/matches', { pageSize: 200 }).pipe(catchError(() => of(EMPTY_PAGE))),
      pending:        this.api.getPaginated<unknown>('/matches', { pageSize: 200, status: 'scheduled' }).pipe(catchError(() => of(EMPTY_PAGE))),
      sports:         this.api.getPaginated<unknown>('/sports', { pageSize: 200 }).pipe(catchError(() => of(EMPTY_PAGE))),
    }).pipe(
      map((results) => ({
        totalTournaments:  results.tournaments.total,
        activeTournaments: results.activeTourneys.total,
        totalTeams:        results.teams.total,
        totalPlayers:      0,
        totalMatches:      results.matches.total,
        pendingMatches:    results.pending.total,
        totalSports:       results.sports.total,
      })),
    );
  }

  getRecentTournaments(): Observable<RecentTournament[]> {
    return this.api
      .getPaginated<RecentTournament>('/tournaments', { pageSize: 5, page: 1 })
      .pipe(
        map((r) => r.data),
        catchError(() => of([])),
      );
  }

  /**
   * Loads recent matches AND enriches them with team names.
   * Strategy: load matches + all teams in parallel, then join names.
   */
  getRecentMatches(): Observable<RecentMatch[]> {
    return forkJoin({
      matches: this.api.getPaginated<Match>('/matches', { pageSize: 5, page: 1 }).pipe(catchError(() => of(EMPTY_PAGE))),
      teams:   this.api.getPaginated<Team>('/teams', { pageSize: 200 }).pipe(catchError(() => of(EMPTY_PAGE))),
    }).pipe(
      map(({ matches, teams }) => {
        const teamMap = new Map<string, string>();
        (teams.data as Team[]).forEach((t) => teamMap.set(t.id, t.shortName ?? t.name));

        return (matches.data as Match[]).map((m) => ({
          id:           m.id,
          homeTeamId:   m.homeTeamId,
          awayTeamId:   m.awayTeamId,
          homeTeamName: teamMap.get(m.homeTeamId) ?? m.homeTeamId.slice(0, 8),
          awayTeamName: teamMap.get(m.awayTeamId) ?? m.awayTeamId.slice(0, 8),
          status:       m.status,
          scheduledAt:  m.scheduledAt,
        }));
      }),
      catchError(() => of([])),
    );
  }
}
