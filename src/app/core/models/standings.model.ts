/**
 * Raw standing as returned by the backend standings service.
 * Fields use the backend naming convention.
 */
export interface Standing {
  id:           string;
  phaseId:      string;
  teamId:       string;
  played:       number;
  wins:         number;
  draws:        number;
  losses:       number;
  points:       number;
  setsWon:      number;
  setsLost:     number;
  scoreFor:     number;
  scoreAgainst: number;
  updatedAt:    string;
}

/**
 * Re-export for backward compatibility with components.
 */
export type { StandingsEntry, StandingRow } from './tournament.model';
