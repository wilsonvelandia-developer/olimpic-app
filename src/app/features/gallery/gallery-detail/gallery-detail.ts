import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GalleryService } from '../gallery.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { AuthService } from '../../../core/services/auth.service';
import type { GalleryAlbum, GalleryItem } from '../../../core/models';

@Component({
  selector: 'app-gallery-detail',
  imports: [RouterLink, LoadingSpinner, ConfirmDialog],
  templateUrl: './gallery-detail.html',
  styleUrl: './gallery-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly galleryService = inject(GalleryService);
  readonly auth = inject(AuthService);

  readonly album = signal<GalleryAlbum | null>(null);
  readonly items = signal<GalleryItem[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isLoadingItems = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showDeleteDialog = signal<boolean>(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadAlbum(id);
      this.loadItems(id);
    }
  }

  private loadAlbum(id: string): void {
    this.isLoading.set(true);
    this.galleryService.getAlbumById(id).subscribe({
      next: (d) => { this.album.set(d); this.isLoading.set(false); },
      error: () => { this.errorMessage.set('No se pudo cargar el álbum.'); this.isLoading.set(false); },
    });
  }

  private loadItems(albumId: string): void {
    this.isLoadingItems.set(true);
    this.galleryService.getItems(albumId).subscribe({
      next: (r) => { this.items.set(r.data); this.isLoadingItems.set(false); },
      error: () => this.isLoadingItems.set(false),
    });
  }

  onEdit(): void {
    const id = this.album()?.id;
    if (id) this.router.navigate(['/gallery', id, 'edit']);
  }

  onDeleteConfirm(): void { this.showDeleteDialog.set(true); }
  onDeleteCancelled(): void { this.showDeleteDialog.set(false); }

  onDeleteConfirmed(): void {
    const id = this.album()?.id;
    if (!id) return;
    this.showDeleteDialog.set(false);
    this.galleryService.deleteAlbum(id).subscribe({
      next: () => this.router.navigate(['/gallery']),
      error: () => this.errorMessage.set('No se pudo eliminar el álbum.'),
    });
  }

  onDeleteItem(itemId: string): void {
    const albumId = this.album()?.id;
    if (!albumId) return;
    this.galleryService.deleteItem(albumId, itemId).subscribe({
      next: () => this.loadItems(albumId),
      error: () => this.errorMessage.set('No se pudo eliminar el elemento.'),
    });
  }
}
