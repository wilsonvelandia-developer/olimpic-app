import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../core/services/api.service';
import type { ApiResponse, PaginatedResponse } from '../../core/models';

export interface AppUser {
  id:        string;
  email:     string;
  name:      string;
  phone:     string | null;
  avatarUrl: string | null;
  roles:     string[];
}

export interface CreateUserRequest {
  email:          string;
  password:       string;
  name:           string;
  documentNumber?: string | null;
  phone?:         string | null;
  roles:          string[];
}

export interface RoleCatalog {
  id:              string;
  name:            string;
  description:     string;
  canCreateUsers:  boolean;
  isReadOnly:      boolean;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly api  = inject(ApiService);
  private readonly baseUrl = environment.apiBaseUrl;

  /** Register a new user via /auth/register. */
  register(payload: CreateUserRequest): Observable<AppUser> {
    return this.http
      .post<ApiResponse<AppUser>>(`${this.baseUrl}/auth/register`, payload, { withCredentials: true })
      .pipe(map((r) => r.data));
  }

  /** Get all roles catalog. */
  getRoles(): Observable<RoleCatalog[]> {
    return this.api.get<RoleCatalog[]>('/roles').pipe(map((r) => r.data));
  }
}
