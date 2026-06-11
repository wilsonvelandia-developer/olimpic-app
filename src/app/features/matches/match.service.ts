import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import type { Match, MatchResultRequest } from '../../core/models';
import type { PaginatedResponse } from '../../core/models';

export interface MatchFilters {
  tournamentId?: number;
  status?: string;
  round?: string;
  page?: number;
  pageSize?: number;
}

export interface MatchCreateRequest {
  tournamentId: number;
  homeTeamId: number;
  awayTeamId: number;
  scheduledAt: string;
  round: string;
  venue: string;
}

/**
 * Domain service for match management.
 * Handles scheduling, result registration, and status transitions.
 */
@Injectable({ providedIn: 'root' })
export class MatchService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/matches';

  /** Returns a paginated list of matches with optional filters. */
  getAll(filters?: MatchFilters): Observable<PaginatedResponse<Match>> {
    const params: Record<string, string | number> = {};
    if (filters?.tournamentId) params['tournamentId'] = filters.tournamentId;
    if (filters?.status) params['status'] = filters.status;
    if (filters?.round) params['round'] = filters.round;
    if (filters?.page) params['page'] = filters.page;
    if (filters?.pageSize) params['pageSize'] = filters.pageSize ?? 10;
    return this.api.getPaginated<Match>(this.basePath, params);
  }

  /** Returns a single match by ID. */
  getById(id: number): Observable<Match> {
    return this.api.get<Match>(`${this.basePath}/${id}`).pipe(map((r) => r.data));
  }

  /** Schedules a new match. */
  create(payload: MatchCreateRequest): Observable<Match> {
    return this.api.post<Match>(this.basePath, payload).pipe(map((r) => r.data));
  }

  /** Registers the result of a played match. */
  registerResult(id: number, result: MatchResultRequest): Observable<Match> {
    return this.api
      .patch<Match>(`${this.basePath}/${id}/result`, result)
      .pipe(map((r) => r.data));
  }

  /** Updates match scheduling data (date, venue, round). */
  update(id: number, payload: Partial<MatchCreateRequest>): Observable<Match> {
    return this.api.put<Match>(`${this.basePath}/${id}`, payload).pipe(map((r) => r.data));
  }

  /** Deletes a match by ID. */
  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`).pipe(map(() => undefined));
  }
}
