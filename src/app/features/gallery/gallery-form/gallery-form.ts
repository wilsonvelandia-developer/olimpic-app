import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { GalleryService } from '../gallery.service';
import { ApiService } from '../../../core/services/api.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-gallery-form',
  imports: [ReactiveFormsModule, LoadingSpinner],
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
      },
      error: () => { this.errorMessage.set('No se pudo cargar el álbum.'); this.isLoading.set(false); },
    });
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
        next: () => { this.isSaving.set(false); this.router.navigate(['/gallery']); },
        error: () => { this.errorMessage.set('No se pudo guardar el álbum.'); this.isSaving.set(false); },
      });
    } else {
      this.galleryService.createAlbum({
        title: v.title!,
        description: v.description || null,
        tournamentId: v.tournamentId || null,
        coverUrl: v.coverUrl || null,
      }).subscribe({
        next: () => { this.isSaving.set(false); this.router.navigate(['/gallery']); },
        error: () => { this.errorMessage.set('No se pudo guardar el álbum.'); this.isSaving.set(false); },
      });
    }
  }

  onCancel(): void { this.router.navigate(['/gallery']); }

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
