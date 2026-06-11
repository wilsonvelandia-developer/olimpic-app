import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SportService } from '../sport.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import type { SportCreateRequest } from '../sport.service';

/**
 * Sport form — create/edit a sport with configurable rules.
 * Rules section is the key for multi-sport scalability.
 */
@Component({
  selector: 'app-sport-form',
  imports: [ReactiveFormsModule, LoadingSpinner],
  templateUrl: './sport-form.html',
  styleUrl: './sport-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SportForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly sportService = inject(SportService);

  readonly isEditMode = signal<boolean>(false);
  readonly sportId = signal<number | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly scoringUnitOptions = [
    { value: 'goals',  label: 'Goles (fútbol, hockey)' },
    { value: 'points', label: 'Puntos (básquet, vóley)' },
    { value: 'sets',   label: 'Sets (tenis, vóley)' },
    { value: 'games',  label: 'Games (tenis)' },
  ];

  readonly form = this.fb.group({
    name:           ['', [Validators.required, Validators.minLength(3), Validators.maxLength(60)]],
    slug:           ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/), Validators.maxLength(40)]],
    icon:           ['', [Validators.required, Validators.maxLength(10)]],
    playersPerTeam: [null as number | null, [Validators.required, Validators.min(1), Validators.max(50)]],
    rules: this.fb.group({
      scoringUnit: ['goals', [Validators.required]],
      periods:     [2, [Validators.required, Validators.min(1), Validators.max(10)]],
      periodName:  ['Tiempo', [Validators.required, Validators.maxLength(30)]],
      hasOvertime:  [false],
      hasPenalties: [false],
    }),
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.sportId.set(Number(id));
      this.loadSport(Number(id));
    }
  }

  private loadSport(id: number): void {
    this.isLoading.set(true);
    this.sportService.getById(id).subscribe({
      next: (sport) => {
        this.form.patchValue({
          name: sport.name,
          slug: sport.slug,
          icon: sport.icon,
          playersPerTeam: sport.playersPerTeam,
          rules: {
            scoringUnit:  sport.rules.scoringUnit,
            periods:      sport.rules.periods,
            periodName:   sport.rules.periodName,
            hasOvertime:  sport.rules.hasOvertime,
            hasPenalties: sport.rules.hasPenalties,
          },
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    this.errorMessage.set(null);

    const payload = this.form.value as SportCreateRequest;
    const id = this.sportId();
    const request$ = id
      ? this.sportService.update(id, payload)
      : this.sportService.create(payload);

    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.router.navigate(['/sports']);
      },
      error: () => {
        this.errorMessage.set('No se pudo guardar el deporte. Verifica los datos.');
        this.isSaving.set(false);
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/sports']);
  }

  /** Auto-generate slug from name */
  onNameInput(event: Event): void {
    if (this.isEditMode()) return; // don't overwrite on edit
    const value = (event.target as HTMLInputElement).value;
    const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    this.form.get('slug')?.setValue(slug, { emitEvent: false });
  }

  isFieldInvalid(path: string): boolean {
    const c = this.form.get(path);
    return !!(c?.invalid && c?.touched);
  }

  getFieldError(path: string): string {
    const c = this.form.get(path);
    if (!c?.errors || !c.touched) return '';
    if (c.errors['required']) return 'Este campo es requerido.';
    if (c.errors['minlength']) return `Mínimo ${c.errors['minlength'].requiredLength} caracteres.`;
    if (c.errors['maxlength']) return `Máximo ${c.errors['maxlength'].requiredLength} caracteres.`;
    if (c.errors['min']) return `Valor mínimo: ${c.errors['min'].min}.`;
    if (c.errors['max']) return `Valor máximo: ${c.errors['max'].max}.`;
    if (c.errors['pattern']) return 'Solo letras minúsculas, números y guiones (ej: futbol-sala).';
    return 'Valor inválido.';
  }
}
