import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../core/services/api.service';
import type { ApiResponse } from '../../core/models';

export interface AppUser {
  id:               string;
  email:            string;
  name:             string;
  firstName:        string | null;
  secondName:       string | null;
  firstLastName:    string | null;
  secondLastName:   string | null;
  documentType:     string | null;
  documentNumber:   string | null;
  birthDate:        string | null;
  phone:            string | null;
  photoUrl:         string | null;
  avatarUrl:        string | null;
  documentFrontUrl: string | null;
  documentBackUrl:  string | null;
  epsFileUrl:       string | null;
  isActive:         boolean;
  roles:            string[];
  createdAt?:       string;
  updatedAt?:       string;
}

export interface CreateUserRequest {
  email:            string;
  password:         string;
  firstName:        string;
  secondName?:      string | null;
  firstLastName:    string;
  secondLastName?:  string | null;
  documentType?:    string | null;
  documentNumber?:  string | null;
  birthDate?:       string | null;
  phone?:           string | null;
  photoUrl?:        string | null;
  documentFrontUrl?: string | null;
  documentBackUrl?:  string | null;
  epsFileUrl?:       string | null;
  roles:            string[];
}

export interface UpdateUserRequest {
  firstName?:        string;
  secondName?:       string | null;
  firstLastName?:    string;
  secondLastName?:   string | null;
  email?:            string;
  documentType?:     string | null;
  documentNumber?:   string | null;
  birthDate?:        string | null;
  phone?:            string | null;
  photoUrl?:         string | null;
  documentFrontUrl?: string | null;
  documentBackUrl?:  string | null;
  epsFileUrl?:       string | null;
  roles?:            string[];
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

  /** List all users. */
  getAll(): Observable<AppUser[]> {
    return this.http
      .get<{ data: AppUser[]; success: boolean }>(`${this.baseUrl}/api/users`, { withCredentials: true })
      .pipe(map((r) => r.data ?? []));
  }

  /** Get a single user by ID. */
  getById(id: string): Observable<AppUser> {
    return this.http
      .get<ApiResponse<AppUser>>(`${this.baseUrl}/api/users/${id}`, { withCredentials: true })
      .pipe(map((r) => r.data));
  }

  /** Register a new user via /auth/register. */
  register(payload: CreateUserRequest): Observable<AppUser> {
    return this.http
      .post<ApiResponse<AppUser>>(`${this.baseUrl}/auth/register`, payload, { withCredentials: true })
      .pipe(map((r) => r.data));
  }

  /** Update an existing user. */
  update(id: string, payload: UpdateUserRequest): Observable<AppUser> {
    return this.http
      .put<ApiResponse<AppUser>>(`${this.baseUrl}/api/users/${id}`, payload, { withCredentials: true })
      .pipe(map((r) => r.data));
  }

  /** Soft-delete (deactivate) a user. */
  delete(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.baseUrl}/api/users/${id}`, { withCredentials: true })
      .pipe(map(() => undefined));
  }

  /** Get all roles catalog. */
  getRoles(): Observable<RoleCatalog[]> {
    return this.api.get<RoleCatalog[]>('/roles').pipe(map((r) => r.data));
  }
}
