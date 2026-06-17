import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import type { Player, PlayerCreateRequest, PlayerUpdateRequest } from '../../core/models';
import type { PaginatedResponse } from '../../core/models';

export interface PlayerFilters {
  teamId?:   string;
  search?:   string;
  isActive?: boolean;
  page?:     number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private readonly api = inject(ApiService);

  /** Players are nested under teams — /teams/:teamId/players */
  getAllByTeam(teamId: string, filters?: PlayerFilters): Observable<PaginatedResponse<Player>> {
    const params: Record<string, string | number> = {};
    if (filters?.search)                   params['search']   = filters.search;
    if (filters?.isActive !== undefined)   params['isActive'] = String(filters.isActive);
    if (filters?.page)                     params['page']     = filters.page;
    if (filters?.pageSize)                 params['pageSize'] = filters.pageSize ?? 10;
    return this.api.getPaginated<Player>(`/teams/${teamId}/players`, params);
  }

  /** Fallback for list pages that don't scope to a team. */
  getAll(filters?: PlayerFilters): Observable<PaginatedResponse<Player>> {
    if (filters?.teamId) return this.getAllByTeam(filters.teamId, filters);
    // Backend doesn't expose /players directly — return empty when no teamId
    return new Observable((obs) => {
      obs.next({ data: [], total: 0, page: 1, pageSize: 10, totalPages: 0, success: true, message: '' });
      obs.complete();
    });
  }

  getById(teamId: string, playerId: string): Observable<Player> {
    return this.api.get<Player>(`/teams/${teamId}/players/${playerId}`).pipe(map((r) => r.data));
  }

  create(teamId: string, payload: PlayerCreateRequest): Observable<Player> {
    return this.api.post<Player>(`/teams/${teamId}/players`, payload).pipe(map((r) => r.data));
  }

  update(teamId: string, playerId: string, payload: PlayerUpdateRequest): Observable<Player> {
    return this.api.put<Player>(`/teams/${teamId}/players/${playerId}`, payload).pipe(map((r) => r.data));
  }

  delete(teamId: string, playerId: string): Observable<void> {
    return this.api.delete<void>(`/teams/${teamId}/players/${playerId}`).pipe(map(() => undefined));
  }
}
