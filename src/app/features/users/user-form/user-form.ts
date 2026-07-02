import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UserService } from '../user.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ImageUpload } from '../../../shared/components/image-upload/image-upload';
import type { AppRole } from '../../../core/models/role.model';

interface RoleOption {
  id: AppRole;
  label: string;
  checked: boolean;
}

@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule, LoadingSpinner, ImageUpload],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserForm implements OnInit {
  private readonly fb          = inject(FormBuilder);
  private readonly router      = inject(Router);
  private readonly route       = inject(ActivatedRoute);
  private readonly userService = inject(UserService);

  readonly isEditMode   = signal<boolean>(false);
  readonly userId       = signal<string | null>(null);
  readonly isLoading    = signal<boolean>(false);
  readonly isSaving     = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMsg   = signal<string | null>(null);

  readonly documentTypes = [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'TI', label: 'Tarjeta de Identidad' },
    { value: 'CE', label: 'Cédula de Extranjería' },
    { value: 'PP', label: 'Pasaporte' },
    { value: 'RC', label: 'Registro Civil' },
    { value: 'NIT', label: 'NIT' },
  ];

  readonly roleOptions = signal<RoleOption[]>([
    { id: 'organizer',     label: 'Organizador',       checked: false },
    { id: 'coach',         label: 'Entrenador',        checked: false },
    { id: 'assistant',     label: 'Asistente',         checked: false },
    { id: 'delegate',      label: 'Delegado',          checked: false },
    { id: 'fitness_coach', label: 'Preparador Físico', checked: false },
    { id: 'coordinator',   label: 'Coordinador',       checked: false },
    { id: 'president',     label: 'Presidente',        checked: false },
    { id: 'player',        label: 'Jugador',           checked: false },
    { id: 'parent',        label: 'Padre de Familia',  checked: false },
    { id: 'companion',     label: 'Acompañante',       checked: false },
    { id: 'referee',       label: 'Árbitro / Juez',    checked: false },
    { id: 'observer',      label: 'Veedor',            checked: false },
  ]);

  readonly form = this.fb.group({
    // Identity
    firstName:        ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
    secondName:       [''],
    firstLastName:    ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
    secondLastName:   [''],
    // Document
    documentType:     ['CC'],
    documentNumber:   [''],
    birthDate:        [''],
    // Contact
    email:            ['', [Validators.required, Validators.email]],
    password:         ['', [Validators.required, Validators.minLength(6)]],
    phone:            [''],
    // Media / files
    photoUrl:         [''],
    documentFrontUrl: [''],
    documentBackUrl:  [''],
    epsFileUrl:       [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.userId.set(id);
      // Password not required for editing
      this.form.get('password')?.clearValidators();
      this.form.get('password')?.updateValueAndValidity();
      this.loadUser(id);
    }
  }

  private loadUser(id: string): void {
    this.isLoading.set(true);
    this.userService.getById(id).subscribe({
      next: (u) => {
        this.form.patchValue({
          firstName:        u.firstName ?? '',
          secondName:       u.secondName ?? '',
          firstLastName:    u.firstLastName ?? '',
          secondLastName:   u.secondLastName ?? '',
          documentType:     u.documentType ?? 'CC',
          documentNumber:   u.documentNumber ?? '',
          birthDate:        u.birthDate ? u.birthDate.slice(0, 10) : '',
          email:            u.email,
          phone:            u.phone ?? '',
          photoUrl:         u.photoUrl ?? '',
          documentFrontUrl: u.documentFrontUrl ?? '',
          documentBackUrl:  u.documentBackUrl ?? '',
          epsFileUrl:       u.epsFileUrl ?? '',
        });
        // Set roles
        const opts = this.roleOptions().map((r) => ({ ...r, checked: u.roles.includes(r.id) }));
        this.roleOptions.set(opts);
        this.isLoading.set(false);
      },
      error: () => { this.errorMessage.set('No se pudo cargar el usuario.'); this.isLoading.set(false); },
    });
  }

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

    if (this.isEditMode()) {
      this.userService.update(this.userId()!, {
        firstName:        v.firstName || undefined,
        secondName:       v.secondName || null,
        firstLastName:    v.firstLastName || undefined,
        secondLastName:   v.secondLastName || null,
        email:            v.email || undefined,
        documentType:     v.documentType || null,
        documentNumber:   v.documentNumber || null,
        birthDate:        v.birthDate || null,
        phone:            v.phone || null,
        photoUrl:         v.photoUrl || null,
        documentFrontUrl: v.documentFrontUrl || null,
        documentBackUrl:  v.documentBackUrl || null,
        epsFileUrl:       v.epsFileUrl || null,
        roles:            selectedRoles,
      }).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.successMsg.set('Usuario actualizado exitosamente.');
        },
        error: () => {
          this.errorMessage.set('No se pudo actualizar el usuario.');
          this.isSaving.set(false);
        },
      });
    } else {
      this.userService.register({
        email:            v.email!,
        password:         v.password!,
        firstName:        v.firstName!,
        secondName:       v.secondName || null,
        firstLastName:    v.firstLastName!,
        secondLastName:   v.secondLastName || null,
        documentType:     v.documentType || null,
        documentNumber:   v.documentNumber || null,
        birthDate:        v.birthDate || null,
        phone:            v.phone || null,
        photoUrl:         v.photoUrl || null,
        documentFrontUrl: v.documentFrontUrl || null,
        documentBackUrl:  v.documentBackUrl || null,
        epsFileUrl:       v.epsFileUrl || null,
        roles:            selectedRoles,
      }).subscribe({
        next: (user) => {
          this.isSaving.set(false);
          this.successMsg.set(`Usuario "${user.name}" creado exitosamente.`);
          this.form.reset({ documentType: 'CC' });
          this.roleOptions.set(this.roleOptions().map((r) => ({ ...r, checked: false })));
        },
        error: () => {
          this.errorMessage.set('No se pudo crear el usuario. Verifica los datos.');
          this.isSaving.set(false);
        },
      });
    }
  }

  onPhotoUploaded(url: string): void { this.form.patchValue({ photoUrl: url }); }
  onDocFrontUploaded(url: string): void { this.form.patchValue({ documentFrontUrl: url }); }
  onDocBackUploaded(url: string): void { this.form.patchValue({ documentBackUrl: url }); }
  onEpsUploaded(url: string): void { this.form.patchValue({ epsFileUrl: url }); }

  onCancel(): void { this.router.navigate(['/users']); }

  isFieldInvalid(f: string): boolean { const c = this.form.get(f); return !!(c?.invalid && c?.touched); }
  getFieldError(f: string): string {
    const c = this.form.get(f);
    if (!c?.errors || !c.touched) return '';
    if (c.errors['required'])  return 'Campo requerido.';
    if (c.errors['email'])     return 'Email inválido.';
    if (c.errors['minlength']) return `Mínimo ${c.errors['minlength'].requiredLength} caracteres.`;
    if (c.errors['maxlength']) return `Máximo ${c.errors['maxlength'].requiredLength} caracteres.`;
    return 'Valor inválido.';
  }
}
