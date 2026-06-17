import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import type { Match, MatchCreateRequest, PeriodScoreRequest, MatchDetail } from '../../core/models';
import type { PaginatedResponse } from '../../core/models';

export interface MatchFilters {
  phaseId?:  string;
  teamId?:   string;
  status?:   string;
  page?:     number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class MatchService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/matches';

  getAll(filters?: MatchFilters): Observable<PaginatedResponse<Match>> {
    const params: Record<string, string | number> = {};
    if (filters?.phaseId)  params['phaseId']  = filters.phaseId;
    if (filters?.teamId)   params['teamId']   = filters.teamId;
    if (filters?.status)   params['status']   = filters.status;
    if (filters?.page)     params['page']     = filters.page;
    if (filters?.pageSize) params['pageSize'] = filters.pageSize ?? 10;
    return this.api.getPaginated<Match>(this.basePath, params);
  }

  getById(id: string): Observable<MatchDetail> {
    return this.api.get<MatchDetail>(`${this.basePath}/${id}`).pipe(map((r) => r.data));
  }

  create(payload: MatchCreateRequest): Observable<Match> {
    return this.api.post<Match>(this.basePath, payload).pipe(map((r) => r.data));
  }

  start(id: string): Observable<MatchDetail> {
    return this.api.put<MatchDetail>(`${this.basePath}/${id}/start`, {}).pipe(map((r) => r.data));
  }

  finish(id: string): Observable<MatchDetail> {
    return this.api.put<MatchDetail>(`${this.basePath}/${id}/finish`, {}).pipe(map((r) => r.data));
  }

  updatePeriodScore(id: string, periodNumber: number, dto: PeriodScoreRequest): Observable<MatchDetail> {
    return this.api
      .put<MatchDetail>(`${this.basePath}/${id}/periods/${periodNumber}/score`, dto)
      .pipe(map((r) => r.data));
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`).pipe(map(() => undefined));
  }
}
