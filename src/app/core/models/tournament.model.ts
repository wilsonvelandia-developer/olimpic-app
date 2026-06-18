/**
 * Tournament and Phase models — matches the backend tournaments service.
 * IDs are UUIDs (string).
 *
 * NOTE: TournamentFormat and the extra UI fields (category, startDate, endDate,
 * format, maxTeams) that don't exist in the backend are kept here as optional
 * so existing components compile without changes. The tournament service maps
 * them from the backend response where possible.
 */

export type TournamentStatus = 'draft' | 'active' | 'finished' | 'suspended' | 'cancelled' | 'archived';
export type PhaseFormat       = 'round_robin' | 'single_elim' | 'double_elim' | 'groups';
export type PhaseStatus       = 'pending' | 'active' | 'finished';

// TournamentFormat kept for the fixture generator and form components
export type TournamentFormat =
  | 'groups_knockout'
  | 'round_robin'
  | 'single_elimination'
  | 'double_elimination';

export interface Tournament {
  id:                    string;
  sportId:               string;
  name:                  string;
  season:                string | null;
  status:                TournamentStatus;
  maxSubsOverride:       number | null;
  startDate:             string | null;
  registrationDeadline:  string | null;
  expectedTeams:         number | null;
  numGroups:             number | null;
  category:              string | null;
  birthYearFrom:         string | null;
  validateBirthFrom:     boolean;
  birthYearTo:           string | null;
  validateBirthTo:       boolean;
  contactPhone:          string | null;
  address:               string | null;
  locationUrl:           string | null;
  imageUrl:              string | null;
  description:           string | null;
  entryFee:              string | null;
  rulesFileUrl:          string | null;
  invitationFileUrl:     string | null;
  instagramUrl:          string | null;
  facebookUrl:           string | null;
  tiktokUrl:             string | null;
  youtubeUrl:            string | null;
  // Fixture config
  matchDurationMinutes?: number;
  matchesPerDay?:        number;
  firstMatchTime?:       string;
  numVenues?:            number;
  venueName?:            string | null;
  // Standings config
  pointsConfig?:          { win: number; draw: number; loss: number };
  tiebreakerCriteria?:    string[];
  initialFairPlayScore?:  number;
  teamsPerGroupQualify?:  number;
  createdAt:             string;
  updatedAt:             string;
  // UI-only optional fields (not returned by backend)
  sport?:           { name: string };
  format?:          TournamentFormat;
}

export interface Phase {
  id:           string;
  tournamentId: string;
  name:         string;
  format:       PhaseFormat;
  orderIndex:   number;
  status:       PhaseStatus;
  createdAt:    string;
}

export interface TournamentCreateRequest {
  sportId:               string;
  name:                  string;
  season?:               string | null;
  maxSubsOverride?:      number | null;
  startDate?:            string | null;
  registrationDeadline?: string | null;
  expectedTeams?:        number | null;
  numGroups?:            number | null;
  category?:             string | null;
  birthYearFrom?:        string | null;
  validateBirthFrom?:    boolean;
  birthYearTo?:          string | null;
  validateBirthTo?:      boolean;
  contactPhone?:         string | null;
  address?:              string | null;
  locationUrl?:          string | null;
  imageUrl?:             string | null;
  description?:          string | null;
  entryFee?:             string | null;
  rulesFileUrl?:         string | null;
  invitationFileUrl?:    string | null;
  instagramUrl?:         string | null;
  facebookUrl?:          string | null;
  tiktokUrl?:            string | null;
  youtubeUrl?:           string | null;
}

export interface TournamentUpdateRequest extends Partial<TournamentCreateRequest> {
  status?: TournamentStatus;
}

export interface PhaseCreateRequest {
  name:       string;
  format:     PhaseFormat;
  orderIndex: number;
}

export interface PhaseUpdateRequest extends Partial<PhaseCreateRequest> {
  status?: PhaseStatus;
}

// ── Stats interfaces used by tournament-stats component ──────────────────────

export interface TournamentStatsData {
  totalMatches:     number;
  playedMatches:    number;
  pendingMatches:   number;
  totalGoals:       number;
  avgGoalsPerMatch: number;
  topScorer:        string | null;
  mostWins:         string | null;
}

// ── Standings entry used by standings-table component ────────────────────────

export interface StandingsEntry {
  position:       number;
  teamId:         string;
  teamName:       string;
  played:         number;
  won:            number;
  drawn:          number;
  lost:           number;
  goalsFor:       number;
  goalsAgainst:   number;
  goalDifference: number;
  points:         number;
  setsWon?:       number;
  setsLost?:      number;
}

/** Alias with extra display fields — same as StandingsEntry for now. */
export type StandingRow = StandingsEntry;
