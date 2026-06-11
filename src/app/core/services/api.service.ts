import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiResponse, PaginatedResponse } from '../models';

/**
 * Base HTTP service for all API calls.
 * Provides typed wrappers around HttpClient for GET, POST, PUT, DELETE.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  get<T>(path: string, params?: Record<string, string | number>): Observable<ApiResponse<T>> {
    const httpParams = params
      ? new HttpParams({ fromObject: params as Record<string, string> })
      : undefined;
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}${path}`, { params: httpParams });
  }

  getPaginated<T>(
    path: string,
    params?: Record<string, string | number>,
  ): Observable<PaginatedResponse<T>> {
    const httpParams = params
      ? new HttpParams({ fromObject: params as Record<string, string> })
      : undefined;
    return this.http.get<PaginatedResponse<T>>(`${this.baseUrl}${path}`, { params: httpParams });
  }

  post<T>(path: string, body: unknown): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${path}`, body);
  }

  put<T>(path: string, body: unknown): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}${path}`, body);
  }

  patch<T>(path: string, body: unknown): Observable<ApiResponse<T>> {
    return this.http.patch<ApiResponse<T>>(`${this.baseUrl}${path}`, body);
  }

  delete<T>(path: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}${path}`);
  }
}
