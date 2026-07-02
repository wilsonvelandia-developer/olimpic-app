import { Component, ChangeDetectionStrategy, inject, signal, input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { AuthService } from '../../../core/services/auth.service';
import type { GalleryAlbum } from '../../../core/models';

/**
 * Displays gallery albums scoped to the current tournament.
 * Embedded as a tab inside tournament-detail.
 */
@Component({
  selector: 'app-tournament-gallery',
  imports: [LoadingSpinner],
  templateUrl: './tournament-gallery.html',
  styleUrl: './tournament-gallery.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentGallery implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly tournamentId = input.required<string>();

  readonly albums = signal<GalleryAlbum[]>([]);
  readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadAlbums();
  }

  loadAlbums(): void {
    this.isLoading.set(true);
    this.api.get<GalleryAlbum[]>(`/gallery?tournamentId=${this.tournamentId()}`).subscribe({
      next: (res) => { this.albums.set(res.data ?? []); this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });
  }

  onCreateAlbum(): void {
    this.router.navigate(['/gallery', 'new'], { queryParams: { tournamentId: this.tournamentId() } });
  }

  onViewAlbum(id: string): void {
    this.router.navigate(['/gallery', id]);
  }
}
