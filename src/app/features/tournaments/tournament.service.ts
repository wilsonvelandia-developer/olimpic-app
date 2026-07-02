import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import type { Tournament, TournamentCreateRequest, TournamentUpdateRequest } from '../../core/models';
import type { PaginatedResponse } from '../../core/models';

export interface TournamentCup {
  id: string;
  name: string;
  orderIndex: number;
  groupPositionsFrom: number;
  groupPositionsTo: number;
  hasSemifinals: boolean;
  hasThirdPlace: boolean;
}

export interface TournamentCupPayload {
  name: string;
  orderIndex: number;
  groupPositionsFrom: number;
  groupPositionsTo: number;
  hasSemifinals: boolean;
  hasThirdPlace: boolean;
}

export interface SanctionType {
  id: string;
  name: string;
  code: string;
  pointsEffect: number;
  monetaryValue: number;
  color: string;
  icon: string;
}

export interface SanctionTypePayload {
  name: string;
  code: string;
  pointsEffect: number;
  monetaryValue: number;
  color: string;
  icon: string;
}

export interface StaffMember {
  userId: string;
  userName: string;
  email: string;
  staffRole: string;
  assignedAt: string;
}

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

  // ── Cups ──────────────────────────────────────────────────────────────────

  getCups(tournamentId: string): Observable<TournamentCup[]> {
    return this.api.get<TournamentCup[]>(`${this.basePath}/${tournamentId}/cups`)
      .pipe(map((r) => r.data));
  }

  saveCups(tournamentId: string, cups: TournamentCupPayload[]): Observable<TournamentCup[]> {
    return this.api.post<TournamentCup[]>(`${this.basePath}/${tournamentId}/cups`, cups)
      .pipe(map((r) => r.data));
  }

  // ── Sanction Types ────────────────────────────────────────────────────────

  getSanctionTypes(tournamentId: string): Observable<SanctionType[]> {
    return this.api.get<SanctionType[]>(`${this.basePath}/${tournamentId}/sanction-types`)
      .pipe(map((r) => r.data));
  }

  saveSanctionTypes(tournamentId: string, types: SanctionTypePayload[]): Observable<SanctionType[]> {
    return this.api.post<SanctionType[]>(`${this.basePath}/${tournamentId}/sanction-types`, types)
      .pipe(map((r) => r.data));
  }

  // ── Staff Management ──────────────────────────────────────────────────────

  getStaff(tournamentId: string, role?: string): Observable<StaffMember[]> {
    const path = role
      ? `${this.basePath}/${tournamentId}/staff?role=${role}`
      : `${this.basePath}/${tournamentId}/staff`;
    return this.api.get<StaffMember[]>(path).pipe(map((r) => r.data));
  }

  addStaff(tournamentId: string, userId: string, staffRole: string): Observable<StaffMember[]> {
    return this.api.post<StaffMember[]>(`${this.basePath}/${tournamentId}/staff`, { userId, staffRole })
      .pipe(map((r) => r.data));
  }

  removeStaff(tournamentId: string, userId: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${tournamentId}/staff/${userId}`)
      .pipe(map(() => undefined));
  }
}
