import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PlayerService } from '../player.service';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
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
  private readonly api           = inject(ApiService);
  private readonly toast         = inject(ToastService);

  readonly isEditMode   = signal<boolean>(false);
  readonly playerId     = signal<string | null>(null);
  readonly teamId       = signal<string>('');
  readonly isLoading    = signal<boolean>(false);
  readonly isSaving     = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  /** Whether a matching user was found by document number. */
  readonly userFound    = signal<boolean>(false);
  readonly foundUserId  = signal<string | null>(null);
  readonly isSearching  = signal<boolean>(false);

  readonly form = this.fb.group({
    // Player identity (linked to user)
    documentType:   ['CC'],
    documentNumber: [''],
    name:           ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    email:          [''],
    phone:          [''],
    birthDate:      [''],
    // Player-in-team data
    jerseyNumber:   [null as number | null, [Validators.required, Validators.min(0), Validators.max(999)]],
    position:       ['' as string | null],
  });

  readonly documentTypes = [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'TI', label: 'Tarjeta de Identidad' },
    { value: 'CE', label: 'Cédula de Extranjería' },
    { value: 'PA', label: 'Pasaporte' },
    { value: 'RC', label: 'Registro Civil' },
    { value: 'NIT', label: 'NIT' },
  ];

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
        this.form.patchValue({
          name: p.name,
          jerseyNumber: p.jerseyNumber,
          position: p.position,
        });
        this.isLoading.set(false);
      },
      error: () => { this.errorMessage.set('No se pudo cargar el jugador.'); this.isLoading.set(false); },
    });
  }

  /**
   * Called on blur of the document number field.
   * Searches for an existing user with that document.
   */
  onDocumentBlur(): void {
    const docNumber = this.form.get('documentNumber')?.value?.trim();
    if (!docNumber || docNumber.length < 3) return;

    this.isSearching.set(true);
    this.api.get<Record<string, unknown> | null>(`/users/by-document/${docNumber}`).subscribe({
      next: (res) => {
        this.isSearching.set(false);
        if (res.data) {
          const user = res.data;
          this.userFound.set(true);
          this.foundUserId.set(user['id'] as string);

          // Pre-fill form with existing user data
          const fullName = (user['name'] as string)
            || `${user['firstName'] ?? ''} ${user['firstLastName'] ?? ''}`.trim();

          this.form.patchValue({
            name:  fullName || this.form.get('name')?.value || '',
            email: (user['email'] as string) || '',
            phone: (user['phone'] as string) || '',
          });

          this.toast.info(`Usuario encontrado: ${fullName}. Datos prellenados.`);
        } else {
          this.userFound.set(false);
          this.foundUserId.set(null);
        }
      },
      error: () => {
        this.isSearching.set(false);
        this.userFound.set(false);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSaving.set(true);
    this.errorMessage.set(null);

    const v = this.form.value;
    const payload = {
      name:           v.name!,
      jerseyNumber:   v.jerseyNumber!,
      position:       v.position || null,
      documentType:   v.documentType || null,
      documentNumber: v.documentNumber || null,
      email:          v.email || null,
      phone:          v.phone || null,
      birthDate:      v.birthDate || null,
      userId:         this.foundUserId(),
    };

    const teamId   = this.teamId();
    const playerId = this.playerId();

    const req$ = playerId
      ? this.playerService.update(teamId, playerId, payload)
      : this.playerService.create(teamId, payload);

    req$.subscribe({
      next: () => {
        this.isSaving.set(false);
        if (!playerId && !this.userFound()) {
          this.toast.success('Jugador registrado. Se creó cuenta con documento como contraseña.');
        } else {
          this.toast.success('Jugador guardado exitosamente');
        }
        this.router.navigate(['/teams', teamId]);
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'No se pudo guardar el jugador.';
        this.errorMessage.set(msg);
        this.isSaving.set(false);
      },
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
