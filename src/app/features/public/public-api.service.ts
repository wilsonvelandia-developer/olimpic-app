import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Public API service — calls /public/* endpoints which don't require authentication.
 * Used by public views for spectators.
 */
@Injectable({ providedIn: 'root' })
export class PublicApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/public`;

  /**
   * GET request to public API.
   */
  get<T>(path: string): Observable<T> {
    return this.http
      .get<{ data: T; success: boolean }>(`${this.baseUrl}${path}`)
      .pipe(map((res) => res.data));
  }
}
