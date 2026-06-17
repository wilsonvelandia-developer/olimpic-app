import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import type { Team, TeamCreateRequest, TeamUpdateRequest, Player, PlayerCreateRequest, PlayerUpdateRequest } from '../../core/models';
import type { PaginatedResponse } from '../../core/models';

export interface TeamFilters {
  tournamentId?: string;
  search?:       string;
  page?:         number;
  pageSize?:     number;
}

export interface PlayerFilters {
  teamId?:   string;
  search?:   string;
  isActive?: boolean;
  page?:     number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/teams';

  getAll(filters?: TeamFilters): Observable<PaginatedResponse<Team>> {
    const params: Record<string, string | number> = {};
    if (filters?.tournamentId) params['tournamentId'] = filters.tournamentId;
    if (filters?.search)       params['search']       = filters.search;
    if (filters?.page)         params['page']         = filters.page;
    if (filters?.pageSize)     params['pageSize']      = filters.pageSize ?? 10;
    return this.api.getPaginated<Team>(this.basePath, params);
  }

  getById(id: string): Observable<Team> {
    return this.api.get<Team>(`${this.basePath}/${id}`).pipe(map((r) => r.data));
  }

  create(payload: TeamCreateRequest): Observable<Team> {
    return this.api.post<Team>(this.basePath, payload).pipe(map((r) => r.data));
  }

  update(id: string, payload: TeamUpdateRequest): Observable<Team> {
    return this.api.put<Team>(`${this.basePath}/${id}`, payload).pipe(map((r) => r.data));
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`).pipe(map(() => undefined));
  }

  // ── Players (nested) ──────────────────────────────────────────────────────

  getPlayers(teamId: string, filters?: PlayerFilters): Observable<PaginatedResponse<Player>> {
    const params: Record<string, string | number> = {};
    if (filters?.search)                     params['search']   = filters.search;
    if (filters?.isActive !== undefined)     params['isActive'] = String(filters.isActive);
    if (filters?.page)                       params['page']     = filters.page;
    if (filters?.pageSize)                   params['pageSize'] = filters.pageSize ?? 10;
    return this.api.getPaginated<Player>(`${this.basePath}/${teamId}/players`, params);
  }

  getPlayerById(teamId: string, playerId: string): Observable<Player> {
    return this.api.get<Player>(`${this.basePath}/${teamId}/players/${playerId}`)
      .pipe(map((r) => r.data));
  }

  createPlayer(teamId: string, payload: PlayerCreateRequest): Observable<Player> {
    return this.api.post<Player>(`${this.basePath}/${teamId}/players`, payload)
      .pipe(map((r) => r.data));
  }

  updatePlayer(teamId: string, playerId: string, payload: PlayerUpdateRequest): Observable<Player> {
    return this.api.put<Player>(`${this.basePath}/${teamId}/players/${playerId}`, payload)
      .pipe(map((r) => r.data));
  }

  deletePlayer(teamId: string, playerId: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${teamId}/players/${playerId}`)
      .pipe(map(() => undefined));
  }
}
