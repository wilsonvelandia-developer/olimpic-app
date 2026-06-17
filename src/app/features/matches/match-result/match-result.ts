import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit, computed,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatchService }  from '../match.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import type { Match } from '../../../core/models';

/**
 * Registers the result of a match by starting it and updating period scores.
 * Uses the backend lifecycle: start → updatePeriodScore (period 1) → finish.
 */
@Component({
  selector: 'app-match-result',
  imports: [ReactiveFormsModule, LoadingSpinner],
  templateUrl: './match-result.html',
  styleUrl: './match-result.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchResult implements OnInit {
  private readonly fb           = inject(FormBuilder);
  private readonly router       = inject(Router);
  private readonly route        = inject(ActivatedRoute);
  private readonly matchService = inject(MatchService);

  readonly match        = signal<Match | null>(null);
  readonly isLoading    = signal<boolean>(false);
  readonly isSaving     = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly matchLabel = computed(() => {
    const m = this.match();
    if (!m) return '';
    return `${m.homeTeamName ?? m.homeTeamId} vs ${m.awayTeamName ?? m.awayTeamId}`;
  });

  readonly form = this.fb.group({
    homeScore: [null as number | null, [Validators.required, Validators.min(0), Validators.max(999)]],
    awayScore: [null as number | null, [Validators.required, Validators.min(0), Validators.max(999)]],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadMatch(id);
  }

  private loadMatch(id: string): void {
    this.isLoading.set(true);
    this.matchService.getById(id).subscribe({
      next: (detail) => {
        this.match.set(detail.match);
        this.isLoading.set(false);
      },
      error: () => { this.errorMessage.set('No se pudo cargar el partido.'); this.isLoading.set(false); },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const matchId = this.match()?.id;
    if (!matchId) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const { homeScore, awayScore } = this.form.value;

    // Start → update period 1 score → finish
    this.matchService.start(matchId).subscribe({
      next: () => {
        this.matchService.updatePeriodScore(matchId, 1, { homeScore: homeScore!, awayScore: awayScore! }).subscribe({
          next: () => {
            this.matchService.finish(matchId).subscribe({
              next:  () => { this.isSaving.set(false); this.router.navigate(['/matches']); },
              error: () => { this.errorMessage.set('No se pudo finalizar el partido.'); this.isSaving.set(false); },
            });
          },
          error: () => { this.errorMessage.set('No se pudo registrar el marcador.'); this.isSaving.set(false); },
        });
      },
      error: () => { this.errorMessage.set('No se pudo iniciar el partido.'); this.isSaving.set(false); },
    });
  }

  onCancel(): void { this.router.navigate(['/matches']); }

  isFieldInvalid(f: string): boolean { const c = this.form.get(f); return !!(c?.invalid && c?.touched); }
  getFieldError(f: string): string {
    const c = this.form.get(f);
    if (!c?.errors || !c.touched) return '';
    if (c.errors['required']) return 'Este campo es requerido.';
    if (c.errors['min'])      return `El valor mínimo es ${c.errors['min'].min}.`;
    if (c.errors['max'])      return `El valor máximo es ${c.errors['max'].max}.`;
    return 'Valor inválido.';
  }
}
