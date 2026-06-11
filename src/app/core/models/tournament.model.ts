import type { Sport } from './sport.model';

export type TournamentFormat =
  | 'groups_knockout'
  | 'round_robin'
  | 'single_elimination'
  | 'double_elimination';

export type TournamentStatus = 'draft' | 'upcoming' | 'in_progress' | 'completed' | 'cancelled';

/**
 * Represents a tournament for any supported sport.
 */
export interface Tournament {
  id: number;
  name: string;
  sportId: number;
  sport?: Sport;
  format: TournamentFormat;
  status: TournamentStatus;
  category: string;
  season: string;
  startDate: string;
  endDate: string;
  maxTeams: number;
  createdAt: string;
  updatedAt: string;
}

export interface TournamentCreateRequest {
  name: string;
  sportId: number;
  format: TournamentFormat;
  category: string;
  season: string;
  startDate: string;
  endDate: string;
  maxTeams: number;
}

export interface TournamentUpdateRequest extends Partial<TournamentCreateRequest> {
  status?: TournamentStatus;
}
