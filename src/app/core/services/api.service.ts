import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiResponse, PaginatedResponse } from '../models';

type QueryParams = Record<string, string | number | boolean>;

/** Shape returned by paginated list endpoints. */
interface PagedApiResponse<T> extends ApiResponse<T[]> {
  total?:    number;
  page?:     number;
  pageSize?: number;
}

/**
 * Base HTTP service for all API calls.
 * Provides typed wrappers around HttpClient for GET, POST, PUT, PATCH, DELETE.
 * All paths are prepended with /api/ and the gateway base URL.
 *
 * The backend normalizes list responses to:
 *   { data: T[], total: number, page: number, pageSize: number, success, message }
 *
 * getPaginated reads the server-provided total so pagination is accurate.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /** All API paths go through /api/ prefix on the gateway. */
  private url(path: string): string {
    return `${this.baseUrl}/api${path}`;
  }

  private buildParams(params?: QueryParams): HttpParams | undefined {
    if (!params) return undefined;
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      httpParams = httpParams.set(k, String(v));
    });
    return httpParams;
  }

  get<T>(path: string, params?: QueryParams): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(this.url(path), {
      params: this.buildParams(params),
      withCredentials: true,
    });
  }

  /**
   * Fetches a paginated list endpoint.
   * Reads total/page/pageSize from the server response when available.
   * Falls back to items.length for legacy endpoints that don't return totals.
   */
  getPaginated<T>(path: string, params?: QueryParams): Observable<PaginatedResponse<T>> {
    return this.http
      .get<PagedApiResponse<T>>(this.url(path), {
        params: this.buildParams(params),
        withCredentials: true,
      })
      .pipe(
        map((response) => {
          const items    = response.data ?? [];
          const page     = response.page     ?? Number(params?.['page'] ?? 1);
          const pageSize = response.pageSize ?? Number(params?.['pageSize'] ?? (items.length || 10));
          // Use server-provided total (real pagination); fall back to items.length for legacy endpoints
          const total    = response.total ?? items.length;

          return {
            data:       items,
            total,
            page,
            pageSize,
            totalPages: Math.max(1, Math.ceil(total / pageSize)),
            success:    response.success ?? true,
            message:    response.message ?? '',
          };
        }),
      );
  }

  post<T>(path: string, body: unknown): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(this.url(path), body, {
      withCredentials: true,
    });
  }

  put<T>(path: string, body: unknown): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(this.url(path), body, {
      withCredentials: true,
    });
  }

  patch<T>(path: string, body: unknown): Observable<ApiResponse<T>> {
    return this.http.patch<ApiResponse<T>>(this.url(path), body, {
      withCredentials: true,
    });
  }

  delete<T>(path: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(this.url(path), {
      withCredentials: true,
    });
  }
}
