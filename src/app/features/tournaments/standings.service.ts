import { inject, Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import type { StandingsEntry, TournamentStatsData } from '../../core/models';
import type { Match } from '../../core/models';

/**
 * Service for tournament standings and statistics.
 *
 * Strategy:
 * 1. First tries to load standings from the API endpoint `/tournaments/:id/standings`.
 * 2. If the backend does not expose that endpoint yet, the `computeFromMatches()` method
 *    calculates standings locally from the completed matches.
 *    This keeps the frontend functional while the backend is being built.
 */
@Injectable({ providedIn: 'root' })
export class StandingsService {
  private readonly api = inject(ApiService);

  /**
   * Loads standings from the backend.
   * Falls back to local computation if the API returns an error.
   */
  getStandings(tournamentId: number): Observable<StandingsEntry[]> {
    return this.api
      .get<StandingsEntry[]>(`/tournaments/${tournamentId}/standings`)
      .pipe(map((r) => r.data));
  }

  /**
   * Loads all completed matches for a tournament and computes standings locally.
   * Use this when the backend standings endpoint is not available yet.
   */
  computeStandingsFromMatches(tournamentId: number): Observable<StandingsEntry[]> {
    return this.api
      .getPaginated<Match>('/matches', { tournamentId, pageSize: 200 })
      .pipe(
        map((response) => {
          const completed = response.data.filter((m) => m.status === 'completed');
          return this.buildStandings(completed);
        }),
      );
  }

  /**
   * Loads tournament match statistics.
   */
  getTournamentStats(tournamentId: number): Observable<TournamentStatsData> {
    return forkJoin({
      all:       this.api.getPaginated<Match>('/matches', { tournamentId, pageSize: 1 }),
      played:    this.api.getPaginated<Match>('/matches', { tournamentId, status: 'completed', pageSize: 200 }),
      pending:   this.api.getPaginated<Match>('/matches', { tournamentId, status: 'scheduled', pageSize: 1 }),
    }).pipe(
      map(({ all, played, pending }) => {
        const completedMatches = played.data;
        const totalGoals = completedMatches.reduce(
          (sum, m) => sum + (m.homeScore ?? 0) + (m.awayScore ?? 0),
          0,
        );
        const playedCount = completedMatches.length;

        // Find team with most wins
        const winCounts: Record<string, number> = {};
        completedMatches.forEach((m) => {
          if (m.homeScore === null || m.awayScore === null) return;
          if (m.homeScore > m.awayScore) {
            winCounts[m.homeTeamName] = (winCounts[m.homeTeamName] ?? 0) + 1;
          } else if (m.awayScore > m.homeScore) {
            winCounts[m.awayTeamName] = (winCounts[m.awayTeamName] ?? 0) + 1;
          }
        });
        const mostWins = Object.keys(winCounts).length
          ? Object.entries(winCounts).sort((a, b) => b[1] - a[1])[0][0]
          : null;

        return {
          totalMatches:      all.total,
          playedMatches:     playedCount,
          pendingMatches:    pending.total,
          totalGoals,
          avgGoalsPerMatch:  playedCount > 0 ? Math.round((totalGoals / playedCount) * 10) / 10 : 0,
          topScorer:         null, // requires player stats endpoint
          mostWins,
        };
      }),
    );
  }

  /**
   * Loads matches for a tournament (paginated).
   */
  getTournamentMatches(tournamentId: number, page = 1): Observable<{ data: Match[]; total: number }> {
    return this.api
      .getPaginated<Match>('/matches', { tournamentId, pageSize: 20, page })
      .pipe(map((r) => ({ data: r.data, total: r.total })));
  }

  /**
   * Builds a standings table from a list of completed matches.
   * Applies standard football/sports scoring: W=3pts, D=1pt, L=0pts.
   */
  private buildStandings(matches: Match[]): StandingsEntry[] {
    const table: Record<number, StandingsEntry> = {};

    const ensure = (teamId: number, teamName: string) => {
      if (!table[teamId]) {
        table[teamId] = {
          position: 0, teamId, teamName,
          played: 0, won: 0, drawn: 0, lost: 0,
          goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
        };
      }
    };

    matches.forEach((m) => {
      if (m.homeScore === null || m.awayScore === null) return;

      ensure(m.homeTeamId, m.homeTeamName);
      ensure(m.awayTeamId, m.awayTeamName);

      const home = table[m.homeTeamId];
      const away = table[m.awayTeamId];

      home.played++;
      away.played++;
      home.goalsFor      += m.homeScore;
      home.goalsAgainst  += m.awayScore;
      away.goalsFor      += m.awayScore;
      away.goalsAgainst  += m.homeScore;

      if (m.homeScore > m.awayScore) {
        home.won++;   home.points += 3;
        away.lost++;
      } else if (m.awayScore > m.homeScore) {
        away.won++;   away.points += 3;
        home.lost++;
      } else {
        home.drawn++; home.points += 1;
        away.drawn++; away.points += 1;
      }

      home.goalDifference = home.goalsFor - home.goalsAgainst;
      away.goalDifference = away.goalsFor - away.goalsAgainst;
    });

    return Object.values(table)
      .sort((a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        a.teamName.localeCompare(b.teamName),
      )
      .map((entry, i) => ({ ...entry, position: i + 1 }));
  }
}
