import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Routes } from '@angular/router';
import { Component } from '@angular/core';
import { AuthService, AuthUser } from './auth.service';
import type { ApiResponse } from '../models';

/** Dummy component for router configuration in tests. */
@Component({ template: '' })
class DummyComponent {}

const TEST_ROUTES: Routes = [
  { path: 'auth/login', component: DummyComponent },
];

// ── Test fixtures ───────────────────────────────────────────────────────────

const ADMIN_USER: AuthUser = {
  id: 'user-1',
  name: 'Admin User',
  email: 'admin@test.com',
  phone: '+57300000000',
  avatarUrl: null,
  roles: ['admin'],
};

const ORGANIZER_USER: AuthUser = {
  id: 'user-2',
  name: 'Organizer User',
  email: 'org@test.com',
  phone: null,
  avatarUrl: null,
  roles: ['organizer'],
};

const COACH_USER: AuthUser = {
  id: 'user-3',
  name: 'Coach User',
  email: 'coach@test.com',
  phone: null,
  avatarUrl: null,
  roles: ['coach'],
};

const PLAYER_USER: AuthUser = {
  id: 'user-4',
  name: 'Player User',
  email: 'player@test.com',
  phone: null,
  avatarUrl: null,
  roles: ['player'],
};

const REFEREE_USER: AuthUser = {
  id: 'user-5',
  name: 'Referee User',
  email: 'referee@test.com',
  phone: null,
  avatarUrl: null,
  roles: ['referee'],
};

const MULTI_ROLE_USER: AuthUser = {
  id: 'user-6',
  name: 'Multi Role',
  email: 'multi@test.com',
  phone: null,
  avatarUrl: null,
  roles: ['coach', 'organizer'],
};

