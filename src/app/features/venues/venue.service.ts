import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import type { Venue, VenueCreateRequest, VenueUpdateRequest } from '../../core/models';
import type { PaginatedResponse } from '../../core/models';

export interface VenueFilters {
  search?:   string;
  city?:     string;
  status?:   string;
  page?:     number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class VenueService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/venues';

  /**
   * Fetches a paginated list of venues with optional filters.
   * @param filters - search, city, status, page, pageSize
   * @returns Observable with paginated venue list
   */
  getAll(filters?: VenueFilters): Observable<PaginatedResponse<Venue>> {
    const params: Record<string, string | number> = {};
    if (filters?.search)   params['search']   = filters.search;
    if (filters?.city)     params['city']     = filters.city;
    if (filters?.status)   params['status']   = filters.status;
    if (filters?.page)     params['page']     = filters.page;
    if (filters?.pageSize) params['pageSize'] = filters.pageSize ?? 10;
    return this.api.getPaginated<Venue>(this.basePath, params);
  }

  /**
   * Fetches a single venue by ID.
   * @param id - venue UUID
   * @returns Observable with venue data
   */
  getById(id: string): Observable<Venue> {
    return this.api.get<Venue>(`${this.basePath}/${id}`).pipe(map((r) => r.data));
  }

  /**
   * Creates a new venue.
   * @param payload - venue creation data
   * @returns Observable with created venue
   */
  create(payload: VenueCreateRequest): Observable<Venue> {
    return this.api.post<Venue>(this.basePath, payload).pipe(map((r) => r.data));
  }

  /**
   * Updates an existing venue.
   * @param id - venue UUID
   * @param payload - partial venue data to update
   * @returns Observable with updated venue
   */
  update(id: string, payload: VenueUpdateRequest): Observable<Venue> {
    return this.api.put<Venue>(`${this.basePath}/${id}`, payload).pipe(map((r) => r.data));
  }

  /**
   * Deletes a venue by ID.
   * @param id - venue UUID
   * @returns Observable completing on success
   */
  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`).pipe(map(() => undefined));
  }
}
