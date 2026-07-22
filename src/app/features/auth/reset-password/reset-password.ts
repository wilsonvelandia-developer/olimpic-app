import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Reset password page.
 * Accepts a token from the URL query params and allows setting a new password.
 */
@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPassword implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isLoading = signal<boolean>(false);
  readonly success = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal<boolean>(false);
  readonly token = signal<string | null>(null);

  readonly form = this.fb.group({
    newPassword:     ['', [Validators.required, Validators.minLength(6), Validators.maxLength(72)]],
    confirmPassword: ['', [Validators.required]],
  });

  ngOnInit(): void {
    const tokenParam = this.route.snapshot.queryParamMap.get('token');
    if (!tokenParam) {
      this.errorMessage.set('Enlace inválido. Solicita un nuevo enlace de recuperación.');
    } else {
      this.token.set(tokenParam);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { newPassword, confirmPassword } = this.form.value;

    if (newPassword !== confirmPassword) {
      this.errorMessage.set('Las contraseñas no coinciden.');
      return;
    }

    const token = this.token();
    if (!token) {
      this.errorMessage.set('Token inválido.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.auth.resetPassword(token, newPassword!).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          this.success.set(true);
        } else {
          this.errorMessage.set(response.message || 'No se pudo restablecer la contraseña.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.error?.message) {
          this.errorMessage.set(err.error.message);
        } else {
          this.errorMessage.set('No se pudo restablecer la contraseña. El enlace puede haber expirado.');
        }
      },
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  isFieldInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  getFieldError(field: string): string {
    const c = this.form.get(field);
    if (!c?.errors || !c.touched) return '';
    if (c.errors['required']) return 'Este campo es requerido.';
    if (c.errors['minlength']) return `Mínimo ${c.errors['minlength'].requiredLength} caracteres.`;
    if (c.errors['maxlength']) return `Máximo ${c.errors['maxlength'].requiredLength} caracteres.`;
    return 'Valor inválido.';
  }
}
