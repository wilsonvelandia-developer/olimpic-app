import type { TournamentFormat } from '../../../core/models';

/** A team entry used only for fixture generation (lightweight). */
export interface FixtureTeam {
  id:   string;   // UUID
  name: string;
}

/** Configuration inputs for the fixture generation algorithm. */
export interface FixtureConfig {
  tournamentId:      string;   // UUID
  format:            TournamentFormat;
  teams:             FixtureTeam[];
  startDate:         string;   // YYYY-MM-DD
  daysBetweenRounds: number;
  venue:             string;
  twoLegs:           boolean;
}

/** A generated match slot — not yet persisted. */
export interface FixtureSlot {
  round:        string;
  homeTeamId:   string;   // UUID
  homeTeamName: string;
  awayTeamId:   string;   // UUID
  awayTeamName: string;
  scheduledAt:  string;   // ISO datetime
  venue:        string;
}
