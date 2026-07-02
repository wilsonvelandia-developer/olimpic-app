import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PaymentService } from '../payment.service';
import { ApiService } from '../../../core/services/api.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import type { PaymentMethod, PaymentStatus } from '../../../core/models';

@Component({
  selector: 'app-payment-form',
  imports: [ReactiveFormsModule, LoadingSpinner],
  templateUrl: './payment-form.html',
  styleUrl: './payment-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly paymentService = inject(PaymentService);
  private readonly api = inject(ApiService);

  readonly isEditMode = signal<boolean>(false);
  readonly paymentId = signal<string | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly tournaments = signal<Array<{ id: string; name: string }>>([]);
  readonly teams = signal<Array<{ id: string; name: string }>>([]);

  readonly methodOptions: { value: PaymentMethod; label: string }[] = [
    { value: 'cash', label: 'Efectivo' },
    { value: 'transfer', label: 'Transferencia' },
    { value: 'card', label: 'Tarjeta' },
    { value: 'other', label: 'Otro' },
  ];

  readonly statusOptions: { value: PaymentStatus; label: string }[] = [
    { value: 'pending', label: 'Pendiente' },
    { value: 'completed', label: 'Completado' },
    { value: 'failed', label: 'Fallido' },
    { value: 'refunded', label: 'Reembolsado' },
  ];

  readonly form = this.fb.group({
    tournamentId: ['', Validators.required],
    teamId: ['', Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(1)]],
    currency: ['COP'],
    method: ['cash' as PaymentMethod, Validators.required],
    reference: [''],
    notes: [''],
    status: ['pending' as PaymentStatus],
  });

  ngOnInit(): void {
    this.api.get<Array<{ id: string; name: string }>>('/tournaments').subscribe({
      next: (res) => { if (res.success && res.data) this.tournaments.set(res.data); },
    });
    this.api.get<Array<{ id: string; name: string }>>('/teams').subscribe({
      next: (res) => { if (res.success && res.data) this.teams.set(res.data); },
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.paymentId.set(id);
      this.loadPayment(id);
    }
  }

  private loadPayment(id: string): void {
    this.isLoading.set(true);
    this.paymentService.getById(id).subscribe({
      next: (p) => {
        this.form.patchValue({
          tournamentId: p.tournamentId,
          teamId: p.teamId,
          amount: p.amount,
          currency: p.currency || 'COP',
          method: p.method,
          reference: p.reference ?? '',
          notes: p.notes ?? '',
          status: p.status,
        });
        this.isLoading.set(false);
      },
      error: () => { this.errorMessage.set('No se pudo cargar el pago.'); this.isLoading.set(false); },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSaving.set(true);
    this.errorMessage.set(null);

    const v = this.form.value;
    const id = this.paymentId();

    if (id) {
      this.paymentService.update(id, {
        amount: v.amount!,
        method: v.method!,
        status: v.status!,
        reference: v.reference || null,
        notes: v.notes || null,
      }).subscribe({
        next: () => { this.isSaving.set(false); this.router.navigate(['/payments']); },
        error: () => { this.errorMessage.set('No se pudo guardar el pago.'); this.isSaving.set(false); },
      });
    } else {
      this.paymentService.create({
        tournamentId: v.tournamentId!,
        teamId: v.teamId!,
        amount: v.amount!,
        currency: v.currency || 'COP',
        method: v.method!,
        reference: v.reference || null,
        notes: v.notes || null,
      }).subscribe({
        next: () => { this.isSaving.set(false); this.router.navigate(['/payments']); },
        error: () => { this.errorMessage.set('No se pudo guardar el pago.'); this.isSaving.set(false); },
      });
    }
  }

  onCancel(): void { this.router.navigate(['/payments']); }

  isFieldInvalid(f: string): boolean { const c = this.form.get(f); return !!(c?.invalid && c?.touched); }
  getFieldError(f: string): string {
    const c = this.form.get(f);
    if (!c?.errors || !c.touched) return '';
    if (c.errors['required']) return 'Este campo es requerido.';
    if (c.errors['min']) return `El valor mínimo es ${c.errors['min'].min}.`;
    return 'Valor inválido.';
  }
}
