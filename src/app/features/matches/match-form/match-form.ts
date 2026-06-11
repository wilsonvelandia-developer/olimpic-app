import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatchService } from '../match.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import type { MatchCreateRequest } from '../match.service';

/**
 * Match scheduling form (create / edit).
 * Result registration is handled by a separate component (match-result).
 */
@Component({
  selector: 'app-match-form',
  imports: [ReactiveFormsModule, LoadingSpinner],
  templateUrl: './match-form.html',
  styleUrl: './match-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly matchService = inject(MatchService);

  readonly isEditMode = signal<boolean>(false);
  readonly matchId = signal<number | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    tournamentId: [null as number | null, [Validators.required, Validators.min(1)]],
    homeTeamId:   [null as number | null, [Validators.required, Validators.min(1)]],
    awayTeamId:   [null as number | null, [Validators.required, Validators.min(1)]],
    scheduledAt:  ['', [Validators.required]],
    round:        ['', [Validators.required, Validators.maxLength(60)]],
    venue:        ['', [Validators.maxLength(100)]],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.matchId.set(Number(id));
      this.loadMatch(Number(id));
    }
    // Pre-fill tournamentId if provided as query param
    const tournamentId = this.route.snapshot.queryParamMap.get('tournamentId');
    if (tournamentId) this.form.patchValue({ tournamentId: Number(tournamentId) });
  }

  private loadMatch(id: number): void {
    this.isLoading.set(true);
    this.matchService.getById(id).subscribe({
      next: (match) => {
        this.form.patchValue({
          tournamentId: match.tournamentId,
          homeTeamId:   match.homeTeamId,
          awayTeamId:   match.awayTeamId,
          scheduledAt:  match.scheduledAt.slice(0, 16), // datetime-local format
          round:        match.round,
          venue:        match.venue,
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudo cargar el partido.');
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

    const payload = this.form.value as MatchCreateRequest;
    const id = this.matchId();
    const request$ = id
      ? this.matchService.update(id, payload)
      : this.matchService.create(payload);

    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.router.navigate(['/matches']);
      },
      error: () => {
        this.errorMessage.set('No se pudo guardar el partido. Verifica los datos e intenta nuevamente.');
        this.isSaving.set(false);
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/matches']);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && control?.touched);
  }

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.errors || !control.touched) return '';
    if (control.errors['required']) return 'Este campo es requerido.';
    if (control.errors['min']) return `El valor mínimo es ${control.errors['min'].min}.`;
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres.`;
    return 'Valor inválido.';
  }
}
