import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TournamentService, type StaffMember } from '../tournament.service';
import { SportService }      from '../../sports/sport.service';
import { ApiService }        from '../../../core/services/api.service';
import { ToastService }      from '../../../shared/components/toast/toast.service';
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

  // ── Cup management ────────────────────────────────────────────────────────

  onAddCup(): void {
    const list = this.cups();
    this.cups.set([...list, { name: '', orderIndex: list.length + 1, posFrom: 1, posTo: 2, hasSemifinals: true, hasThirdPlace: true }]);
  }

  onRemoveCup(index: number): void {
    this.cups.set(this.cups().filter((_, i) => i !== index));
  }

  onCupChange(index: number, field: string, value: unknown): void {
    const list = [...this.cups()];
    list[index] = { ...list[index], [field]: value };
    this.cups.set(list);
  }

  // ── Sanction management ───────────────────────────────────────────────────

  onAddSanction(): void {
    this.sanctions.set([...this.sanctions(), { name: '', code: '', pointsEffect: -100, monetaryValue: 0, color: '#FFFF00', icon: '🟡' }]);
  }

  onRemoveSanction(index: number): void {
    this.sanctions.set(this.sanctions().filter((_, i) => i !== index));
  }

  onSanctionChange(index: number, field: string, value: unknown): void {
    const list = [...this.sanctions()];
    list[index] = { ...list[index], [field]: value };
    this.sanctions.set(list);
  }

  // ── Staff management ──────────────────────────────────────────────────────

  private readonly apiService = inject(ApiService);
  private readonly toast = inject(ToastService);

  /** Staff currently assigned to the tournament. */
  readonly staff = signal<StaffMember[]>([]);

  /** Available users (loaded for assignment). */
  readonly availableUsers = signal<Array<{ id: string; name: string; email: string }>>([]);

  /** New staff form state. */
  readonly newStaffUserId = signal<string>('');
  readonly newStaffRole = signal<string>('referee');

  readonly staffRoleOptions = [
    { value: 'organizer', label: 'Organizador' },
    { value: 'referee',   label: 'Árbitro' },
    { value: 'observer',  label: 'Observador' },
  ];

  /** Load staff for the current tournament. */
  private loadStaff(tournamentId: string): void {
    this.tournamentService.getStaff(tournamentId).subscribe({
      next: (data) => this.staff.set(data ?? []),
    });
  }

  /** Load available users for assignment. */
  private loadAvailableUsers(): void {
    this.apiService.get<Array<{ id: string; name: string; email: string }>>('/users').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          // Map to simple format — the users endpoint returns full user objects
          const users = (res.data as Array<Record<string, unknown>>).map((u) => ({
            id: u['id'] as string,
            name: (u['name'] as string) || `${u['firstName'] ?? ''} ${u['firstLastName'] ?? ''}`.trim() || (u['email'] as string),
            email: u['email'] as string,
          }));
          this.availableUsers.set(users);
        }
      },
      error: () => {
        // If users endpoint fails, staff management still works but without user search
        this.availableUsers.set([]);
      },
    });
  }

  onAddStaff(): void {
    const userId = this.newStaffUserId();
    const role = this.newStaffRole();
    const tournamentId = this.tournamentId();
    if (!userId || !role || !tournamentId) {
      this.toast.warning('Selecciona un usuario y un rol');
      return;
    }

    this.tournamentService.addStaff(tournamentId, userId, role).subscribe({
      next: (data) => {
        this.staff.set(data ?? []);
        this.newStaffUserId.set('');
        this.toast.success('Staff agregado');
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'No se pudo agregar el staff. Verifica que el usuario exista.';
        this.toast.error(msg);
      },
    });
  }

  onRemoveStaff(userId: string): void {
    const tournamentId = this.tournamentId();
    if (!tournamentId) return;

    this.tournamentService.removeStaff(tournamentId, userId).subscribe({
      next: () => {
        this.staff.update((list) => list.filter((s) => s.userId !== userId));
        this.toast.success('Staff removido');
      },
      error: () => this.toast.error('No se pudo remover el staff'),
    });
  }

  getStaffRoleLabel(role: string): string {
    return this.staffRoleOptions.find((r) => r.value === role)?.label ?? role;
  }

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

    // Rule overrides (per-tournament, NULL = use sport default)
    playersPerTeamOverride:      [null as number | null, [Validators.min(1), Validators.max(50)]],
    minPlayersPerTeam:           [null as number | null, [Validators.min(1), Validators.max(50)]],
    hasSetsOverride:             [null as boolean | null],
    setsToWinOverride:           [null as number | null, [Validators.min(1), Validators.max(10)]],
    pointsPerSetOverride:        [null as number | null, [Validators.min(1), Validators.max(200)]],
    decisiveSetPointsOverride:   [null as number | null, [Validators.min(1), Validators.max(200)]],
    winMarginOverride:           [null as number | null, [Validators.min(1), Validators.max(10)]],
    periodsPerMatchOverride:     [null as number | null, [Validators.min(1), Validators.max(10)]],
    maxSubstitutionsOverride:    [null as number | null, [Validators.min(-1), Validators.max(50)]],
    hasRotationOverride:         [null as boolean | null],
    allowReentry:                [false],
    enforcePairedSubs:           [false],
    liberoUnlimitedSubs:         [true],
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
          // Rule overrides
          playersPerTeamOverride:    (t as unknown as Record<string, unknown>)['playersPerTeamOverride'] as number | null ?? null,
          minPlayersPerTeam:         (t as unknown as Record<string, unknown>)['minPlayersPerTeam'] as number | null ?? null,
          hasSetsOverride:           (t as unknown as Record<string, unknown>)['hasSetsOverride'] as boolean | null ?? null,
          setsToWinOverride:         (t as unknown as Record<string, unknown>)['setsToWinOverride'] as number | null ?? null,
          pointsPerSetOverride:      (t as unknown as Record<string, unknown>)['pointsPerSetOverride'] as number | null ?? null,
          decisiveSetPointsOverride: (t as unknown as Record<string, unknown>)['decisiveSetPointsOverride'] as number | null ?? null,
          winMarginOverride:         (t as unknown as Record<string, unknown>)['winMarginOverride'] as number | null ?? null,
          periodsPerMatchOverride:   (t as unknown as Record<string, unknown>)['periodsPerMatchOverride'] as number | null ?? null,
          maxSubstitutionsOverride:  (t as unknown as Record<string, unknown>)['maxSubstitutionsOverride'] as number | null ?? null,
          hasRotationOverride:       (t as unknown as Record<string, unknown>)['hasRotationOverride'] as boolean | null ?? null,
          allowReentry:              (t as unknown as Record<string, unknown>)['allowReentry'] as boolean ?? false,
          enforcePairedSubs:         (t as unknown as Record<string, unknown>)['enforcePairedSubs'] as boolean ?? false,
          liberoUnlimitedSubs:       (t as unknown as Record<string, unknown>)['liberoUnlimitedSubs'] as boolean ?? true,
        });
        // Load tiebreaker criteria
        if (t.tiebreakerCriteria) this.tiebreakerCriteria.set(t.tiebreakerCriteria);

        this.isLocked.set(t.status !== 'draft');

        // Load cups, sanction types, and staff
        forkJoin({
          cups:      this.tournamentService.getCups(id),
          sanctions: this.tournamentService.getSanctionTypes(id),
        }).subscribe({
          next: ({ cups, sanctions }) => {
            this.cups.set(cups.map((c) => ({
              name: c.name,
              orderIndex: c.orderIndex,
              posFrom: c.groupPositionsFrom,
              posTo: c.groupPositionsTo,
              hasSemifinals: c.hasSemifinals,
              hasThirdPlace: c.hasThirdPlace,
            })));
            this.sanctions.set(sanctions.map((s) => ({
              name: s.name,
              code: s.code,
              pointsEffect: s.pointsEffect,
              monetaryValue: s.monetaryValue,
              color: s.color,
              icon: s.icon,
            })));
            this.isLoading.set(false);
          },
          error: () => { this.isLoading.set(false); },
        });

        // Load staff and available users (parallel, non-blocking)
        this.loadStaff(id);
        this.loadAvailableUsers();
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
      // Rule overrides (per-tournament)
      playersPerTeamOverride:    v.playersPerTeamOverride ?? null,
      minPlayersPerTeam:         v.minPlayersPerTeam ?? null,
      hasSetsOverride:           v.hasSetsOverride ?? null,
      setsToWinOverride:         v.setsToWinOverride ?? null,
      pointsPerSetOverride:      v.pointsPerSetOverride ?? null,
      decisiveSetPointsOverride: v.decisiveSetPointsOverride ?? null,
      winMarginOverride:         v.winMarginOverride ?? null,
      periodsPerMatchOverride:   v.periodsPerMatchOverride ?? null,
      maxSubstitutionsOverride:  v.maxSubstitutionsOverride ?? null,
      hasRotationOverride:       v.hasRotationOverride ?? null,
      allowReentry:              v.allowReentry ?? false,
      enforcePairedSubs:         v.enforcePairedSubs ?? false,
      liberoUnlimitedSubs:       v.liberoUnlimitedSubs ?? true,
    };

    const id = this.tournamentId();
    const req$ = id
      ? this.tournamentService.update(id, payload)
      : this.tournamentService.create(payload as unknown as import('../../../core/models').TournamentCreateRequest);

    req$.subscribe({
      next: (saved) => {
        const tournamentId = id ?? saved.id;
        this.saveCupsAndSanctions(tournamentId);
      },
      error: () => { this.errorMessage.set('No se pudo guardar el torneo.'); this.isSaving.set(false); },
    });
  }

  /**
   * Saves cups and sanction types for the tournament after the main save.
   * Uses forkJoin to send both requests in parallel.
   */
  private saveCupsAndSanctions(tournamentId: string): void {
    const cupsPayload = this.cups().map((c, idx) => ({
      name: c.name,
      orderIndex: c.orderIndex || idx + 1,
      groupPositionsFrom: c.posFrom,
      groupPositionsTo: c.posTo,
      hasSemifinals: c.hasSemifinals,
      hasThirdPlace: c.hasThirdPlace,
    }));

    const sanctionsPayload = this.sanctions().map((s) => ({
      name: s.name,
      code: s.code,
      pointsEffect: s.pointsEffect,
      monetaryValue: s.monetaryValue,
      color: s.color,
      icon: s.icon,
    }));

    // If no cups or sanctions, just navigate
    if (cupsPayload.length === 0 && sanctionsPayload.length === 0) {
      this.isSaving.set(false);
      this.router.navigate(['/tournaments']);
      return;
    }

    const requests: Record<string, import('rxjs').Observable<unknown>> = {};
    if (cupsPayload.length > 0) {
      requests['cups'] = this.tournamentService.saveCups(tournamentId, cupsPayload);
    }
    if (sanctionsPayload.length > 0) {
      requests['sanctions'] = this.tournamentService.saveSanctionTypes(tournamentId, sanctionsPayload);
    }

    forkJoin(requests).subscribe({
      next: () => { this.isSaving.set(false); this.router.navigate(['/tournaments']); },
      error: () => {
        this.errorMessage.set('Torneo guardado, pero hubo un error al guardar copas/sanciones.');
        this.isSaving.set(false);
      },
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
