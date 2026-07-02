import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import type {
  GalleryAlbum,
  GalleryAlbumCreateRequest,
  GalleryAlbumUpdateRequest,
  GalleryItem,
  GalleryItemCreateRequest,
} from '../../core/models';
import type { PaginatedResponse } from '../../core/models';

export interface GalleryFilters {
  tournamentId?: string;
  matchId?:      string;
  search?:       string;
  page?:         number;
  pageSize?:     number;
}

@Injectable({ providedIn: 'root' })
export class GalleryService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/gallery';

  // ── Albums ────────────────────────────────────────────────────────────────

  /**
   * Fetches a paginated list of gallery albums.
   * @param filters - tournamentId, matchId, search, page, pageSize
   * @returns Observable with paginated album list
   */
  getAlbums(filters?: GalleryFilters): Observable<PaginatedResponse<GalleryAlbum>> {
    const params: Record<string, string | number> = {};
    if (filters?.tournamentId) params['tournamentId'] = filters.tournamentId;
    if (filters?.matchId)      params['matchId']      = filters.matchId;
    if (filters?.search)       params['search']       = filters.search;
    if (filters?.page)         params['page']         = filters.page;
    if (filters?.pageSize)     params['pageSize']     = filters.pageSize ?? 10;
    return this.api.getPaginated<GalleryAlbum>(this.basePath, params);
  }

  /**
   * Fetches a single album by ID.
   * @param id - album UUID
   * @returns Observable with album data
   */
  getAlbumById(id: string): Observable<GalleryAlbum> {
    return this.api.get<GalleryAlbum>(`${this.basePath}/${id}`).pipe(map((r) => r.data));
  }

  /**
   * Creates a new gallery album.
   * @param payload - album creation data
   * @returns Observable with created album
   */
  createAlbum(payload: GalleryAlbumCreateRequest): Observable<GalleryAlbum> {
    return this.api.post<GalleryAlbum>(this.basePath, payload).pipe(map((r) => r.data));
  }

  /**
   * Updates an existing gallery album.
   * @param id - album UUID
   * @param payload - partial album data to update
   * @returns Observable with updated album
   */
  updateAlbum(id: string, payload: GalleryAlbumUpdateRequest): Observable<GalleryAlbum> {
    return this.api.put<GalleryAlbum>(`${this.basePath}/${id}`, payload).pipe(map((r) => r.data));
  }

  /**
   * Deletes a gallery album by ID.
   * @param id - album UUID
   * @returns Observable completing on success
   */
  deleteAlbum(id: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`).pipe(map(() => undefined));
  }

  // ── Items (photos/videos within an album) ──────────────────────────────────

  /**
   * Fetches all items in a specific album.
   * @param albumId - album UUID
   * @returns Observable with paginated gallery items
   */
  getItems(albumId: string): Observable<PaginatedResponse<GalleryItem>> {
    return this.api.getPaginated<GalleryItem>(`${this.basePath}/${albumId}/items`);
  }

  /**
   * Adds a new item to an album.
   * @param albumId - album UUID
   * @param payload - item creation data (url, type, caption)
   * @returns Observable with created gallery item
   */
  createItem(albumId: string, payload: GalleryItemCreateRequest): Observable<GalleryItem> {
    return this.api.post<GalleryItem>(`${this.basePath}/${albumId}/items`, payload)
      .pipe(map((r) => r.data));
  }

  /**
   * Deletes an item from an album.
   * @param albumId - album UUID
   * @param itemId - item UUID
   * @returns Observable completing on success
   */
  deleteItem(albumId: string, itemId: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${albumId}/items/${itemId}`)
      .pipe(map(() => undefined));
  }
}
