import type { TournamentFormat } from '../../../core/models';

/**
 * A team entry used for fixture generation.
 * The fixture generator only needs id and name — it doesn't require
 * the full Team model to keep the dependency lightweight.
 */
export interface FixtureTeam {
  id: number;
  name: string;
}

/**
 * Configuration inputs provided by the user to generate a fixture.
 */
export interface FixtureConfig {
  tournamentId: number;
  format: TournamentFormat;
  teams: FixtureTeam[];
  startDate: string;       // ISO date string YYYY-MM-DD
  daysBetweenRounds: number;
  venue: string;
  twoLegs: boolean;        // applies to round_robin only
}

/**
 * A generated match slot — not yet persisted to the API.
 */
export interface FixtureSlot {
  round: string;
  homeTeamId: number;
  homeTeamName: string;
  awayTeamId: number;
  awayTeamName: string;
  scheduledAt: string;     // ISO datetime
  venue: string;
}
