import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TeamService } from '../team.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import type { TeamCreateRequest } from '../../../core/models';

/**
 * Team creation and editing form with reactive validation.
 */
@Component({
  selector: 'app-team-form',
  imports: [ReactiveFormsModule, LoadingSpinner],
  templateUrl: './team-form.html',
  styleUrl: './team-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly teamService = inject(TeamService);

  readonly isEditMode = signal<boolean>(false);
  readonly teamId = signal<number | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    shortName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(10)]],
    city: ['', [Validators.required, Validators.maxLength(60)]],
    logoUrl: ['', [Validators.pattern(/^https?:\/\/.+/)]],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.teamId.set(Number(id));
      this.loadTeam(Number(id));
    }
  }

  private loadTeam(id: number): void {
    this.isLoading.set(true);
    this.teamService.getById(id).subscribe({
      next: (team) => {
        this.form.patchValue({
          name: team.name,
          shortName: team.shortName,
          city: team.city,
          logoUrl: team.logoUrl ?? '',
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudo cargar el equipo.');
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

    const raw = this.form.value;
    const payload: TeamCreateRequest = {
      name: raw.name!,
      shortName: raw.shortName!,
      city: raw.city!,
      ...(raw.logoUrl ? { logoUrl: raw.logoUrl } : {}),
    };

    const id = this.teamId();
    const request$ = id
      ? this.teamService.update(id, payload)
      : this.teamService.create(payload);

    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.router.navigate(['/teams']);
      },
      error: () => {
        this.errorMessage.set('No se pudo guardar el equipo. Verifica los datos e intenta nuevamente.');
        this.isSaving.set(false);
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/teams']);
  }

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
    if (control.errors['pattern']) return 'Debe ser una URL válida (https://...).';
    return 'Valor inválido.';
  }
}
