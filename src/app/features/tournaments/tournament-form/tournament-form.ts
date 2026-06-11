import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { TournamentService } from '../tournament.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import type { TournamentCreateRequest, TournamentFormat } from '../../../core/models';

/**
 * Tournament creation and editing form.
 * Uses Angular Reactive Forms with strict validation.
 * In edit mode, it loads the existing tournament data by ID from the route param.
 */
@Component({
  selector: 'app-tournament-form',
  imports: [ReactiveFormsModule, LoadingSpinner],
  templateUrl: './tournament-form.html',
  styleUrl: './tournament-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly tournamentService = inject(TournamentService);

  readonly isEditMode = signal<boolean>(false);
  readonly tournamentId = signal<number | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly formatOptions: { value: TournamentFormat; label: string }[] = [
    { value: 'groups_knockout', label: 'Grupos + Eliminatoria' },
    { value: 'round_robin', label: 'Todos contra todos' },
    { value: 'single_elimination', label: 'Eliminación simple' },
    { value: 'double_elimination', label: 'Eliminación doble' },
  ];

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    sportId: [null as number | null, [Validators.required]],
    format: ['' as TournamentFormat | '', [Validators.required]],
    category: ['', [Validators.required, Validators.maxLength(60)]],
    season: ['', [Validators.required, Validators.pattern(/^\d{4}(-\d{4})?$/)]],
    startDate: ['', [Validators.required]],
    endDate: ['', [Validators.required]],
    maxTeams: [8, [Validators.required, Validators.min(2), Validators.max(256)]],
  }, { validators: this.dateRangeValidator });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.tournamentId.set(Number(id));
      this.loadTournament(Number(id));
    }
  }

  /** Custom cross-field validator: endDate must be after startDate. */
  private dateRangeValidator(group: AbstractControl): Record<string, boolean> | null {
    const start = group.get('startDate')?.value as string;
    const end = group.get('endDate')?.value as string;
    if (start && end && end <= start) {
      return { dateRange: true };
    }
    return null;
  }

  private loadTournament(id: number): void {
    this.isLoading.set(true);
    this.tournamentService.getById(id).subscribe({
      next: (tournament) => {
        this.form.patchValue({
          name: tournament.name,
          sportId: tournament.sportId,
          format: tournament.format,
          category: tournament.category,
          season: tournament.season,
          startDate: tournament.startDate.slice(0, 10),
          endDate: tournament.endDate.slice(0, 10),
          maxTeams: tournament.maxTeams,
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudo cargar el torneo.');
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

    const payload = this.form.value as TournamentCreateRequest;
    const id = this.tournamentId();

    const request$ = id
      ? this.tournamentService.update(id, payload)
      : this.tournamentService.create(payload);

    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.router.navigate(['/tournaments']);
      },
      error: () => {
        this.errorMessage.set('No se pudo guardar el torneo. Verifica los datos e intenta nuevamente.');
        this.isSaving.set(false);
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/tournaments']);
  }

  /** Helpers for template error access */
  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && control?.touched);
  }

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.errors || !control.touched) return '';
    if (control.errors['required']) return 'Este campo es requerido.';
    if (control.errors['minlength']) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres.`;
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres.`;
    if (control.errors['min']) return `El valor mínimo es ${control.errors['min'].min}.`;
    if (control.errors['max']) return `El valor máximo es ${control.errors['max'].max}.`;
    if (control.errors['pattern']) return 'Formato inválido. Usa YYYY o YYYY-YYYY.';
    return 'Valor inválido.';
  }
}
