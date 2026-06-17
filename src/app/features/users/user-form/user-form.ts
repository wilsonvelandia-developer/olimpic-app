import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UserService } from '../user.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import type { AppRole } from '../../../core/models/role.model';

interface RoleOption {
  id: AppRole;
  label: string;
  checked: boolean;
}

@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule, LoadingSpinner],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserForm implements OnInit {
  private readonly fb          = inject(FormBuilder);
  private readonly router      = inject(Router);
  private readonly userService = inject(UserService);

  readonly isSaving     = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMsg   = signal<string | null>(null);

  readonly roleOptions = signal<RoleOption[]>([
    { id: 'organizer',     label: 'Organizador',      checked: false },
    { id: 'coach',         label: 'Entrenador',       checked: false },
    { id: 'assistant',     label: 'Asistente',        checked: false },
    { id: 'delegate',      label: 'Delegado',         checked: false },
    { id: 'fitness_coach', label: 'Preparador Físico',checked: false },
    { id: 'coordinator',   label: 'Coordinador',      checked: false },
    { id: 'president',     label: 'Presidente',       checked: false },
    { id: 'player',        label: 'Jugador',          checked: false },
    { id: 'parent',        label: 'Padre de Familia', checked: false },
    { id: 'companion',     label: 'Acompañante',      checked: false },
    { id: 'referee',       label: 'Árbitro / Juez',   checked: false },
    { id: 'observer',      label: 'Veedor',           checked: false },
  ]);

  readonly form = this.fb.group({
    email:          ['', [Validators.required, Validators.email]],
    password:       ['', [Validators.required, Validators.minLength(6)]],
    name:           ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    documentNumber: [''],
    phone:          [''],
  });

  ngOnInit(): void {}

  onToggleRole(idx: number): void {
    const opts = [...this.roleOptions()];
    opts[idx] = { ...opts[idx], checked: !opts[idx].checked };
    this.roleOptions.set(opts);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const selectedRoles = this.roleOptions().filter((r) => r.checked).map((r) => r.id);
    if (selectedRoles.length === 0) {
      this.errorMessage.set('Selecciona al menos un rol.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMsg.set(null);

    const v = this.form.value;
    this.userService.register({
      email:          v.email!,
      password:       v.password!,
      name:           v.name!,
      documentNumber: v.documentNumber || null,
      phone:          v.phone || null,
      roles:          selectedRoles,
    }).subscribe({
      next: (user) => {
        this.isSaving.set(false);
        this.successMsg.set(`Usuario "${user.name}" creado exitosamente.`);
        this.form.reset();
        this.roleOptions.set(this.roleOptions().map((r) => ({ ...r, checked: false })));
      },
      error: () => {
        this.errorMessage.set('No se pudo crear el usuario. Verifica los datos.');
        this.isSaving.set(false);
      },
    });
  }

  onCancel(): void { this.router.navigate(['/users']); }

  isFieldInvalid(f: string): boolean { const c = this.form.get(f); return !!(c?.invalid && c?.touched); }
  getFieldError(f: string): string {
    const c = this.form.get(f);
    if (!c?.errors || !c.touched) return '';
    if (c.errors['required'])  return 'Campo requerido.';
    if (c.errors['email'])     return 'Email inválido.';
    if (c.errors['minlength']) return `Mínimo ${c.errors['minlength'].requiredLength} caracteres.`;
    return 'Valor inválido.';
  }
}
