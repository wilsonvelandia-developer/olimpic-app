import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PlayerService } from '../player.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-player-form',
  imports: [ReactiveFormsModule, LoadingSpinner],
  templateUrl: './player-form.html',
  styleUrl: './player-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerForm implements OnInit {
  private readonly fb            = inject(FormBuilder);
  private readonly router        = inject(Router);
  private readonly route         = inject(ActivatedRoute);
  private readonly playerService = inject(PlayerService);

  readonly isEditMode   = signal<boolean>(false);
  readonly playerId     = signal<string | null>(null);
  readonly teamId       = signal<string>('');
  readonly isLoading    = signal<boolean>(false);
  readonly isSaving     = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    name:         ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    jerseyNumber: [null as number | null, [Validators.required, Validators.min(0), Validators.max(999)]],
    position:     ['' as string | null],
  });

  ngOnInit(): void {
    const teamIdParam = this.route.snapshot.queryParamMap.get('teamId')
      ?? this.route.snapshot.paramMap.get('teamId') ?? '';
    this.teamId.set(teamIdParam);

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.playerId.set(id);
      this.loadPlayer(teamIdParam, id);
    }
  }

  private loadPlayer(teamId: string, playerId: string): void {
    this.isLoading.set(true);
    this.playerService.getById(teamId, playerId).subscribe({
      next: (p) => {
        this.form.patchValue({ name: p.name, jerseyNumber: p.jerseyNumber, position: p.position });
        this.isLoading.set(false);
      },
      error: () => { this.errorMessage.set('No se pudo cargar el jugador.'); this.isLoading.set(false); },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSaving.set(true);
    this.errorMessage.set(null);

    const v = this.form.value;
    const payload = {
      name:         v.name!,
      jerseyNumber: v.jerseyNumber!,
      position:     v.position || null,
    };

    const teamId   = this.teamId();
    const playerId = this.playerId();

    const req$ = playerId
      ? this.playerService.update(teamId, playerId, payload)
      : this.playerService.create(teamId, payload);

    req$.subscribe({
      next:  () => { this.isSaving.set(false); this.router.navigate(['/teams', teamId]); },
      error: () => { this.errorMessage.set('No se pudo guardar el jugador.'); this.isSaving.set(false); },
    });
  }

  onCancel(): void { this.router.navigate(['/teams', this.teamId()]); }

  isFieldInvalid(f: string): boolean { const c = this.form.get(f); return !!(c?.invalid && c?.touched); }
  getFieldError(f: string): string {
    const c = this.form.get(f);
    if (!c?.errors || !c.touched) return '';
    if (c.errors['required'])  return 'Este campo es requerido.';
    if (c.errors['minlength']) return `Mínimo ${c.errors['minlength'].requiredLength} caracteres.`;
    if (c.errors['maxlength']) return `Máximo ${c.errors['maxlength'].requiredLength} caracteres.`;
    if (c.errors['min'])       return `El valor mínimo es ${c.errors['min'].min}.`;
    if (c.errors['max'])       return `El valor máximo es ${c.errors['max'].max}.`;
    return 'Valor inválido.';
  }
}
