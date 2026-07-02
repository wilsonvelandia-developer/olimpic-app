/**
 * Venue models — represents physical locations where matches are played.
 * IDs are UUIDs (string).
 */

export type VenueStatus = 'active' | 'inactive' | 'maintenance';

export interface Venue {
  id:          string;
  name:        string;
  address:     string;
  city:        string;
  capacity:    number | null;
  imageUrl:    string | null;
  phone:       string | null;
  email:       string | null;
  mapUrl:      string | null;
  description: string | null;
  status:      VenueStatus;
  createdAt:   string;
  updatedAt:   string;
}

export interface VenueCreateRequest {
  name:         string;
  address:      string;
  city:         string;
  capacity?:    number | null;
  imageUrl?:    string | null;
  phone?:       string | null;
  email?:       string | null;
  mapUrl?:      string | null;
  description?: string | null;
}

export interface VenueUpdateRequest {
  name?:        string;
  address?:     string;
  city?:        string;
  capacity?:    number | null;
  imageUrl?:    string | null;
  phone?:       string | null;
  email?:       string | null;
  mapUrl?:      string | null;
  description?: string | null;
  status?:      VenueStatus;
}
