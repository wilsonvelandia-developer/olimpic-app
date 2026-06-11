export type MatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'postponed' | 'cancelled';

/**
 * Represents a match between two teams within a tournament.
 */
export interface Match {
  id: number;
  tournamentId: number;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  scheduledAt: string;
  playedAt: string | null;
  round: string;
  venue: string;
}

export interface MatchResultRequest {
  homeScore: number;
  awayScore: number;
  playedAt: string;
}
