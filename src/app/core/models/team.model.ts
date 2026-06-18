/**
 * Team and Player models — matches the backend teams service.
 * IDs are UUIDs (string).
 */

export type TeamStatus = 'active' | 'inactive' | 'suspended';

export interface Team {
  id:             string;
  tournamentId:   string | null;
  name:           string;
  shortName:      string | null;
  imageUrl:       string | null;
  phone:          string | null;
  email:          string | null;
  instagramUrl:   string | null;
  facebookUrl:    string | null;
  tiktokUrl:      string | null;
  youtubeUrl:     string | null;
  status:         TeamStatus;
  colorPrimary:   string | null;
  colorSecondary: string | null;
  variant:        string | null;
  createdAt:      string;
  updatedAt:      string;
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
  tournamentId?: string | null;
  name:          string;
  shortName?:    string | null;
  imageUrl?:     string | null;
  phone?:        string | null;
  email?:        string | null;
  instagramUrl?: string | null;
  facebookUrl?:  string | null;
  tiktokUrl?:    string | null;
  youtubeUrl?:   string | null;
  colorPrimary?: string | null;
  colorSecondary?: string | null;
  variant?:      string | null;
}

export interface TeamUpdateRequest {
  name?:           string;
  shortName?:      string | null;
  imageUrl?:       string | null;
  phone?:          string | null;
  email?:          string | null;
  instagramUrl?:   string | null;
  facebookUrl?:    string | null;
  tiktokUrl?:      string | null;
  youtubeUrl?:     string | null;
  status?:         TeamStatus;
  colorPrimary?:   string | null;
  colorSecondary?: string | null;
  variant?:        string | null;
}

export interface PlayerCreateRequest {
  name:         string;
  jerseyNumber: number;
  position?:    string | null;
}

export interface PlayerUpdateRequest extends Partial<PlayerCreateRequest> {
  isActive?: boolean;
}
