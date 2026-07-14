import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { GalleryService } from '../gallery.service';
import { ApiService } from '../../../core/services/api.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ImageUpload } from '../../../shared/components/image-upload/image-upload';

@Component({
  selector: 'app-gallery-form',
  imports: [ReactiveFormsModule, LoadingSpinner, ImageUpload],
  templateUrl: './gallery-form.html',
  styleUrl: './gallery-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly galleryService = inject(GalleryService);
  private readonly api = inject(ApiService);

  readonly isEditMode = signal<boolean>(false);
  readonly albumId = signal<string | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly tournaments = signal<Array<{ id: string; name: string }>>([]);

  /** Album photos (multi-image). */
  readonly albumPhotos = signal<Array<{ url: string; path?: string }>>([]);
  readonly isUploadingPhotos = signal<boolean>(false);
  readonly uploadedCount = signal<number>(0);
  readonly totalToUpload = signal<number>(0);

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    description: [''],
    tournamentId: ['' as string | null],
    coverUrl: [''],
  });

  ngOnInit(): void {
    this.api.get<Array<{ id: string; name: string }>>('/tournaments').subscribe({
      next: (res) => { if (res.success && res.data) this.tournaments.set(res.data); },
    });

    // Pre-select tournament from query param (when coming from tournament-detail)
    const queryTournamentId = this.route.snapshot.queryParamMap.get('tournamentId');
    if (queryTournamentId) {
      this.form.patchValue({ tournamentId: queryTournamentId });
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.albumId.set(id);
      this.loadAlbum(id);
    }
  }

  private loadAlbum(id: string): void {
    this.isLoading.set(true);
    this.galleryService.getAlbumById(id).subscribe({
      next: (a) => {
        this.form.patchValue({
          title: a.title,
          description: a.description ?? '',
          tournamentId: a.tournamentId ?? '',
          coverUrl: a.coverUrl ?? '',
        });
        this.isLoading.set(false);
        this.loadAlbumPhotos(id);
      },
      error: () => { this.errorMessage.set('No se pudo cargar el álbum.'); this.isLoading.set(false); },
    });
  }

  private navigateBack(): void {
    const returnTournamentId = this.route.snapshot.queryParamMap.get('tournamentId');
    if (returnTournamentId) {
      this.router.navigate(['/tournaments', returnTournamentId]);
    } else {
      this.router.navigate(['/gallery']);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSaving.set(true);
    this.errorMessage.set(null);

    const v = this.form.value;
    const id = this.albumId();

    if (id) {
      this.galleryService.updateAlbum(id, {
        title: v.title!,
        description: v.description || null,
        coverUrl: v.coverUrl || null,
      }).subscribe({
        next: () => { this.isSaving.set(false); this.navigateBack(); },
        error: () => { this.errorMessage.set('No se pudo guardar el álbum.'); this.isSaving.set(false); },
      });
    } else {
      this.galleryService.createAlbum({
        title: v.title!,
        description: v.description || null,
        tournamentId: v.tournamentId || null,
        coverUrl: v.coverUrl || null,
      }).subscribe({
        next: () => { this.isSaving.set(false); this.navigateBack(); },
        error: () => { this.errorMessage.set('No se pudo guardar el álbum.'); this.isSaving.set(false); },
      });
    }
  }

  onCoverUploaded(url: string): void {
    this.form.patchValue({ coverUrl: url });
  }

  /** Adds a photo to the album (saves to backend immediately). */
  onPhotoAdded(url: string): void {
    const current = this.albumPhotos();
    this.albumPhotos.set([...current, { url }]);

    // Save photo to backend
    const albumId = this.albumId();
    if (albumId) {
      this.api.post(`/gallery/${albumId}/photos`, { imageUrl: url }).subscribe();
    }
  }

  /** Removes a photo from the album. */
  onRemovePhoto(url: string): void {
    const current = this.albumPhotos();
    this.albumPhotos.set(current.filter((p) => p.url !== url));

    // Remove from backend
    const albumId = this.albumId();
    if (albumId) {
      this.api.post(`/gallery/${albumId}/photos/remove`, { imageUrl: url }).subscribe();
    }
  }

  /** Loads existing photos for an album in edit mode. */
  private loadAlbumPhotos(albumId: string): void {
    this.api.get<Array<{ imageUrl: string }>>(`/gallery/${albumId}/photos`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.albumPhotos.set(res.data.map((p) => ({ url: p.imageUrl })));
        }
      },
    });
  }

  onCancel(): void { this.navigateBack(); }

  isFieldInvalid(f: string): boolean { const c = this.form.get(f); return !!(c?.invalid && c?.touched); }
  getFieldError(f: string): string {
    const c = this.form.get(f);
    if (!c?.errors || !c.touched) return '';
    if (c.errors['required']) return 'Este campo es requerido.';
    if (c.errors['minlength']) return `Mínimo ${c.errors['minlength'].requiredLength} caracteres.`;
    if (c.errors['maxlength']) return `Máximo ${c.errors['maxlength'].requiredLength} caracteres.`;
    return 'Valor inválido.';
  }
}
