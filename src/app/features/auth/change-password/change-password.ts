import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../shared/components/toast/toast.service';

/**
 * Change password page — shown when user has mustChangePassword = true.
 * Forces password change before accessing the rest of the app.
 */
@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule],
  template: `
    <div class="change-password-page">
      <div class="change-password-card">
        <h1 class="change-password-card__title">Cambiar Contraseña</h1>
        <p class="change-password-card__subtitle">
          Por seguridad, debes cambiar tu contraseña antes de continuar.
        </p>

        @if (errorMessage()) {
          <div class="alert alert--error">{{ errorMessage() }}</div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <div class="form-group">
            <label class="form-label form-label--required">Contraseña actual</label>
            <input type="password" class="form-control" formControlName="currentPassword"
              placeholder="Tu contraseña actual (número de documento)" />
          </div>
          <div class="form-group">
            <label class="form-label form-label--required">Nueva contraseña</label>
            <input type="password" class="form-control" formControlName="newPassword"
              placeholder="Mínimo 6 caracteres" />
          </div>
          <div class="form-group">
            <label class="form-label form-label--required">Confirmar nueva contraseña</label>
            <input type="password" class="form-control" formControlName="confirmPassword"
              placeholder="Repite la nueva contraseña" />
          </div>
          <button type="submit" class="btn btn--primary" style="width:100%; margin-top:1rem;"
            [disabled]="isSaving()">
            {{ isSaving() ? 'Guardando...' : 'Cambiar Contraseña' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .change-password-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: var(--color-bg-secondary);
    }
    .change-password-card {
      background: var(--color-bg-primary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 2rem;
      width: 100%;
      max-width: 400px;
    }
    .change-password-card__title {
      font-size: 1.5rem;
      font-weight: 700;
      text-align: center;
      margin-bottom: 0.5rem;
    }
    .change-password-card__subtitle {
      text-align: center;
      color: var(--color-text-secondary);
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
    }
    .form-group { margin-bottom: 1rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePassword {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword:     ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  });

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const v = this.form.value;
    if (v.newPassword !== v.confirmPassword) {
      this.errorMessage.set('Las contraseñas no coinciden');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    this.http.post(`${environment.apiBaseUrl}/auth/change-password`, {
      currentPassword: v.currentPassword,
      newPassword: v.newPassword,
    }, { withCredentials: true }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toast.success('Contraseña actualizada exitosamente');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'No se pudo cambiar la contraseña';
        this.errorMessage.set(msg);
        this.isSaving.set(false);
      },
    });
  }
}
