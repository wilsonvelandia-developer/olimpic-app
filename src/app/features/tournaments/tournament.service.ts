import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import type {
  Tournament,
  TournamentCreateRequest,
  TournamentUpdateRequest,
} from '../../core/models';
import type { PaginatedResponse } from '../../core/models';

export interface TournamentFilters {
  sportId?: number;
  status?: string;
  season?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Domain service for tournament management.
 * All HTTP calls go through ApiService — no direct HttpClient usage here.
 */
@Injectable({ providedIn: 'root' })
export class TournamentService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/tournaments';

  /**
   * Returns a paginated list of tournaments with optional filters.
   */
  getAll(filters?: TournamentFilters): Observable<PaginatedResponse<Tournament>> {
    const params: Record<string, string | number> = {};
    if (filters?.sportId) params['sportId'] = filters.sportId;
    if (filters?.status) params['status'] = filters.status;
    if (filters?.season) params['season'] = filters.season;
    if (filters?.page) params['page'] = filters.page;
    if (filters?.pageSize) params['pageSize'] = filters.pageSize ?? 10;

    return this.api.getPaginated<Tournament>(this.basePath, params);
  }

  /**
   * Returns a single tournament by ID.
   */
  getById(id: number): Observable<Tournament> {
    return this.api.get<Tournament>(`${this.basePath}/${id}`).pipe(
      map((response) => response.data),
    );
  }

  /**
   * Creates a new tournament.
   */
  create(payload: TournamentCreateRequest): Observable<Tournament> {
    return this.api.post<Tournament>(this.basePath, payload).pipe(
      map((response) => response.data),
    );
  }

  /**
   * Updates an existing tournament.
   */
  update(id: number, payload: TournamentUpdateRequest): Observable<Tournament> {
    return this.api.put<Tournament>(`${this.basePath}/${id}`, payload).pipe(
      map((response) => response.data),
    );
  }

  /**
   * Deletes a tournament by ID.
   */
  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`).pipe(
      map(() => undefined),
    );
  }
}
