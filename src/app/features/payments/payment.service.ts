import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import type { Payment, PaymentCreateRequest, PaymentUpdateRequest } from '../../core/models';
import type { PaginatedResponse } from '../../core/models';

export interface PaymentFilters {
  tournamentId?: string;
  teamId?:       string;
  status?:       string;
  search?:       string;
  page?:         number;
  pageSize?:     number;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/payments';

  /**
   * Fetches a paginated list of payments with optional filters.
   * @param filters - tournamentId, teamId, status, search, page, pageSize
   * @returns Observable with paginated payment list
   */
  getAll(filters?: PaymentFilters): Observable<PaginatedResponse<Payment>> {
    const params: Record<string, string | number> = {};
    if (filters?.tournamentId) params['tournamentId'] = filters.tournamentId;
    if (filters?.teamId)       params['teamId']       = filters.teamId;
    if (filters?.status)       params['status']       = filters.status;
    if (filters?.search)       params['search']       = filters.search;
    if (filters?.page)         params['page']         = filters.page;
    if (filters?.pageSize)     params['pageSize']     = filters.pageSize ?? 10;
    return this.api.getPaginated<Payment>(this.basePath, params);
  }

  /**
   * Fetches a single payment by ID.
   * @param id - payment UUID
   * @returns Observable with payment data
   */
  getById(id: string): Observable<Payment> {
    return this.api.get<Payment>(`${this.basePath}/${id}`).pipe(map((r) => r.data));
  }

  /**
   * Creates a new payment record.
   * @param payload - payment creation data
   * @returns Observable with created payment
   */
  create(payload: PaymentCreateRequest): Observable<Payment> {
    return this.api.post<Payment>(this.basePath, payload).pipe(map((r) => r.data));
  }

  /**
   * Updates an existing payment record.
   * @param id - payment UUID
   * @param payload - partial payment data to update
   * @returns Observable with updated payment
   */
  update(id: string, payload: PaymentUpdateRequest): Observable<Payment> {
    return this.api.put<Payment>(`${this.basePath}/${id}`, payload).pipe(map((r) => r.data));
  }

  /**
   * Deletes a payment by ID.
   * @param id - payment UUID
   * @returns Observable completing on success
   */
  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`).pipe(map(() => undefined));
  }
}
