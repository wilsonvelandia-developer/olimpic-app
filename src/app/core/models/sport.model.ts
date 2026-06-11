/**
 * Represents a sport supported by the platform.
 * New sports can be added by inserting records via the API.
 */
export interface Sport {
  id: number;
  name: string;
  slug: string;
  icon: string;
  /** Max players per team on the field */
  playersPerTeam: number;
  /** Configurable rules per sport (sets, periods, etc.) */
  rules: SportRules;
  isActive: boolean;
}

export interface SportRules {
  scoringUnit: 'points' | 'sets' | 'goals' | 'games';
  periods: number;
  periodName: string;
  hasOvertime: boolean;
  hasPenalties: boolean;
}
