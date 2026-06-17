import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatchService }  from '../match.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-match-form',
  imports: [ReactiveFormsModule, LoadingSpinner],
  templateUrl: './match-form.html',
  styleUrl: './match-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchForm implements OnInit {
  private readonly fb           = inject(FormBuilder);
  private readonly router       = inject(Router);
  private readonly route        = inject(ActivatedRoute);
  private readonly matchService = inject(MatchService);

  readonly isEditMode   = signal<boolean>(false);
  readonly matchId      = signal<string | null>(null);
  readonly isLoading    = signal<boolean>(false);
  readonly isSaving     = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    phaseId:     ['', [Validators.required]],
    homeTeamId:  ['', [Validators.required]],
    awayTeamId:  ['', [Validators.required]],
    scheduledAt: ['' as string | null],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.matchId.set(id);
      this.loadMatch(id);
    }
    const phaseId = this.route.snapshot.queryParamMap.get('phaseId');
    if (phaseId) this.form.patchValue({ phaseId });
  }

  private loadMatch(id: string): void {
    this.isLoading.set(true);
    this.matchService.getById(id).subscribe({
      next: (detail) => {
        const m = detail.match;
        this.form.patchValue({
          phaseId:     m.phaseId,
          homeTeamId:  m.homeTeamId,
          awayTeamId:  m.awayTeamId,
          scheduledAt: m.scheduledAt ? m.scheduledAt.slice(0, 16) : null,
        });
        this.isLoading.set(false);
      },
      error: () => { this.errorMessage.set('No se pudo cargar el partido.'); this.isLoading.set(false); },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSaving.set(true);
    this.errorMessage.set(null);

    const v = this.form.value;
    const payload = {
      phaseId:     v.phaseId!,
      homeTeamId:  v.homeTeamId!,
      awayTeamId:  v.awayTeamId!,
      scheduledAt: v.scheduledAt || null,
    };

    this.matchService.create(payload).subscribe({
      next:  () => { this.isSaving.set(false); this.router.navigate(['/matches']); },
      error: () => { this.errorMessage.set('No se pudo guardar el partido.'); this.isSaving.set(false); },
    });
  }

  onCancel(): void { this.router.navigate(['/matches']); }

  isFieldInvalid(f: string): boolean { const c = this.form.get(f); return !!(c?.invalid && c?.touched); }
  getFieldError(f: string): string {
    const c = this.form.get(f);
    if (!c?.errors || !c.touched) return '';
    if (c.errors['required']) return 'Este campo es requerido.';
    return 'Valor inválido.';
  }
}
