import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PaymentService } from '../payment.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { AuthService } from '../../../core/services/auth.service';
import type { Payment } from '../../../core/models';

@Component({
  selector: 'app-payment-detail',
  imports: [RouterLink, DatePipe, LoadingSpinner, ConfirmDialog],
  templateUrl: './payment-detail.html',
  styleUrl: './payment-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly paymentService = inject(PaymentService);
  readonly auth = inject(AuthService);

  readonly payment = signal<Payment | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showDeleteDialog = signal<boolean>(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadPayment(id);
  }

  private loadPayment(id: string): void {
    this.isLoading.set(true);
    this.paymentService.getById(id).subscribe({
      next: (d) => { this.payment.set(d); this.isLoading.set(false); },
      error: () => { this.errorMessage.set('No se pudo cargar el pago.'); this.isLoading.set(false); },
    });
  }

  onEdit(): void {
    const id = this.payment()?.id;
    if (id) this.router.navigate(['/payments', id, 'edit']);
  }

  onDeleteConfirm(): void { this.showDeleteDialog.set(true); }
  onDeleteCancelled(): void { this.showDeleteDialog.set(false); }

  onDeleteConfirmed(): void {
    const id = this.payment()?.id;
    if (!id) return;
    this.showDeleteDialog.set(false);
    this.paymentService.delete(id).subscribe({
      next: () => this.router.navigate(['/payments']),
      error: () => this.errorMessage.set('No se pudo eliminar el pago.'),
    });
  }

  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: currency || 'COP' }).format(amount);
  }
}
