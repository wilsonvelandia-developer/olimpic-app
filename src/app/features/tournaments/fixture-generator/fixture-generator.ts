import {
  Component, ChangeDetectionStrategy, inject,
  signal, input, output, computed, OnInit,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray, FormGroup } from '@angular/forms';
import { FixtureGeneratorService } from './fixture-generator.service';
import { LoadingSpinner }          from '../../../shared/components/loading-spinner/loading-spinner';
import type { FixtureSlot, FixtureTeam } from './fixture.model';
import type { TournamentFormat } from '../../../core/models';

type WizardStep = 'teams' | 'config' | 'preview' | 'saving';

/**
 * Fixture generator wizard — 3 steps: teams → config → preview → save.
 * tournamentId is the UUID of the PHASE (not the tournament) used for match creation.
 */
@Component({
  selector: 'app-fixture-generator',
  imports: [ReactiveFormsModule, LoadingSpinner],
  templateUrl: './fixture-generator.html',
  styleUrl:    './fixture-generator.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FixtureGenerator implements OnInit {
  private readonly fb             = inject(FormBuilder);
  private readonly fixtureService = inject(FixtureGeneratorService);

  /** The UUID of the phase to create matches in. */
  readonly tournamentId   = input.required<string>();
  readonly tournamentFormat = input.required<TournamentFormat>();
  readonly tournamentName   = input<string>('');

  readonly saved     = output<number>();
  readonly cancelled = output<void>();

  readonly step          = signal<WizardStep>('teams');
  readonly isSaving      = signal<boolean>(false);
  readonly errorMessage  = signal<string | null>(null);
  readonly previewSlots  = signal<FixtureSlot[]>([]);
  readonly savedCount    = signal<number>(0);

  readonly previewByRound = computed(() => this.fixtureService.groupByRound(this.previewSlots()));
  readonly rounds         = computed(() => Object.keys(this.previewByRound()));
  readonly totalSlots     = computed(() => this.previewSlots().length);
  readonly isRoundRobin   = computed(() => this.tournamentFormat() === 'round_robin');

  readonly teamsForm = this.fb.group({
    teams: this.fb.array([this.createTeamRow(), this.createTeamRow()]),
  });

  get teamsArray(): FormArray { return this.teamsForm.get('teams') as FormArray; }

  readonly configForm = this.fb.group({
    startDate:         ['', [Validators.required]],
    daysBetweenRounds: [7,  [Validators.required, Validators.min(1), Validators.max(30)]],
    venue:             ['', [Validators.maxLength(100)]],
    twoLegs:           [false],
  });

  ngOnInit(): void {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    this.configForm.patchValue({ startDate: d.toISOString().slice(0, 10) });
  }

  private createTeamRow(): FormGroup {
    return this.fb.group({
      id:   ['', [Validators.required]],
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    });
  }

  addTeamRow(): void    { this.teamsArray.push(this.createTeamRow()); }
  removeTeamRow(i: number): void { if (this.teamsArray.length > 2) this.teamsArray.removeAt(i); }

  onNextToConfig(): void {
    if (this.teamsForm.invalid) { this.teamsForm.markAllAsTouched(); return; }
    this.step.set('config');
  }

  onBackToTeams(): void   { this.step.set('teams'); }
  onBackToConfig(): void  { this.step.set('config'); }

  onGeneratePreview(): void {
    if (this.configForm.invalid) { this.configForm.markAllAsTouched(); return; }

    const teams: FixtureTeam[] = (this.teamsArray.value as { id: string; name: string }[])
      .map((r) => ({ id: r.id, name: r.name }));

    const cfg = this.configForm.value;
    const slots = this.fixtureService.generatePreview({
      tournamentId:      this.tournamentId(),
      format:            this.tournamentFormat(),
      teams,
      startDate:         cfg.startDate!,
      daysBetweenRounds: cfg.daysBetweenRounds!,
      venue:             cfg.venue ?? '',
      twoLegs:           cfg.twoLegs ?? false,
    });

    this.previewSlots.set(slots);
    this.step.set('preview');
  }

  onConfirmSave(): void {
    this.step.set('saving');
    this.isSaving.set(true);
    this.errorMessage.set(null);

    this.fixtureService.saveFixture(this.tournamentId(), this.previewSlots()).subscribe({
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

  onCancel(): void { this.cancelled.emit(); }

  isTeamFieldInvalid(idx: number, field: string): boolean {
    const c = (this.teamsArray.at(idx) as FormGroup).get(field);
    return !!(c?.invalid && c?.touched);
  }

  isConfigFieldInvalid(field: string): boolean {
    const c = this.configForm.get(field);
    return !!(c?.invalid && c?.touched);
  }

  formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('es-CO', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
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
