import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  computed,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatchService } from '../match.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import type { Match } from '../../../core/models';

/**
 * Dedicated component for registering the result of a played match.
 * Kept separate from MatchForm to enforce single-responsibility.
 * Only accessible when match status is 'scheduled' or 'in_progress'.
 */
@Component({
  selector: 'app-match-result',
  imports: [ReactiveFormsModule, LoadingSpinner],
  templateUrl: './match-result.html',
  styleUrl: './match-result.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchResult implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly matchService = inject(MatchService);

  readonly match = signal<Match | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly matchLabel = computed(() => {
    const m = this.match();
    return m ? `${m.homeTeamName} vs ${m.awayTeamName}` : '';
  });

  readonly form = this.fb.group({
    homeScore: [null as number | null, [Validators.required, Validators.min(0), Validators.max(999)]],
    awayScore: [null as number | null, [Validators.required, Validators.min(0), Validators.max(999)]],
    playedAt:  ['', [Validators.required]],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadMatch(Number(id));
  }

  private loadMatch(id: number): void {
    this.isLoading.set(true);
    this.matchService.getById(id).subscribe({
      next: (match) => {
        this.match.set(match);
        // Pre-fill playedAt with scheduled date as default
        this.form.patchValue({ playedAt: match.scheduledAt.slice(0, 16) });
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

    const matchId = this.match()?.id;
    if (!matchId) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const { homeScore, awayScore, playedAt } = this.form.value;

    this.matchService.registerResult(matchId, {
      homeScore: homeScore!,
      awayScore: awayScore!,
      playedAt: playedAt!,
    }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.router.navigate(['/matches']);
      },
      error: () => {
        this.errorMessage.set('No se pudo registrar el resultado. Intenta nuevamente.');
        this.isSaving.set(false);
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/matches']);
  }

  isFieldInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  getFieldError(field: string): string {
    const c = this.form.get(field);
    if (!c?.errors || !c.touched) return '';
    if (c.errors['required']) return 'Este campo es requerido.';
    if (c.errors['min']) return `El valor mínimo es ${c.errors['min'].min}.`;
    if (c.errors['max']) return `El valor máximo es ${c.errors['max'].max}.`;
    return 'Valor inválido.';
  }
}
