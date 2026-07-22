import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Forgot password page.
 * Sends a password reset email to the provided address.
 * Always shows success to prevent email enumeration attacks.
 */
@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPassword {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  readonly isLoading = signal<boolean>(false);
  readonly submitted = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const email = this.form.value.email!;

    this.auth.forgotPassword(email).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.submitted.set(true);
      },
      error: () => {
        this.isLoading.set(false);
        // Show success even on error to prevent enumeration
        this.submitted.set(true);
      },
    });
  }

  isFieldInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  getFieldError(field: string): string {
    const c = this.form.get(field);
    if (!c?.errors || !c.touched) return '';
    if (c.errors['required']) return 'Este campo es requerido.';
    if (c.errors['email']) return 'Ingresa un correo electrónico válido.';
    return 'Valor inválido.';
  }
}
