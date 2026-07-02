import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GalleryService } from '../gallery.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { AuthService } from '../../../core/services/auth.service';
import type { GalleryAlbum } from '../../../core/models';
import type { GalleryFilters } from '../gallery.service';

@Component({
  selector: 'app-gallery-list',
  imports: [FormsModule, LoadingSpinner, ConfirmDialog],
  templateUrl: './gallery-list.html',
  styleUrl: './gallery-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryList implements OnInit {
  private readonly galleryService = inject(GalleryService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly albums = signal<GalleryAlbum[]>([]);
  readonly totalCount = signal<number>(0);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly showDeleteDialog = signal<boolean>(false);
  readonly selectedAlbumId = signal<string | null>(null);
  readonly selectedAlbumTitle = signal<string>('');

  readonly currentPage = signal<number>(1);
  readonly pageSize = 12;

  searchModel = '';

  ngOnInit(): void {
    this.loadAlbums();
  }

  loadAlbums(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const filters: GalleryFilters = { page: this.currentPage(), pageSize: this.pageSize };
    if (this.searchModel.trim()) filters.search = this.searchModel.trim();

    this.galleryService.getAlbums(filters).subscribe({
      next: (r) => { this.albums.set(r.data); this.totalCount.set(r.total); this.isLoading.set(false); },
      error: () => { this.errorMessage.set('No se pudieron cargar los álbumes.'); this.isLoading.set(false); },
    });
  }

  onApplyFilters(): void { this.currentPage.set(1); this.loadAlbums(); }
  onClearFilters(): void { this.searchModel = ''; this.currentPage.set(1); this.loadAlbums(); }
  onCreateAlbum(): void { this.router.navigate(['/gallery', 'new']); }
  onEditAlbum(id: string): void { this.router.navigate(['/gallery', id, 'edit']); }
  onViewDetail(id: string): void { this.router.navigate(['/gallery', id]); }

  onDeleteConfirm(album: GalleryAlbum): void {
    this.selectedAlbumId.set(album.id);
    this.selectedAlbumTitle.set(album.title);
    this.showDeleteDialog.set(true);
  }

  onDeleteCancelled(): void { this.showDeleteDialog.set(false); this.selectedAlbumId.set(null); }

  onDeleteConfirmed(): void {
    const id = this.selectedAlbumId();
    if (!id) return;
    this.showDeleteDialog.set(false);
    this.galleryService.deleteAlbum(id).subscribe({
      next: () => this.loadAlbums(),
      error: () => this.errorMessage.set('No se pudo eliminar el álbum.'),
    });
  }

  onPageChange(page: number): void { this.currentPage.set(page); this.loadAlbums(); }

  get totalPages(): number { return Math.ceil(this.totalCount() / this.pageSize); }
  get pageRange(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
}
