import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PlayerService } from '../player.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import type { PlayerCreateRequest } from '../../../core/models';

/**
 * Player creation and editing form.
 * Supports pre-filling teamId from query params (when navigating from team detail).
 */
@Component({
  selector: 'app-player-form',
  imports: [ReactiveFormsModule, LoadingSpinner],
  templateUrl: './player-form.html',
  styleUrl: './player-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly playerService = inject(PlayerService);

  readonly isEditMode = signal<boolean>(false);
  readonly playerId = signal<number | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    documentNumber: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(20)]],
    birthDate: ['', [Validators.required]],
    nationality: ['', [Validators.required, Validators.maxLength(60)]],
    position: ['', [Validators.required, Validators.maxLength(40)]],
    jerseyNumber: [null as number | null, [Validators.required, Validators.min(1), Validators.max(99)]],
    teamId: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    // Pre-fill teamId from query param (e.g. from team detail page)
    const teamIdParam = this.route.snapshot.queryParamMap.get('teamId');
    if (teamIdParam) {
      this.form.patchValue({ teamId: Number(teamIdParam) });
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.playerId.set(Number(id));
      this.loadPlayer(Number(id));
    }
  }

  private loadPlayer(id: number): void {
    this.isLoading.set(true);
    this.playerService.getById(id).subscribe({
      next: (player) => {
        this.form.patchValue({
          firstName: player.firstName,
          lastName: player.lastName,
          documentNumber: player.documentNumber,
          birthDate: player.birthDate.slice(0, 10),
          nationality: player.nationality,
          position: player.position,
          jerseyNumber: player.jerseyNumber,
          teamId: player.teamId,
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudo cargar el jugador.');
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

    const payload = this.form.value as PlayerCreateRequest;
    const id = this.playerId();
    const request$ = id
      ? this.playerService.update(id, payload)
      : this.playerService.create(payload);

    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.router.navigate(['/players']);
      },
      error: () => {
        this.errorMessage.set('No se pudo guardar el jugador. Verifica los datos e intenta nuevamente.');
        this.isSaving.set(false);
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/players']);
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
    if (control.errors['min']) return `El valor mínimo es ${control.errors['min'].min}.`;
    if (control.errors['max']) return `El valor máximo es ${control.errors['max'].max}.`;
    return 'Valor inválido.';
  }
}
