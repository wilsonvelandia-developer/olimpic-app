/**
 * Match, MatchPeriod and related models — matches the backend matches service.
 * IDs are UUIDs (string).
 */

export type MatchStatus   = 'scheduled' | 'in_progress' | 'finished';
export type PeriodStatus  = 'pending' | 'in_progress' | 'finished';

export interface Match {
  id:          string;
  phaseId:     string;
  homeTeamId:  string;
  awayTeamId:  string;
  scheduledAt: string | null;
  status:      MatchStatus;
  winnerId:    string | null;
  createdAt:   string;
  updatedAt:   string;
  // Enriched fields (joined by gateway or computed by frontend)
  homeTeamName?: string;
  awayTeamName?: string;
  homeScore?:    number | null;
  awayScore?:    number | null;
  round?:        string;
  venue?:        string;
}

export interface MatchPeriod {
  id:           string;
  matchId:      string;
  periodNumber: number;
  homeScore:    number;
  awayScore:    number;
  status:       PeriodStatus;
}

export interface MatchDetail {
  match:   Match;
  periods: MatchPeriod[];
}

export interface MatchCreateRequest {
  phaseId:     string;
  homeTeamId:  string;
  awayTeamId:  string;
  scheduledAt?: string | null;
}

export interface PeriodScoreRequest {
  homeScore: number;
  awayScore: number;
}

export interface VolleyballLineupSlot {
  position: 1 | 2 | 3 | 4 | 5 | 6;
  playerId: string;
}

export interface RegisterLineupRequest {
  teamId:    string;
  setNumber: number;
  lineup:    VolleyballLineupSlot[];
}

export interface RotateTeamRequest {
  teamId:    string;
  setNumber: number;
}

export interface SubstitutionRequest {
  teamId:       string;
  periodNumber: number;
  playerOutId:  string;
  playerInId:   string;
  minute?:      number | null;
}

export interface Substitution {
  id:           string;
  matchId:      string;
  teamId:       string;
  periodNumber: number;
  playerOutId:  string;
  playerInId:   string;
  minute:       number | null;
  createdAt:    string;
}
