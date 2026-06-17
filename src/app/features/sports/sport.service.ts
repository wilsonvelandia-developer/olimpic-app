import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import type { Sport, SportCreateRequest, SportUpdateRequest } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class SportService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/sports';

  getAll(): Observable<Sport[]> {
    return this.api.getPaginated<Sport>(this.basePath, { pageSize: 100 }).pipe(map((r) => r.data));
  }

  getById(id: string): Observable<Sport> {
    return this.api.get<Sport>(`${this.basePath}/${id}`).pipe(map((r) => r.data));
  }

  create(payload: SportCreateRequest): Observable<Sport> {
    return this.api.post<Sport>(this.basePath, payload).pipe(map((r) => r.data));
  }

  update(id: string, payload: SportUpdateRequest): Observable<Sport> {
    return this.api.put<Sport>(`${this.basePath}/${id}`, payload).pipe(map((r) => r.data));
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`).pipe(map(() => undefined));
  }
}
