import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import type { ApiResponse } from '../models';

// ── Test fixtures ───────────────────────────────────────────────────────────

interface Sport {
  id: string;
  name: string;
  slug: string;
}

const SPORT_FIXTURE: Sport = { id: 'sport-1', name: 'Volleyball', slug: 'volleyball' };

// ── Tests ───────────────────────────────────────────────────────────────────

describe('ApiService', () => {
  let service: ApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('get', () => {
    it('should make a GET request to the correct URL with /api prefix', () => {
      // When
      service.get<Sport>('/sports/sport-1').subscribe((res) => {
        expect(res.success).toBe(true);
        expect(res.data).toEqual(SPORT_FIXTURE);
      });

      // Then
      const req = httpTesting.expectOne('http://localhost:3000/api/sports/sport-1');
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush({ data: SPORT_FIXTURE, success: true, message: '' });
    });

    it('should pass query params when provided', () => {
      // When
      service.get<Sport[]>('/sports', { status: 'active', page: 1 }).subscribe();

      // Then
      const req = httpTesting.expectOne(
        (r) => r.url === 'http://localhost:3000/api/sports'
          && r.params.get('status') === 'active'
          && r.params.get('page') === '1',
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: [SPORT_FIXTURE], success: true, message: '' });
    });

    it('should not include params when none provided', () => {
      service.get<Sport[]>('/sports').subscribe();

      const req = httpTesting.expectOne('http://localhost:3000/api/sports');
      expect(req.request.params.keys().length).toBe(0);
      req.flush({ data: [], success: true, message: '' });
    });
  });

  describe('getPaginated', () => {
    it('should return paginated response with computed pagination metadata', () => {
      const sports: Sport[] = [
        { id: '1', name: 'Volleyball', slug: 'volleyball' },
        { id: '2', name: 'Football', slug: 'football' },
        { id: '3', name: 'Basketball', slug: 'basketball' },
      ];

      // When
      service.getPaginated<Sport>('/sports', { page: 1, pageSize: 10 }).subscribe((res) => {
        expect(res.data).toEqual(sports);
        expect(res.total).toBe(3);
        expect(res.page).toBe(1);
        expect(res.pageSize).toBe(10);
        expect(res.totalPages).toBe(1);
        expect(res.success).toBe(true);
      });

      // Then
      const req = httpTesting.expectOne(
        (r) => r.url === 'http://localhost:3000/api/sports',
      );
      req.flush({ data: sports, success: true, message: '' });
    });

    it('should compute multiple pages when items exceed pageSize', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({
        id: String(i),
        name: `Sport ${i}`,
        slug: `sport-${i}`,
      }));

      service.getPaginated<Sport>('/sports', { page: 1, pageSize: 10 }).subscribe((res) => {
        expect(res.total).toBe(25);
        expect(res.totalPages).toBe(3);
      });

      const req = httpTesting.expectOne((r) => r.url === 'http://localhost:3000/api/sports');
      req.flush({ data: items, success: true, message: '' });
    });

    it('should default to page 1 when no page param is given', () => {
      service.getPaginated<Sport>('/sports').subscribe((res) => {
        expect(res.page).toBe(1);
      });

      const req = httpTesting.expectOne('http://localhost:3000/api/sports');
      req.flush({ data: [], success: true, message: '' });
    });
  });

  describe('post', () => {
    it('should make a POST request with body', () => {
      const newSport = { name: 'Tennis', slug: 'tennis' };

      service.post<Sport>('/sports', newSport).subscribe((res) => {
        expect(res.success).toBe(true);
        expect(res.data.id).toBe('sport-new');
      });

      const req = httpTesting.expectOne('http://localhost:3000/api/sports');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newSport);
      expect(req.request.withCredentials).toBe(true);
      req.flush({ data: { id: 'sport-new', ...newSport }, success: true, message: '' });
    });
  });

  describe('put', () => {
    it('should make a PUT request with body', () => {
      const updateData = { name: 'Volleyball Updated' };

      service.put<Sport>('/sports/sport-1', updateData).subscribe((res) => {
        expect(res.success).toBe(true);
      });

      const req = httpTesting.expectOne('http://localhost:3000/api/sports/sport-1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateData);
      expect(req.request.withCredentials).toBe(true);
      req.flush({ data: { ...SPORT_FIXTURE, ...updateData }, success: true, message: '' });
    });
  });

  describe('patch', () => {
    it('should make a PATCH request with body', () => {
      const patchData = { status: 'active' };

      service.patch<Sport>('/sports/sport-1', patchData).subscribe((res) => {
        expect(res.success).toBe(true);
      });

      const req = httpTesting.expectOne('http://localhost:3000/api/sports/sport-1');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(patchData);
      expect(req.request.withCredentials).toBe(true);
      req.flush({ data: SPORT_FIXTURE, success: true, message: '' });
    });
  });

  describe('delete', () => {
    it('should make a DELETE request', () => {
      service.delete<void>('/sports/sport-1').subscribe((res) => {
        expect(res.success).toBe(true);
      });

      const req = httpTesting.expectOne('http://localhost:3000/api/sports/sport-1');
      expect(req.request.method).toBe('DELETE');
      expect(req.request.withCredentials).toBe(true);
      req.flush({ data: null, success: true, message: 'Deleted' });
    });
  });

  describe('error handling', () => {
    it('should propagate HTTP errors to subscriber', () => {
      let errorReceived = false;

      service.get<Sport>('/sports/invalid').subscribe({
        error: () => { errorReceived = true; },
      });

      const req = httpTesting.expectOne('http://localhost:3000/api/sports/invalid');
      req.flush(
        { message: 'Not found', code: 'NOT_FOUND' },
        { status: 404, statusText: 'Not Found' },
      );

      expect(errorReceived).toBe(true);
    });
  });
});
