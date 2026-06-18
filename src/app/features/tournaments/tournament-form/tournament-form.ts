import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TournamentService } from '../tournament.service';
import { SportService }      from '../../sports/sport.service';
import { LoadingSpinner }    from '../../../shared/components/loading-spinner/loading-spinner';
import type { Sport, TournamentStatus } from '../../../core/models';

@Component({
  selector: 'app-tournament-form',
  imports: [ReactiveFormsModule, LoadingSpinner],
  templateUrl: './tournament-form.html',
  styleUrl:    './tournament-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentForm implements OnInit {
  private readonly fb                = inject(FormBuilder);
  private readonly router            = inject(Router);
  private readonly route             = inject(ActivatedRoute);
  private readonly tournamentService = inject(TournamentService);
  private readonly sportService      = inject(SportService);

  readonly isEditMode   = signal<boolean>(false);
  readonly tournamentId = signal<string | null>(null);
  readonly isLoading    = signal<boolean>(false);
  readonly isSaving     = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly sports       = signal<Sport[]>([]);
  /** True when status is not 'draft' — locks structural fields */
  readonly isLocked     = signal<boolean>(false);

  /** Tournament cups (Copa Oro, Copa Plata, etc.) */
  readonly cups = signal<Array<{ name: string; orderIndex: number; posFrom: number; posTo: number; hasSemifinals: boolean; hasThirdPlace: boolean }>>([]);

  /** Sanction types catalog */
  readonly sanctions = signal<Array<{ name: string; code: string; pointsEffect: number; monetaryValue: number; color: string; icon: string }>>([]);

  /** Tiebreaker criteria order */
  readonly tiebreakerCriteria = signal<string[]>(['points', 'goal_difference', 'goals_for', 'head_to_head', 'fair_play', 'draw']);

  readonly availableCriteria = [
    { id: 'points',          label: 'Mayor puntaje' },
    { id: 'goal_difference', label: 'Mejor diferencia de goles/puntos' },
    { id: 'goals_for',       label: 'Más goles/puntos a favor' },
    { id: 'goals_against',   label: 'Menos goles/puntos en contra' },
    { id: 'head_to_head',    label: 'Resultado entre sí' },
    { id: 'fair_play',       label: 'Mejor puntaje fair play' },
    { id: 'draw',            label: 'Sorteo' },
  ];

  readonly statusOptions: { value: TournamentStatus; label: string }[] = [
    { value: 'draft',     label: 'En creación' },
    { value: 'active',    label: 'En ejecución' },
    { value: 'finished',  label: 'Finalizado' },
    { value: 'suspended', label: 'Suspendido' },
    { value: 'cancelled', label: 'Cancelado' },
    { value: 'archived',  label: 'Archivado' },
  ];

  readonly form = this.fb.group({
    // Core
    name:    ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    sportId: ['' as string, [Validators.required]],
    season:  [''],
    status:  ['draft' as string],

    // Scheduling
    startDate:            [''],
    registrationDeadline: [''],
    expectedTeams:        [null as number | null, [Validators.min(2), Validators.max(512)]],
    numGroups:            [null as number | null, [Validators.min(1), Validators.max(64)]],

    // Category & age
    category:          [''],
    birthYearFrom:     [''],
    validateBirthFrom: [false],
    birthYearTo:       [''],
    validateBirthTo:   [false],

    // Contact
    contactPhone: [''],
    address:      [''],
    locationUrl:  [''],

    // Media
    imageUrl:          [''],
    description:       [''],
    entryFee:          [''],
    rulesFileUrl:      [''],
    invitationFileUrl: [''],

    // Social
    instagramUrl: [''],
    facebookUrl:  [''],
    tiktokUrl:    [''],
    youtubeUrl:   [''],

    // Fixture config
    matchDurationMinutes: [90, [Validators.min(30), Validators.max(300)]],
    matchesPerDay:        [6, [Validators.min(1), Validators.max(20)]],
    firstMatchTime:       ['08:00'],
    numVenues:            [1, [Validators.min(1), Validators.max(10)]],
    venueName:            [''],

    // Standings config
    pointsWin:              [3, [Validators.min(0)]],
    pointsDraw:             [1, [Validators.min(0)]],
    pointsLoss:             [0, [Validators.min(0)]],
    initialFairPlayScore:   [1000],
    teamsPerGroupQualify:   [2, [Validators.min(1), Validators.max(10)]],
  });

  ngOnInit(): void {
    this.sportService.getAll().subscribe({ next: (d) => this.sports.set(d) });

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.tournamentId.set(id);
      this.loadTournament(id);
    }
  }

  private loadTournament(id: string): void {
    this.isLoading.set(true);
    this.tournamentService.getById(id).subscribe({
      next: (t) => {
        this.form.patchValue({
          name:                 t.name,
          sportId:              t.sportId,
          season:               t.season ?? '',
          status:               t.status,
          startDate:            this.toDateInput(t.startDate),
          registrationDeadline: this.toDateInput(t.registrationDeadline),
          expectedTeams:        t.expectedTeams,
          numGroups:            t.numGroups,
          category:             t.category ?? '',
          birthYearFrom:        this.toDateInput(t.birthYearFrom),
          validateBirthFrom:    t.validateBirthFrom,
          birthYearTo:          this.toDateInput(t.birthYearTo),
          validateBirthTo:      t.validateBirthTo,
          contactPhone:         t.contactPhone ?? '',
          address:              t.address ?? '',
          locationUrl:          t.locationUrl ?? '',
          imageUrl:             t.imageUrl ?? '',
          description:          t.description ?? '',
          entryFee:             t.entryFee ?? '',
          rulesFileUrl:         t.rulesFileUrl ?? '',
          invitationFileUrl:    t.invitationFileUrl ?? '',
          instagramUrl:         t.instagramUrl ?? '',
          facebookUrl:          t.facebookUrl ?? '',
          tiktokUrl:            t.tiktokUrl ?? '',
          youtubeUrl:           t.youtubeUrl ?? '',
          // Fixture config
          matchDurationMinutes: t.matchDurationMinutes ?? 90,
          matchesPerDay:        t.matchesPerDay ?? 6,
          firstMatchTime:       t.firstMatchTime ?? '08:00',
          numVenues:            t.numVenues ?? 1,
          venueName:            t.venueName ?? '',
          // Standings config
          pointsWin:            t.pointsConfig?.win ?? 3,
          pointsDraw:           t.pointsConfig?.draw ?? 1,
          pointsLoss:           t.pointsConfig?.loss ?? 0,
          initialFairPlayScore: t.initialFairPlayScore ?? 1000,
          teamsPerGroupQualify: t.teamsPerGroupQualify ?? 2,
        });
        // Load tiebreaker criteria
        if (t.tiebreakerCriteria) this.tiebreakerCriteria.set(t.tiebreakerCriteria);

        this.isLocked.set(t.status !== 'draft');
        this.isLoading.set(false);
      },
      error: () => { this.errorMessage.set('No se pudo cargar el torneo.'); this.isLoading.set(false); },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSaving.set(true);
    this.errorMessage.set(null);

    const v = this.form.value;
    const payload: Record<string, unknown> = {
      sportId:              v.sportId,
      name:                 v.name,
      season:               v.season || null,
      status:               v.status || 'draft',
      startDate:            v.startDate || null,
      registrationDeadline: v.registrationDeadline || null,
      expectedTeams:        v.expectedTeams ?? null,
      numGroups:            v.numGroups ?? null,
      category:             v.category || null,
      birthYearFrom:        v.birthYearFrom || null,
      validateBirthFrom:    v.validateBirthFrom ?? false,
      birthYearTo:          v.birthYearTo || null,
      validateBirthTo:      v.validateBirthTo ?? false,
      contactPhone:         v.contactPhone || null,
      address:              v.address || null,
      locationUrl:          v.locationUrl || null,
      imageUrl:             v.imageUrl || null,
      description:          v.description || null,
      entryFee:             v.entryFee || null,
      rulesFileUrl:         v.rulesFileUrl || null,
      invitationFileUrl:    v.invitationFileUrl || null,
      instagramUrl:         v.instagramUrl || null,
      facebookUrl:          v.facebookUrl || null,
      tiktokUrl:            v.tiktokUrl || null,
      youtubeUrl:           v.youtubeUrl || null,
      // Fixture config
      matchDurationMinutes: v.matchDurationMinutes ?? 90,
      matchesPerDay:        v.matchesPerDay ?? 6,
      firstMatchTime:       v.firstMatchTime || '08:00',
      numVenues:            v.numVenues ?? 1,
      venueName:            v.venueName || null,
      // Standings config
      pointsConfig: { win: v.pointsWin ?? 3, draw: v.pointsDraw ?? 1, loss: v.pointsLoss ?? 0 },
      tiebreakerCriteria:   this.tiebreakerCriteria(),
      initialFairPlayScore: v.initialFairPlayScore ?? 1000,
      teamsPerGroupQualify: v.teamsPerGroupQualify ?? 2,
    };

    const id = this.tournamentId();
    const req$ = id
      ? this.tournamentService.update(id, payload)
      : this.tournamentService.create(payload as unknown as import('../../../core/models').TournamentCreateRequest);

    req$.subscribe({
      next:  () => { this.isSaving.set(false); this.router.navigate(['/tournaments']); },
      error: () => { this.errorMessage.set('No se pudo guardar el torneo.'); this.isSaving.set(false); },
    });
  }

  onCancel(): void { this.router.navigate(['/tournaments']); }

  isFieldInvalid(f: string): boolean { const c = this.form.get(f); return !!(c?.invalid && c?.touched); }
  getFieldError(f: string): string {
    const c = this.form.get(f);
    if (!c?.errors || !c.touched) return '';
    if (c.errors['required'])  return 'Este campo es requerido.';
    if (c.errors['minlength']) return `Mínimo ${c.errors['minlength'].requiredLength} caracteres.`;
    if (c.errors['maxlength']) return `Máximo ${c.errors['maxlength'].requiredLength} caracteres.`;
    if (c.errors['min'])       return `Valor mínimo: ${c.errors['min'].min}.`;
    if (c.errors['max'])       return `Valor máximo: ${c.errors['max'].max}.`;
    return 'Valor inválido.';
  }

  /** Converts ISO datetime string to YYYY-MM-DD for date inputs. */
  private toDateInput(value: string | null | undefined): string {
    if (!value) return '';
    return value.slice(0, 10);
  }

  // ── Tiebreaker criteria management ────────────────────────────────────────

  onMoveCriterionUp(index: number): void {
    if (index === 0) return;
    const list = [...this.tiebreakerCriteria()];
    [list[index - 1], list[index]] = [list[index], list[index - 1]];
    this.tiebreakerCriteria.set(list);
  }

  onMoveCriterionDown(index: number): void {
    const list = [...this.tiebreakerCriteria()];
    if (index >= list.length - 1) return;
    [list[index], list[index + 1]] = [list[index + 1], list[index]];
    this.tiebreakerCriteria.set(list);
  }

  getCriterionLabel(id: string): string {
    return this.availableCriteria.find((c) => c.id === id)?.label ?? id;
  }
}
