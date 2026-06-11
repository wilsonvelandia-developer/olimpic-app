import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import type { ApiResponse } from '../models';
import { type AppRole, hasMinimumRole } from '../models/role.model';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: AppRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Manages authentication state and role-based access helpers.
 * JWT is handled via httpOnly cookies by the backend — never stored in localStorage.
 *
 * Role hierarchy: admin > editor > viewer
 * All role checks here are UI-level only — the backend must enforce them independently.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = environment.apiBaseUrl;

  private readonly _currentUser = signal<AuthUser | null>(null);

  readonly currentUser = this._currentUser.asReadonly();

  /** True when a user session is active. */
  readonly isAuthenticated$ = computed(() => this._currentUser() !== null);

  /** Current user's role, or null when not authenticated. */
  readonly currentRole = computed(() => this._currentUser()?.role ?? null);

  /** True when the current user is an admin. */
  readonly isAdmin = computed(() => this._currentUser()?.role === 'admin');

  /** True when the user can create and edit (admin or editor). */
  readonly canEdit = computed(() => {
    const role = this._currentUser()?.role;
    return role === 'admin' || role === 'editor';
  });

  /** True when the user can only read (viewer). */
  readonly isViewer = computed(() => this._currentUser()?.role === 'viewer');

  /**
   * Checks whether the current user has at least the given role.
   * Use this for fine-grained template checks.
   */
  hasRole(requiredRole: AppRole): boolean {
    const role = this._currentUser()?.role;
    if (!role) return false;
    return hasMinimumRole(role, requiredRole);
  }

  /**
   * Initiates a login request; the backend sets the httpOnly cookie on success.
   */
  login(credentials: LoginRequest): Observable<ApiResponse<AuthUser>> {
    return this.http
      .post<ApiResponse<AuthUser>>(`${this.baseUrl}/auth/login`, credentials, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          if (response.success) {
            this._currentUser.set(response.data);
          }
        }),
      );
  }

  /**
   * Clears the session cookie via the backend and resets local state.
   */
  logout(): Observable<ApiResponse<void>> {
    return this.http
      .post<ApiResponse<void>>(`${this.baseUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => {
          this._currentUser.set(null);
          this.router.navigate(['/auth/login']);
        }),
      );
  }

  /**
   * Restores the session from the backend using the existing httpOnly cookie.
   */
  restoreSession(): Observable<ApiResponse<AuthUser>> {
    return this.http
      .get<ApiResponse<AuthUser>>(`${this.baseUrl}/auth/me`, { withCredentials: true })
      .pipe(
        tap((response) => {
          if (response.success) {
            this._currentUser.set(response.data);
          }
        }),
      );
  }
}
