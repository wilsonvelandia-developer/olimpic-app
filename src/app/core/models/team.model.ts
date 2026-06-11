/**
 * Represents a team registered in the platform.
 */
export interface Team {
  id: number;
  name: string;
  shortName: string;
  logoUrl: string;
  city: string;
  isActive: boolean;
  createdAt: string;
}

export interface TeamCreateRequest {
  name: string;
  shortName: string;
  logoUrl?: string;
  city: string;
}
