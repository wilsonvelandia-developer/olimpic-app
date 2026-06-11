/**
 * Represents a team's position in a tournament standings table.
 */
export interface StandingsEntry {
  position: number;
  teamId: number;
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
 * Aggregated statistics for a tournament.
 */
export interface TournamentStatsData {
  totalMatches: number;
  playedMatches: number;
  pendingMatches: number;
  totalGoals: number;
  avgGoalsPerMatch: number;
  topScorer: string | null;
  mostWins: string | null;
}
