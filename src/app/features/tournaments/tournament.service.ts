import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import type { Tournament, TournamentCreateRequest, TournamentUpdateRequest } from '../../core/models';
import type { PaginatedResponse } from '../../core/models';

export interface TournamentFilters {
  sportId?:  string;
  status?:   string;
  season?:   string;
  page?:     number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class TournamentService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/tournaments';

  getAll(filters?: TournamentFilters): Observable<PaginatedResponse<Tournament>> {
    const params: Record<string, string | number> = {};
    if (filters?.sportId)   params['sportId']  = filters.sportId;
    if (filters?.status)    params['status']   = filters.status;
    if (filters?.season)    params['season']   = filters.season;
    if (filters?.page)      params['page']     = filters.page;
    if (filters?.pageSize)  params['pageSize'] = filters.pageSize ?? 10;
    return this.api.getPaginated<Tournament>(this.basePath, params);
  }

  getById(id: string): Observable<Tournament> {
    return this.api.get<Tournament>(`${this.basePath}/${id}`).pipe(map((r) => r.data));
  }

  getPhases(id: string): Observable<import('../../core/models').Phase[]> {
    return this.api.get<import('../../core/models').Phase[]>(`${this.basePath}/${id}/phases`)
      .pipe(map((r) => r.data));
  }

  create(payload: TournamentCreateRequest): Observable<Tournament> {
    return this.api.post<Tournament>(this.basePath, payload).pipe(map((r) => r.data));
  }

  update(id: string, payload: TournamentUpdateRequest): Observable<Tournament> {
    // Send all defined fields — the backend handles partial updates
    return this.api.put<Tournament>(`${this.basePath}/${id}`, payload).pipe(map((r) => r.data));
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`).pipe(map(() => undefined));
  }
}