function successResponse<T>(data: T): ApiResponse<T> {
  return { data, success: true, message: '' };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(TEST_ROUTES),
      ],
    });

    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('initial state', () => {
    it('should have null currentUser initially', () => {
      expect(service.currentUser()).toBeNull();
    });

    it('should not be authenticated initially', () => {
      expect(service.isAuthenticated$()).toBe(false);
    });

    it('should have null primaryRole initially', () => {
      expect(service.primaryRole()).toBeNull();
    });

    it('should have isAdmin false initially', () => {
      expect(service.isAdmin()).toBe(false);
    });
  });

  describe('login', () => {
    it('should set currentUser on successful login', () => {
      // When
      service.login({ email: 'admin@test.com', password: 'secret' }).subscribe();

      // Then
      const req = httpTesting.expectOne('http://localhost:3000/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      req.flush(successResponse(ADMIN_USER));

      expect(service.currentUser()).toEqual(ADMIN_USER);
      expect(service.isAuthenticated$()).toBe(true);
    });

    it('should not set currentUser when login fails', () => {
      // When
      service.login({ email: 'bad@test.com', password: 'wrong' }).subscribe();

      // Then
      const req = httpTesting.expectOne('http://localhost:3000/auth/login');
      req.flush({ data: null, success: false, message: 'Invalid credentials' });

      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated$()).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear currentUser on logout', () => {
      // Given — login first
      service.login({ email: 'admin@test.com', password: 'secret' }).subscribe();
      httpTesting.expectOne('http://localhost:3000/auth/login')
        .flush(successResponse(ADMIN_USER));
      expect(service.currentUser()).not.toBeNull();

      // When
      service.logout().subscribe();
      const req = httpTesting.expectOne('http://localhost:3000/auth/logout');
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      req.flush(successResponse(undefined));

      // Then
      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated$()).toBe(false);
    });
  });

  describe('restoreSession', () => {
    it('should restore user from /auth/me on success', () => {
      // When
      service.restoreSession().subscribe();

      // Then
      const req = httpTesting.expectOne('http://localhost:3000/auth/me');
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush(successResponse(ORGANIZER_USER));

      expect(service.currentUser()).toEqual(ORGANIZER_USER);
      expect(service.isAuthenticated$()).toBe(true);
    });

    it('should not set user when session restore fails', () => {
      // When
      service.restoreSession().subscribe();

      // Then
      const req = httpTesting.expectOne('http://localhost:3000/auth/me');
      req.flush({ data: null, success: false, message: 'No session' });

      expect(service.currentUser()).toBeNull();
    });
  });

  describe('role computed signals', () => {
    function loginAs(user: AuthUser): void {
      service.login({ email: user.email, password: 'pass' }).subscribe();
      httpTesting.expectOne('http://localhost:3000/auth/login')
        .flush(successResponse(user));
    }

    describe('isAdmin', () => {
      it('returns true for admin', () => {
        loginAs(ADMIN_USER);
        expect(service.isAdmin()).toBe(true);
      });

      it('returns false for non-admin', () => {
        loginAs(ORGANIZER_USER);
        expect(service.isAdmin()).toBe(false);
      });
    });

    describe('isOrganizer', () => {
      it('returns true for admin (implicit organizer)', () => {
        loginAs(ADMIN_USER);
        expect(service.isOrganizer()).toBe(true);
      });

      it('returns true for organizer', () => {
        loginAs(ORGANIZER_USER);
        expect(service.isOrganizer()).toBe(true);
      });

      it('returns false for coach', () => {
        loginAs(COACH_USER);
        expect(service.isOrganizer()).toBe(false);
      });
    });

    describe('isReferee', () => {
      it('returns true for referee', () => {
        loginAs(REFEREE_USER);
        expect(service.isReferee()).toBe(true);
      });

      it('returns true for admin', () => {
        loginAs(ADMIN_USER);
        expect(service.isReferee()).toBe(true);
      });

      it('returns false for organizer', () => {
        loginAs(ORGANIZER_USER);
        expect(service.isReferee()).toBe(false);
      });
    });

    describe('primaryRole', () => {
      it('returns the single role for single-role users', () => {
        loginAs(ADMIN_USER);
        expect(service.primaryRole()).toBe('admin');
      });

      it('returns the highest role for multi-role users', () => {
        loginAs(MULTI_ROLE_USER);
        expect(service.primaryRole()).toBe('organizer');
      });
    });

    describe('canEdit', () => {
      it('returns true for admin', () => {
        loginAs(ADMIN_USER);
        expect(service.canEdit()).toBe(true);
      });

      it('returns true for coach', () => {
        loginAs(COACH_USER);
        expect(service.canEdit()).toBe(true);
      });

      it('returns false for player (read-only)', () => {
        loginAs(PLAYER_USER);
        expect(service.canEdit()).toBe(false);
      });
    });

    describe('canManageTeams', () => {
      it('returns true for admin', () => {
        loginAs(ADMIN_USER);
        expect(service.canManageTeams()).toBe(true);
      });

      it('returns true for coach', () => {
        loginAs(COACH_USER);
        expect(service.canManageTeams()).toBe(true);
      });

      it('returns false for player', () => {
        loginAs(PLAYER_USER);
        expect(service.canManageTeams()).toBe(false);
      });

      it('returns false for referee', () => {
        loginAs(REFEREE_USER);
        expect(service.canManageTeams()).toBe(false);
      });
    });

    describe('canManageMatches', () => {
      it('returns true for admin', () => {
        loginAs(ADMIN_USER);
        expect(service.canManageMatches()).toBe(true);
      });

      it('returns true for referee', () => {
        loginAs(REFEREE_USER);
        expect(service.canManageMatches()).toBe(true);
      });

      it('returns false for organizer', () => {
        loginAs(ORGANIZER_USER);
        expect(service.canManageMatches()).toBe(false);
      });
    });
  });

  describe('hasRole', () => {
    function loginAs(user: AuthUser): void {
      service.login({ email: user.email, password: 'pass' }).subscribe();
      httpTesting.expectOne('http://localhost:3000/auth/login')
        .flush(successResponse(user));
    }

    it('returns false when no user is logged in', () => {
      expect(service.hasRole('admin')).toBe(false);
    });

    it('returns true when user meets the required level (admin >= organizer)', () => {
      loginAs(ADMIN_USER);
      expect(service.hasRole('organizer')).toBe(true);
    });

    it('returns true for exact role match', () => {
      loginAs(ORGANIZER_USER);
      expect(service.hasRole('organizer')).toBe(true);
    });

    it('returns false when user is below required level (coach < organizer)', () => {
      loginAs(COACH_USER);
      expect(service.hasRole('organizer')).toBe(false);
    });
  });
});
