import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  input,
  output,
  computed,
  OnInit,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray, FormGroup } from '@angular/forms';
import { FixtureGeneratorService } from './fixture-generator.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import type { FixtureSlot, FixtureTeam } from './fixture.model';
import type { TournamentFormat } from '../../../core/models';

type WizardStep = 'teams' | 'config' | 'preview' | 'saving';

/**
 * Fixture generator wizard.
 * Step 1 — Enter teams (name + id)
 * Step 2 — Configure schedule (start date, interval, venue, two-legs)
 * Step 3 — Preview generated fixture grouped by round
 * Step 4 — Confirm and save to API
 *
 * Emits `saved` when the fixture is persisted, `cancelled` when the user aborts.
 */
@Component({
  selector: 'app-fixture-generator',
  imports: [ReactiveFormsModule, LoadingSpinner],
  templateUrl: './fixture-generator.html',
  styleUrl: './fixture-generator.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FixtureGenerator implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly fixtureService = inject(FixtureGeneratorService);

  readonly tournamentId = input.required<number>();
  readonly tournamentFormat = input.required<TournamentFormat>();
  readonly tournamentName = input<string>('');

  readonly saved = output<number>();   // emits number of created matches
  readonly cancelled = output<void>();

  readonly step = signal<WizardStep>('teams');
  readonly isSaving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly previewSlots = signal<FixtureSlot[]>([]);
  readonly savedCount = signal<number>(0);

  readonly previewByRound = computed(() =>
    this.fixtureService.groupByRound(this.previewSlots()),
  );
  readonly rounds = computed(() => Object.keys(this.previewByRound()));
  readonly totalSlots = computed(() => this.previewSlots().length);

  readonly isRoundRobin = computed(() =>
    this.tournamentFormat() === 'round_robin',
  );

  // ── Step 1 form — teams ───────────────────────────────────────────────────
  readonly teamsForm = this.fb.group({
    teams: this.fb.array([
      this.createTeamRow(),
      this.createTeamRow(),
    ]),
  });

  get teamsArray(): FormArray {
    return this.teamsForm.get('teams') as FormArray;
  }

  // ── Step 2 form — config ──────────────────────────────────────────────────
  readonly configForm = this.fb.group({
    startDate:          ['', [Validators.required]],
    daysBetweenRounds:  [7, [Validators.required, Validators.min(1), Validators.max(30)]],
    venue:              ['', [Validators.maxLength(100)]],
    twoLegs:            [false],
  });

  ngOnInit(): void {
    // Set sensible default start date (today + 7 days)
    const defaultStart = new Date();
    defaultStart.setDate(defaultStart.getDate() + 7);
    this.configForm.patchValue({ startDate: defaultStart.toISOString().slice(0, 10) });
  }

  // ── Team rows ─────────────────────────────────────────────────────────────

  private createTeamRow(): FormGroup {
    return this.fb.group({
      id:   [null as number | null, [Validators.required, Validators.min(1)]],
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    });
  }

  addTeamRow(): void {
    this.teamsArray.push(this.createTeamRow());
  }

  removeTeamRow(index: number): void {
    if (this.teamsArray.length > 2) {
      this.teamsArray.removeAt(index);
    }
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  onNextToConfig(): void {
    if (this.teamsForm.invalid) {
      this.teamsForm.markAllAsTouched();
      return;
    }
    this.step.set('config');
  }

  onBackToTeams(): void {
    this.step.set('teams');
  }

  onGeneratePreview(): void {
    if (this.configForm.invalid) {
      this.configForm.markAllAsTouched();
      return;
    }

    const teams: FixtureTeam[] = this.teamsArray.value.map((r: { id: number; name: string }) => ({
      id:   r.id,
      name: r.name,
    }));

    const cfg = this.configForm.value;

    const slots = this.fixtureService.generatePreview({
      tournamentId:       this.tournamentId(),
      format:             this.tournamentFormat(),
      teams,
      startDate:          cfg.startDate!,
      daysBetweenRounds:  cfg.daysBetweenRounds!,
      venue:              cfg.venue ?? '',
      twoLegs:            cfg.twoLegs ?? false,
    });

    this.previewSlots.set(slots);
    this.step.set('preview');
  }

  onBackToConfig(): void {
    this.step.set('config');
  }

  onConfirmSave(): void {
    this.step.set('saving');
    this.isSaving.set(true);
    this.errorMessage.set(null);

    this.fixtureService
      .saveFixture(this.tournamentId(), this.previewSlots())
      .subscribe({
        next: ({ created }) => {
          this.isSaving.set(false);
          this.savedCount.set(created);
          this.saved.emit(created);
        },
        error: () => {
          this.errorMessage.set('No se pudieron guardar los partidos. Intenta nuevamente.');
          this.isSaving.set(false);
          this.step.set('preview');
        },
      });
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  isTeamFieldInvalid(index: number, field: string): boolean {
    const row = this.teamsArray.at(index) as FormGroup;
    const c = row.get(field);
    return !!(c?.invalid && c?.touched);
  }

  isConfigFieldInvalid(field: string): boolean {
    const c = this.configForm.get(field);
    return !!(c?.invalid && c?.touched);
  }

  formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('es-CO', {
      day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
    });
  }

  formatLabel(format: TournamentFormat): string {
    const labels: Record<TournamentFormat, string> = {
      round_robin:         'Todos contra todos',
      single_elimination:  'Eliminación simple',
      double_elimination:  'Eliminación doble',
      groups_knockout:     'Grupos + Eliminatoria',
    };
    return labels[format];
  }
}
