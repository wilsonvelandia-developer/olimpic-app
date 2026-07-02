import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import type { Announcement, AnnouncementCreateRequest, AnnouncementUpdateRequest } from '../../core/models';
import type { PaginatedResponse } from '../../core/models';

export interface AnnouncementFilters {
  tournamentId?: string;
  priority?:     string;
  status?:       string;
  search?:       string;
  page?:         number;
  pageSize?:     number;
}

@Injectable({ providedIn: 'root' })
export class AnnouncementService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/announcements';

  /**
   * Fetches a paginated list of announcements with optional filters.
   * @param filters - tournamentId, priority, status, search, page, pageSize
   * @returns Observable with paginated announcement list
   */
  getAll(filters?: AnnouncementFilters): Observable<PaginatedResponse<Announcement>> {
    const params: Record<string, string | number> = {};
    if (filters?.tournamentId) params['tournamentId'] = filters.tournamentId;
    if (filters?.priority)     params['priority']     = filters.priority;
    if (filters?.status)       params['status']       = filters.status;
    if (filters?.search)       params['search']       = filters.search;
    if (filters?.page)         params['page']         = filters.page;
    if (filters?.pageSize)     params['pageSize']     = filters.pageSize ?? 10;
    return this.api.getPaginated<Announcement>(this.basePath, params);
  }

  /**
   * Fetches a single announcement by ID.
   * @param id - announcement UUID
   * @returns Observable with announcement data
   */
  getById(id: string): Observable<Announcement> {
    return this.api.get<Announcement>(`${this.basePath}/${id}`).pipe(map((r) => r.data));
  }

  /**
   * Creates a new announcement.
   * @param payload - announcement creation data
   * @returns Observable with created announcement
   */
  create(payload: AnnouncementCreateRequest): Observable<Announcement> {
    return this.api.post<Announcement>(this.basePath, payload).pipe(map((r) => r.data));
  }

  /**
   * Updates an existing announcement.
   * @param id - announcement UUID
   * @param payload - partial announcement data to update
   * @returns Observable with updated announcement
   */
  update(id: string, payload: AnnouncementUpdateRequest): Observable<Announcement> {
    return this.api.put<Announcement>(`${this.basePath}/${id}`, payload).pipe(map((r) => r.data));
  }

  /**
   * Deletes an announcement by ID.
   * @param id - announcement UUID
   * @returns Observable completing on success
   */
  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`).pipe(map(() => undefined));
  }
}
