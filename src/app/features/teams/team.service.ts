import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import type { Team, TeamCreateRequest } from '../../core/models';
import type { PaginatedResponse } from '../../core/models';

export interface TeamFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * Domain service for team management.
 */
@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/teams';

  /** Returns a paginated list of teams with optional filters. */
  getAll(filters?: TeamFilters): Observable<PaginatedResponse<Team>> {
    const params: Record<string, string | number> = {};
    if (filters?.search) params['search'] = filters.search;
    if (filters?.isActive !== undefined) params['isActive'] = String(filters.isActive);
    if (filters?.page) params['page'] = filters.page;
    if (filters?.pageSize) params['pageSize'] = filters.pageSize ?? 10;
    return this.api.getPaginated<Team>(this.basePath, params);
  }

  /** Returns a single team by ID. */
  getById(id: number): Observable<Team> {
    return this.api.get<Team>(`${this.basePath}/${id}`).pipe(map((r) => r.data));
  }

  /** Creates a new team. */
  create(payload: TeamCreateRequest): Observable<Team> {
    return this.api.post<Team>(this.basePath, payload).pipe(map((r) => r.data));
  }

  /** Updates an existing team. */
  update(id: number, payload: Partial<TeamCreateRequest>): Observable<Team> {
    return this.api.put<Team>(`${this.basePath}/${id}`, payload).pipe(map((r) => r.data));
  }

  /** Deletes a team by ID. */
  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`).pipe(map(() => undefined));
  }
}
