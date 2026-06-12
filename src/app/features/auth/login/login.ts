import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

/**
 * Login page. Submits credentials to the backend which sets an httpOnly cookie.
 * No token is stored in the browser — session is managed server-side.
 */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal<boolean>(false);
  readonly backendStatus = signal<'checking' | 'online' | 'offline'>('checking');
  readonly apiBaseUrl = environment.apiBaseUrl;

  readonly form = this.fb.group({
    email:    ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(72)]],
  });

  ngOnInit(): void {
    this.checkBackendHealth();
  }

  /** Pings the gateway to show connection status. */
  private checkBackendHealth(): void {
    // Use the gateway root — avoids noise if /health endpoint doesn't exist.
    // Any response (including 4xx) means the server IS reachable.
    // status === 0 means no connection at all (CORS error, server down).
    this.http
      .get(this.apiBaseUrl, { observe: 'response', responseType: 'text' })
      .subscribe({
        next: () => this.backendStatus.set('online'),
        error: (err) => {
          if (err.status > 0) {
            this.backendStatus.set('online');   // server responded, even with an error
          } else {
            this.backendStatus.set('offline');  // no connection
          }
        },
      });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.form.value;

    this.auth.login({ email: email!, password: password! }).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage.set('Credenciales inválidas. Verifica tu correo y contraseña.');
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        if (err.status === 401) {
          this.errorMessage.set('Credenciales inválidas. Verifica tu correo y contraseña.');
        } else if (err.status === 0) {
          this.errorMessage.set('No se pudo conectar al servidor. Verifica que el backend esté corriendo.');
        } else {
          this.errorMessage.set('No se pudo iniciar sesión. Intenta nuevamente.');
        }
        this.isLoading.set(false);
      },
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  isFieldInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  getFieldError(field: string): string {
    const c = this.form.get(field);
    if (!c?.errors || !c.touched) return '';
    if (c.errors['required']) return 'Este campo es requerido.';
    if (c.errors['email'])    return 'Ingresa un correo electrónico válido.';
    if (c.errors['minlength']) return `Mínimo ${c.errors['minlength'].requiredLength} caracteres.`;
    if (c.errors['maxlength']) return `Máximo ${c.errors['maxlength'].requiredLength} caracteres.`;
    return 'Valor inválido.';
  }
}
