import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SportService } from '../sport.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import type { SportCreateRequest } from '../../../core/models';

@Component({
  selector: 'app-sport-form',
  imports: [ReactiveFormsModule, LoadingSpinner],
  templateUrl: './sport-form.html',
  styleUrl: './sport-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SportForm implements OnInit {
  private readonly fb           = inject(FormBuilder);
  private readonly router       = inject(Router);
  private readonly route        = inject(ActivatedRoute);
  private readonly sportService = inject(SportService);

  readonly isEditMode   = signal<boolean>(false);
  readonly sportId      = signal<string | null>(null);
  readonly isLoading    = signal<boolean>(false);
  readonly isSaving     = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    name:              ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    slug:              ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/), Validators.maxLength(50)]],
    playersPerTeam:    [null as number | null, [Validators.required, Validators.min(1), Validators.max(50)]],
    hasSets:           [false],
    setsToWin:         [null as number | null],
    pointsPerSet:      [null as number | null],
    decisiveSetPoints: [null as number | null],
    winMargin:         [2, [Validators.min(1)]],
    periodsPerMatch:   [2, [Validators.min(1), Validators.max(10)]],
    maxSubstitutions:  [null as number | null],
    hasRotation:       [false],
    iconUrl:           ['' as string | null],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.sportId.set(id);
      this.loadSport(id);
    }
  }

  private loadSport(id: string): void {
    this.isLoading.set(true);
    this.sportService.getById(id).subscribe({
      next: (sport) => {
        this.form.patchValue({
          name:              sport.name,
          slug:              sport.slug,
          playersPerTeam:    sport.playersPerTeam,
          hasSets:           sport.hasSets,
          setsToWin:         sport.setsToWin,
          pointsPerSet:      sport.pointsPerSet,
          decisiveSetPoints: sport.decisiveSetPoints,
          winMargin:         sport.winMargin,
          periodsPerMatch:   sport.periodsPerMatch,
          maxSubstitutions:  sport.maxSubstitutions,
          hasRotation:       sport.hasRotation,
          iconUrl:           sport.iconUrl ?? '',
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudo cargar el deporte.');
        this.isLoading.set(false);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSaving.set(true);
    this.errorMessage.set(null);

    const v = this.form.value;
    const payload: SportCreateRequest = {
      name:              v.name!,
      slug:              v.slug!,
      playersPerTeam:    v.playersPerTeam!,
      hasSets:           v.hasSets ?? false,
      setsToWin:         v.setsToWin ?? null,
      pointsPerSet:      v.pointsPerSet ?? null,
      decisiveSetPoints: v.decisiveSetPoints ?? null,
      winMargin:         v.winMargin ?? 2,
      periodsPerMatch:   v.periodsPerMatch ?? 2,
      maxSubstitutions:  v.maxSubstitutions ?? null,
      hasRotation:       v.hasRotation ?? false,
      iconUrl:           v.iconUrl || null,
    };

    const id = this.sportId();
    const req$ = id
      ? this.sportService.update(id, payload)
      : this.sportService.create(payload);

    req$.subscribe({
      next:  () => { this.isSaving.set(false); this.router.navigate(['/sports']); },
      error: () => { this.errorMessage.set('No se pudo guardar el deporte.'); this.isSaving.set(false); },
    });
  }

  onCancel(): void { this.router.navigate(['/sports']); }

  /** Auto-generate slug from name */
  onNameInput(event: Event): void {
    if (this.isEditMode()) return;
    const value = (event.target as HTMLInputElement).value;
    const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    this.form.get('slug')?.setValue(slug, { emitEvent: false });
  }

  isFieldInvalid(f: string): boolean { const c = this.form.get(f); return !!(c?.invalid && c?.touched); }
  getFieldError(f: string): string {
    const c = this.form.get(f);
    if (!c?.errors || !c.touched) return '';
    if (c.errors['required'])  return 'Este campo es requerido.';
    if (c.errors['minlength']) return `Mínimo ${c.errors['minlength'].requiredLength} caracteres.`;
    if (c.errors['maxlength']) return `Máximo ${c.errors['maxlength'].requiredLength} caracteres.`;
    if (c.errors['min'])       return `Valor mínimo: ${c.errors['min'].min}.`;
    if (c.errors['max'])       return `Valor máximo: ${c.errors['max'].max}.`;
    if (c.errors['pattern'])   return 'Solo letras minúsculas, números y guiones.';
    return 'Valor inválido.';
  }
}
