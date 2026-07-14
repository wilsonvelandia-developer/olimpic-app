import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatchService }  from '../match.service';
import { ApiService }    from '../../../core/services/api.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import type { Tournament } from '../../../core/models/tournament.model';

interface PhaseOption { id: string; name: string; }
interface TeamOption  { id: string; name: string; }

@Component({
  selector: 'app-match-form',
  imports: [ReactiveFormsModule, RouterLink, LoadingSpinner],
  templateUrl: './match-form.html',
  styleUrl: './match-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchForm implements OnInit {
  private readonly fb           = inject(FormBuilder);
  private readonly router       = inject(Router);
  private readonly route        = inject(ActivatedRoute);
  private readonly matchService = inject(MatchService);
  private readonly api          = inject(ApiService);

  readonly isEditMode   = signal<boolean>(false);
  readonly matchId      = signal<string | null>(null);
  readonly isLoading    = signal<boolean>(false);
  readonly isSaving     = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  /** Data for select dropdowns. */
  readonly tournaments = signal<Tournament[]>([]);
  readonly phases      = signal<PhaseOption[]>([]);
  readonly teams       = signal<TeamOption[]>([]);
  readonly venues      = signal<Array<{ id: string; name: string; address: string | null }>>([]);

  readonly selectedTournamentId = signal<string>('');

  readonly form = this.fb.group({
    tournamentId: [''],
    phaseId:      ['', [Validators.required]],
    homeTeamId:   ['', [Validators.required]],
    awayTeamId:   ['', [Validators.required]],
    scheduledAt:  ['' as string | null],
    venue:        [''],
  });

  ngOnInit(): void {
    // Load tournaments for the first dropdown
    this.api.get<Tournament[]>('/tournaments').subscribe({
      next: (res) => { if (res.success && res.data) this.tournaments.set(res.data); },
    });

    // Load venues for venue select
    this.api.get<Array<{ id: string; name: string; address: string | null }>>('/venues').subscribe({
      next: (res) => { if (res.success && res.data) this.venues.set(res.data); },
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.matchId.set(id);
      this.loadMatch(id);
    }
    const phaseId = this.route.snapshot.queryParamMap.get('phaseId');
    if (phaseId) this.form.patchValue({ phaseId });
  }

  /** When tournament changes, load its phases and teams. */
  onTournamentChange(tournamentId: string): void {
    this.selectedTournamentId.set(tournamentId);
    if (!tournamentId) {
      this.phases.set([]);
      this.teams.set([]);
      return;
    }

    // Load phases
    this.api.get<PhaseOption[]>(`/tournaments/${tournamentId}/phases`).subscribe({
      next: (res) => { if (res.success && res.data) this.phases.set(res.data); },
    });

    // Load teams
    this.api.get<TeamOption[]>(`/teams?tournamentId=${tournamentId}`).subscribe({
      next: (res) => { if (res.success && res.data) this.teams.set(res.data); },
    });
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
          venue:       (m as unknown as Record<string, unknown>)['venue'] as string ?? '',
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
    const scheduledAt = v.scheduledAt
      ? new Date(v.scheduledAt).toISOString() // Convert local datetime-local to ISO with Z
      : null;

    const payload = {
      phaseId:     v.phaseId!,
      homeTeamId:  v.homeTeamId!,
      awayTeamId:  v.awayTeamId!,
      scheduledAt,
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
