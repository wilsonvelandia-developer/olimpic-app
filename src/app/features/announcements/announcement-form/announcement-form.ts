import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AnnouncementService } from '../announcement.service';
import { ApiService } from '../../../core/services/api.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import type { AnnouncementPriority, AnnouncementStatus } from '../../../core/models';

@Component({
  selector: 'app-announcement-form',
  imports: [ReactiveFormsModule, LoadingSpinner],
  templateUrl: './announcement-form.html',
  styleUrl: './announcement-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly announcementService = inject(AnnouncementService);
  private readonly api = inject(ApiService);

  readonly isEditMode = signal<boolean>(false);
  readonly announcementId = signal<string | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly tournaments = signal<Array<{ id: string; name: string }>>([]);

  readonly priorityOptions: { value: AnnouncementPriority; label: string }[] = [
    { value: 'low', label: 'Baja' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'Alta' },
    { value: 'urgent', label: 'Urgente' },
  ];

  readonly statusOptions: { value: AnnouncementStatus; label: string }[] = [
    { value: 'draft', label: 'Borrador' },
    { value: 'published', label: 'Publicado' },
    { value: 'archived', label: 'Archivado' },
  ];

  readonly form = this.fb.group({
    tournamentId: ['' as string | null],
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    content: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
    priority: ['normal' as AnnouncementPriority],
    status: ['draft' as AnnouncementStatus],
    imageUrl: [''],
  });

  ngOnInit(): void {
    this.api.get<Array<{ id: string; name: string }>>('/tournaments').subscribe({
      next: (res) => { if (res.success && res.data) this.tournaments.set(res.data); },
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.announcementId.set(id);
      this.loadAnnouncement(id);
    }
  }

  private loadAnnouncement(id: string): void {
    this.isLoading.set(true);
    this.announcementService.getById(id).subscribe({
      next: (a) => {
        this.form.patchValue({
          tournamentId: a.tournamentId ?? '',
          title: a.title,
          content: a.content,
          priority: a.priority,
          status: a.status,
          imageUrl: a.imageUrl ?? '',
        });
        this.isLoading.set(false);
      },
      error: () => { this.errorMessage.set('No se pudo cargar el comunicado.'); this.isLoading.set(false); },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSaving.set(true);
    this.errorMessage.set(null);

    const v = this.form.value;
    const id = this.announcementId();

    if (id) {
      this.announcementService.update(id, {
        tournamentId: v.tournamentId || null,
        title: v.title!,
        content: v.content!,
        priority: v.priority!,
        status: v.status!,
        imageUrl: v.imageUrl || null,
      }).subscribe({
        next: () => { this.isSaving.set(false); this.router.navigate(['/announcements']); },
        error: () => { this.errorMessage.set('No se pudo guardar el comunicado.'); this.isSaving.set(false); },
      });
    } else {
      this.announcementService.create({
        tournamentId: v.tournamentId || null,
        title: v.title!,
        content: v.content!,
        priority: v.priority!,
        status: v.status!,
        imageUrl: v.imageUrl || null,
      }).subscribe({
        next: () => { this.isSaving.set(false); this.router.navigate(['/announcements']); },
        error: () => { this.errorMessage.set('No se pudo guardar el comunicado.'); this.isSaving.set(false); },
      });
    }
  }

  onCancel(): void { this.router.navigate(['/announcements']); }

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
