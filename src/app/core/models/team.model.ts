/**
 * Team and Player models — matches the backend teams service.
 * IDs are UUIDs (string).
 */

export interface Team {
  id:           string;
  tournamentId: string;
  name:         string;
  shortName:    string | null;
  imageUrl:     string | null;
  createdAt:    string;
  updatedAt:    string;
}

export interface Player {
  id:           string;
  teamId:       string;
  name:         string;
  jerseyNumber: number;
  position:     string | null;
  isActive:     boolean;
  createdAt:    string;
}

export interface TeamCreateRequest {
  tournamentId: string;
  name:         string;
  shortName?:   string | null;
}

export interface TeamUpdateRequest {
  name?:      string;
  shortName?: string | null;
}

export interface PlayerCreateRequest {
  name:         string;
  jerseyNumber: number;
  position?:    string | null;
}

export interface PlayerUpdateRequest extends Partial<PlayerCreateRequest> {
  isActive?: boolean;
}
