import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import type { Sport } from '../../core/models';
import type { PaginatedResponse } from '../../core/models';

export interface SportCreateRequest {
  name: string;
  slug: string;
  icon: string;
  playersPerTeam: number;
  rules: {
    scoringUnit: 'points' | 'sets' | 'goals' | 'games';
    periods: number;
    periodName: string;
    hasOvertime: boolean;
    hasPenalties: boolean;
  };
}

/**
 * Domain service for sport catalog management.
 * Sports are the master data that enable multi-sport tournament support.
 */
@Injectable({ providedIn: 'root' })
export class SportService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/sports';

  /** Returns all sports (no pagination — master catalog, bounded size). */
  getAll(): Observable<Sport[]> {
    return this.api.getPaginated<Sport>(this.basePath, { pageSize: 100 }).pipe(
      map((r) => r.data),
    );
  }

  /** Returns a single sport by ID. */
  getById(id: number): Observable<Sport> {
    return this.api.get<Sport>(`${this.basePath}/${id}`).pipe(map((r) => r.data));
  }

  /** Creates a new sport in the catalog. */
  create(payload: SportCreateRequest): Observable<Sport> {
    return this.api.post<Sport>(this.basePath, payload).pipe(map((r) => r.data));
  }

  /** Updates an existing sport. */
  update(id: number, payload: Partial<SportCreateRequest>): Observable<Sport> {
    return this.api.put<Sport>(`${this.basePath}/${id}`, payload).pipe(map((r) => r.data));
  }

  /** Deletes a sport. Only possible if no tournaments reference it. */
  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`).pipe(map(() => undefined));
  }
}
