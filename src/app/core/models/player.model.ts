/**
 * Represents a player that can be assigned to a team.
 */
export interface Player {
  id: number;
  firstName: string;
  lastName: string;
  documentNumber: string;
  birthDate: string;
  nationality: string;
  position: string;
  jerseyNumber: number;
  teamId: number;
  isActive: boolean;
}

export interface PlayerCreateRequest {
  firstName: string;
  lastName: string;
  documentNumber: string;
  birthDate: string;
  nationality: string;
  position: string;
  jerseyNumber: number;
  teamId: number;
}
