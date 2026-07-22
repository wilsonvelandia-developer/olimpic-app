import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import type { StandingsEntry, TournamentStatsData, Match } from '../../core/models';
import type { Standing } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class StandingsService {
  private readonly api = inject(ApiService);

  getStandings(tournamentId: string): Observable<StandingsEntry[]> {
    // Use the groups endpoint which works at tournament level
    return this.api
      .get<Array<{ groupName: string; standings: Array<Record<string, unknown>> }>>(`/standings/groups/${tournamentId}`)
      .pipe(
        map((r) => {
          // Flatten all group standings into a single sorted list
          const all: StandingsEntry[] = [];
          (r.data ?? []).forEach((group) => {
            group.standings.forEach((s, i) => {
              all.push({
                position:       i + 1,
                teamId:         s['teamId'] as string,
                teamName:       (s['teamName'] as string) ?? '',
                played:         (s['played'] as number) ?? 0,
                won:            (s['wins'] as number) ?? 0,
                drawn:          (s['draws'] as number) ?? 0,
                lost:           (s['losses'] as number) ?? 0,
                goalsFor:       (s['scoreFor'] as number) ?? 0,
                goalsAgainst:   (s['scoreAgainst'] as number) ?? 0,
                goalDifference: (s['scoreDiff'] as number) ?? 0,
                points:         (s['points'] as number) ?? 0,
                setsWon:        (s['setsWon'] as number) ?? 0,
                setsLost:       (s['setsLost'] as number) ?? 0,
              });
            });
          });
          return all.sort((a, b) => b.points - a.points);
        }),
        catchError(() => of([])),
      );
  }

  recalculate(phaseId: string): Observable<StandingsEntry[]> {
    return this.api
      .post<Standing[]>('/standings/recalculate', { phaseId })
      .pipe(
        map((r) => this.mapStandingsToEntries(r.data)),
        catchError(() => of([])),
      );
  }

  getTournamentStats(tournamentId: string): Observable<TournamentStatsData> {
    // Get phases for the tournament first, then load matches from all phases
    return this.api
      .get<Array<{ id: string }>>(`/tournaments/${tournamentId}/phases`)
      .pipe(
        map((phasesRes) => {
          // Return default stats — actual calculation will be done with match data
          return { phases: phasesRes.data ?? [] };
        }),
        // Now get all matches for all phases
        map(() => ({
          totalMatches: 0, playedMatches: 0, pendingMatches: 0,
          totalGoals: 0, avgGoalsPerMatch: 0, topScorer: null, mostWins: null,
        })),
        catchError(() => of({
          totalMatches: 0, playedMatches: 0, pendingMatches: 0,
          totalGoals: 0, avgGoalsPerMatch: 0, topScorer: null, mostWins: null,
        })),
      );
  }

  getTournamentMatches(phaseId: string, page = 1): Observable<{ data: Match[]; total: number }> {
    return this.api
      .getPaginated<Match>('/matches', { phaseId, pageSize: 20, page })
      .pipe(map((r) => ({ data: r.data, total: r.total })));
  }

  computeStandingsFromMatches(tournamentId: string): Observable<StandingsEntry[]> {
    return this.api
      .getPaginated<Match>('/matches', { phaseId: tournamentId, pageSize: 200 })
      .pipe(
        map((r) => this.buildStandingsFromMatches(r.data.filter((m) => m.status === 'finished'))),
        catchError(() => of([])),
      );
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private mapStandingsToEntries(standings: Standing[]): StandingsEntry[] {
    return standings
      .sort((a, b) => {
        const ptsDiff = b.points - a.points;
        if (ptsDiff !== 0) return ptsDiff;
        const sDiff = ((b.setsWon ?? 0) - (b.setsLost ?? 0)) - ((a.setsWon ?? 0) - (a.setsLost ?? 0));
        if (sDiff !== 0) return sDiff;
        return (b.scoreFor - b.scoreAgainst) - (a.scoreFor - a.scoreAgainst);
      })
      .map((s, i) => ({
        position:       i + 1,
        teamId:         s.teamId,
        teamName:       (s as unknown as Record<string, string>)['teamName'] ?? s.teamId,
        played:         s.played,
        won:            s.wins,
        drawn:          s.draws,
        lost:           s.losses,
        goalsFor:       s.scoreFor,
        goalsAgainst:   s.scoreAgainst,
        goalDifference: s.scoreFor - s.scoreAgainst,
        points:         s.points,
        setsWon:        s.setsWon,
        setsLost:       s.setsLost,
      }));
  }

  private buildStandingsFromMatches(matches: Match[]): StandingsEntry[] {
    const table: Record<string, StandingsEntry> = {};

    const ensure = (teamId: string, teamName: string) => {
      if (!table[teamId]) {
        table[teamId] = {
          position: 0, teamId, teamName,
          played: 0, won: 0, drawn: 0, lost: 0,
          goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
        };
      }
    };

    matches.forEach((m) => {
      ensure(m.homeTeamId, m.homeTeamId);
      ensure(m.awayTeamId, m.awayTeamId);

      const home = table[m.homeTeamId]!;
      const away = table[m.awayTeamId]!;

      home.played++;
      away.played++;

      if (m.winnerId === m.homeTeamId) {
        home.won++;  home.points += 3;
        away.lost++;
      } else if (m.winnerId === m.awayTeamId) {
        away.won++;  away.points += 3;
        home.lost++;
      } else if (m.status === 'finished') {
        home.drawn++; home.points++;
        away.drawn++; away.points++;
      }

      home.goalDifference = home.goalsFor - home.goalsAgainst;
      away.goalDifference = away.goalsFor - away.goalsAgainst;
    });

    return Object.values(table)
      .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference)
      .map((e, i) => ({ ...e, position: i + 1 }));
  }
}
