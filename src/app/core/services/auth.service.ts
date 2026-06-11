import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import type { ApiResponse } from '../models';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Manages authentication state.
 * JWT is handled via httpOnly cookies by the backend — never stored in localStorage.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = environment.apiBaseUrl;

  private readonly _currentUser = signal<AuthUser | null>(null);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated$ = computed(() => this._currentUser() !== null);

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
      .post<ApiResponse<void>>(
        `${this.baseUrl}/auth/logout`,
        {},
        { withCredentials: true },
      )
      .pipe(
        tap(() => {
          this._currentUser.set(null);
          this.router.navigate(['/auth/login']);
        }),
      );
  }

  /**
   * Restores the session from the backend using the existing cookie.
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
