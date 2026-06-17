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
        });
        // Lock structural fields if not in draft
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
    // Handle both "2026-08-01" and "2026-08-01T05:00:00.000Z" formats
    return value.slice(0, 10);
  }
}
