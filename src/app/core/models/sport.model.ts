/**
 * Sport model — matches the backend sports service response.
 */
export interface Sport {
  id:                string;
  name:              string;
  slug:              string;
  playersPerTeam:    number;
  hasSets:           boolean;
  setsToWin:         number | null;
  pointsPerSet:      number | null;
  decisiveSetPoints: number | null;
  winMargin:         number;
  periodsPerMatch:   number;
  maxSubstitutions:  number | null;
  hasRotation:       boolean;
  iconUrl:           string | null;
  createdAt:         string;
  updatedAt:         string;
}

/** Default placeholder image when no iconUrl is set. */
export const SPORT_DEFAULT_ICON = 'https://img.icons8.com/color/96/sports-mode.png';

export interface SportCreateRequest {
  name:               string;
  slug:               string;
  playersPerTeam:     number;
  hasSets:            boolean;
  setsToWin?:         number | null;
  pointsPerSet?:      number | null;
  decisiveSetPoints?: number | null;
  winMargin?:         number;
  periodsPerMatch?:   number;
  maxSubstitutions?:  number | null;
  hasRotation?:       boolean;
  iconUrl?:           string | null;
}

export type SportUpdateRequest = Partial<SportCreateRequest>;
