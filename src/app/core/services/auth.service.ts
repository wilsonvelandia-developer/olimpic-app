import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import type { ApiResponse } from '../models';
import {
  type AppRole,
  hasMinimumRole,
  getHighestRole,
  READ_ONLY_ROLES,
  TEAM_MANAGEMENT_ROLES,
  MATCH_MANAGEMENT_ROLES,
} from '../models/role.model';

export interface AuthUser {
  id:        string;
  name:      string;
  email:     string;
  phone:     string | null;
  avatarUrl: string | null;
  roles:     AppRole[];
}

export interface LoginRequest {
  email:    string;
  password: string;
}

/**
 * Manages authentication state.
 * JWT is handled via httpOnly cookies — never stored in localStorage.
 * Roles are an array — a user can have multiple roles simultaneously.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http   = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = environment.apiBaseUrl;

  private readonly _currentUser = signal<AuthUser | null>(null);

  readonly currentUser     = this._currentUser.asReadonly();
  readonly isAuthenticated$ = computed(() => this._currentUser() !== null);

  /** The user's highest-privilege role. */
  readonly primaryRole = computed<AppRole | null>(() => {
    const user = this._currentUser();
    return user ? getHighestRole(user.roles) : null;
  });

  readonly isAdmin     = computed(() => this._currentUser()?.roles.includes('admin') ?? false);
  readonly isOrganizer = computed(() => {
    const roles = this._currentUser()?.roles ?? [];
    return roles.includes('admin') || roles.includes('organizer');
  });
  readonly isReferee   = computed(() => {
    const roles = this._currentUser()?.roles ?? [];
    return roles.includes('admin') || roles.includes('referee');
  });

  /** True when the user can create and edit (not read-only). */
  readonly canEdit = computed(() => {
    const role = this.primaryRole();
    return role !== null && !READ_ONLY_ROLES.includes(role);
  });

  /** True when the user can manage teams (create/edit/delete). */
  readonly canManageTeams = computed(() => {
    const roles = this._currentUser()?.roles ?? [];
    return roles.some((r) => TEAM_MANAGEMENT_ROLES.includes(r));
  });

  /** True when the user can manage match events (referee, admin). */
  readonly canManageMatches = computed(() => {
    const roles = this._currentUser()?.roles ?? [];
    return roles.some((r) => MATCH_MANAGEMENT_ROLES.includes(r));
  });

  /**
   * Checks whether the current user has at least the given role level.
   */
  hasRole(requiredRole: AppRole): boolean {
    const role = this.primaryRole();
    if (!role) return false;
    return hasMinimumRole(role, requiredRole);
  }

  login(credentials: LoginRequest): Observable<ApiResponse<AuthUser>> {
    return this.http
      .post<ApiResponse<AuthUser>>(`${this.baseUrl}/auth/login`, credentials, { withCredentials: true })
      .pipe(tap((r) => { if (r.success) this._currentUser.set(r.data); }));
  }

  logout(): Observable<ApiResponse<void>> {
    return this.http
      .post<ApiResponse<void>>(`${this.baseUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(tap(() => { this._currentUser.set(null); this.router.navigate(['/auth/login']); }));
  }

  restoreSession(): Observable<ApiResponse<AuthUser>> {
    return this.http
      .get<ApiResponse<AuthUser>>(`${this.baseUrl}/auth/me`, { withCredentials: true })
      .pipe(tap((r) => { if (r.success) this._currentUser.set(r.data); }));
  }
}
