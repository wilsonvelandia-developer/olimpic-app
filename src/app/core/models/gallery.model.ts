/**
 * Gallery models — photo/video albums for tournaments and matches.
 * IDs are UUIDs (string).
 */

export type GalleryItemType = 'photo' | 'video';

export interface GalleryAlbum {
  id:           string;
  tournamentId: string | null;
  matchId:      string | null;
  title:        string;
  description:  string | null;
  coverUrl:     string | null;
  itemCount:    number;
  createdAt:    string;
  updatedAt:    string;
  /** Denormalized for display. */
  tournamentName?: string;
}

export interface GalleryItem {
  id:        string;
  albumId:   string;
  type:      GalleryItemType;
  url:       string;
  thumbnail: string | null;
  caption:   string | null;
  sortOrder: number;
  createdAt: string;
}

export interface GalleryAlbumCreateRequest {
  tournamentId?: string | null;
  matchId?:      string | null;
  title:         string;
  description?:  string | null;
  coverUrl?:     string | null;
}

export interface GalleryAlbumUpdateRequest {
  title?:       string;
  description?: string | null;
  coverUrl?:    string | null;
}

export interface GalleryItemCreateRequest {
  type:      GalleryItemType;
  url:       string;
  thumbnail?: string | null;
  caption?:  string | null;
  sortOrder?: number;
}
