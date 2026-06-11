import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import type { Player, PlayerCreateRequest } from '../../core/models';
import type { PaginatedResponse } from '../../core/models';

export interface PlayerFilters {
  teamId?: number;
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * Domain service for player management.
 */
@Injectable({ providedIn: 'root' })
export class PlayerService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/players';

  /** Returns a paginated list of players with optional filters. */
  getAll(filters?: PlayerFilters): Observable<PaginatedResponse<Player>> {
    const params: Record<string, string | number> = {};
    if (filters?.teamId) params['teamId'] = filters.teamId;
    if (filters?.search) params['search'] = filters.search;
    if (filters?.isActive !== undefined) params['isActive'] = String(filters.isActive);
    if (filters?.page) params['page'] = filters.page;
    if (filters?.pageSize) params['pageSize'] = filters.pageSize ?? 10;
    return this.api.getPaginated<Player>(this.basePath, params);
  }

  /** Returns a single player by ID. */
  getById(id: number): Observable<Player> {
    return this.api.get<Player>(`${this.basePath}/${id}`).pipe(map((r) => r.data));
  }

  /** Creates a new player. */
  create(payload: PlayerCreateRequest): Observable<Player> {
    return this.api.post<Player>(this.basePath, payload).pipe(map((r) => r.data));
  }

  /** Updates an existing player. */
  update(id: number, payload: Partial<PlayerCreateRequest>): Observable<Player> {
    return this.api.put<Player>(`${this.basePath}/${id}`, payload).pipe(map((r) => r.data));
  }

  /** Deletes a player by ID. */
  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`).pipe(map(() => undefined));
  }
}
