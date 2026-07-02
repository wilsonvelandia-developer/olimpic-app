import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TeamService }    from '../team.service';
import { ApiService }     from '../../../core/services/api.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import type { Tournament } from '../../../core/models/tournament.model';

@Component({
  selector: 'app-team-form',
  imports: [ReactiveFormsModule, LoadingSpinner],
  templateUrl: './team-form.html',
  styleUrl: './team-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamForm implements OnInit {
  private readonly fb          = inject(FormBuilder);
  private readonly router      = inject(Router);
  private readonly route       = inject(ActivatedRoute);
  private readonly teamService = inject(TeamService);
  private readonly api         = inject(ApiService);

  readonly isEditMode   = signal<boolean>(false);
  readonly teamId       = signal<string | null>(null);
  readonly isLoading    = signal<boolean>(false);
  readonly isSaving     = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly tournaments  = signal<Tournament[]>([]);

  readonly statusOptions = [
    { value: 'active',    label: 'Activo' },
    { value: 'inactive',  label: 'Inactivo' },
    { value: 'suspended', label: 'Suspendido' },
  ];

  readonly form = this.fb.group({
    tournamentId:   ['' as string | null],
    name:           ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    shortName:      [''],
    variant:        [''],
    imageUrl:       [''],
    phone:          [''],
    email:          [''],
    instagramUrl:   [''],
    facebookUrl:    [''],
    tiktokUrl:      [''],
    youtubeUrl:     [''],
    colorPrimary:   ['#1e40af'],
    colorSecondary: ['#ffffff'],
    status:         ['active'],
  });

  ngOnInit(): void {
    // Load tournaments for the dropdown
    this.api.get<Tournament[]>('/tournaments').subscribe({
      next: (res) => { if (res.success && res.data) this.tournaments.set(res.data); },
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.teamId.set(id);
      this.loadTeam(id);
    }
    const tournamentId = this.route.snapshot.queryParamMap.get('tournamentId');
    if (tournamentId) this.form.patchValue({ tournamentId });
  }

  private loadTeam(id: string): void {
    this.isLoading.set(true);
    this.teamService.getById(id).subscribe({
      next: (t) => {
        this.form.patchValue({
          tournamentId:   t.tournamentId ?? '',
          name:           t.name,
          shortName:      t.shortName ?? '',
          variant:        t.variant ?? '',
          imageUrl:       t.imageUrl ?? '',
          phone:          t.phone ?? '',
          email:          t.email ?? '',
          instagramUrl:   t.instagramUrl ?? '',
          facebookUrl:    t.facebookUrl ?? '',
          tiktokUrl:      t.tiktokUrl ?? '',
          youtubeUrl:     t.youtubeUrl ?? '',
          colorPrimary:   t.colorPrimary ?? '#1e40af',
          colorSecondary: t.colorSecondary ?? '#ffffff',
          status:         t.status ?? 'active',
        });
        this.isLoading.set(false);
      },
      error: () => { this.errorMessage.set('No se pudo cargar el equipo.'); this.isLoading.set(false); },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSaving.set(true);
    this.errorMessage.set(null);

    const v = this.form.value;
    const id = this.teamId();

    if (id) {
      this.teamService.update(id, {
        name:           v.name!,
        shortName:      v.shortName || null,
        variant:        v.variant || null,
        imageUrl:       v.imageUrl || null,
        phone:          v.phone || null,
        email:          v.email || null,
        instagramUrl:   v.instagramUrl || null,
        facebookUrl:    v.facebookUrl || null,
        tiktokUrl:      v.tiktokUrl || null,
        youtubeUrl:     v.youtubeUrl || null,
        colorPrimary:   v.colorPrimary || null,
        colorSecondary: v.colorSecondary || null,
        status:         (v.status as 'active' | 'inactive' | 'suspended') || 'active',
      }).subscribe({
        next:  () => { this.isSaving.set(false); this.router.navigate(['/teams']); },
        error: () => { this.errorMessage.set('No se pudo guardar el equipo.'); this.isSaving.set(false); },
      });
    } else {
      this.teamService.create({
        tournamentId:   v.tournamentId || null,
        name:           v.name!,
        shortName:      v.shortName || null,
        variant:        v.variant || null,
        imageUrl:       v.imageUrl || null,
        phone:          v.phone || null,
        email:          v.email || null,
        instagramUrl:   v.instagramUrl || null,
        facebookUrl:    v.facebookUrl || null,
        tiktokUrl:      v.tiktokUrl || null,
        youtubeUrl:     v.youtubeUrl || null,
        colorPrimary:   v.colorPrimary || null,
        colorSecondary: v.colorSecondary || null,
      }).subscribe({
        next:  () => { this.isSaving.set(false); this.router.navigate(['/teams']); },
        error: () => { this.errorMessage.set('No se pudo guardar el equipo.'); this.isSaving.set(false); },
      });
    }
  }

  onCancel(): void { this.router.navigate(['/teams']); }

  isFieldInvalid(f: string): boolean { const c = this.form.get(f); return !!(c?.invalid && c?.touched); }
  getFieldError(f: string): string {
    const c = this.form.get(f);
    if (!c?.errors || !c.touched) return '';
    if (c.errors['required'])  return 'Este campo es requerido.';
    if (c.errors['minlength']) return `Mínimo ${c.errors['minlength'].requiredLength} caracteres.`;
    if (c.errors['maxlength']) return `Máximo ${c.errors['maxlength'].requiredLength} caracteres.`;
    return 'Valor inválido.';
  }
}
