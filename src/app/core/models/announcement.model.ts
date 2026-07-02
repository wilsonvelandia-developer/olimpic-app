/**
 * Announcement models — tournament-level or global notifications/announcements.
 * IDs are UUIDs (string).
 */

export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent';
export type AnnouncementStatus = 'draft' | 'published' | 'archived';

export interface Announcement {
  id:           string;
  tournamentId: string | null;
  title:        string;
  content:      string;
  priority:     AnnouncementPriority;
  status:       AnnouncementStatus;
  imageUrl:     string | null;
  authorId:     string;
  authorName:   string | null;
  publishedAt:  string | null;
  createdAt:    string;
  updatedAt:    string;
  /** Denormalized for display. */
  tournamentName?: string;
}

export interface AnnouncementCreateRequest {
  tournamentId?: string | null;
  title:         string;
  content:       string;
  priority?:     AnnouncementPriority;
  status?:       AnnouncementStatus;
  imageUrl?:     string | null;
}

export interface AnnouncementUpdateRequest {
  tournamentId?: string | null;
  title?:        string;
  content?:      string;
  priority?:     AnnouncementPriority;
  status?:       AnnouncementStatus;
  imageUrl?:     string | null;
}
