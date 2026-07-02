import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { PaymentService } from '../payment.service';
import { ApiService } from '../../../core/services/api.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { AuthService } from '../../../core/services/auth.service';
import type { Payment } from '../../../core/models';
import type { PaymentFilters } from '../payment.service';

@Component({
  selector: 'app-payment-list',
  imports: [FormsModule, DatePipe, LoadingSpinner, ConfirmDialog],
  templateUrl: './payment-list.html',
  styleUrl: './payment-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentList implements OnInit {
  private readonly paymentService = inject(PaymentService);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);

  readonly payments = signal<Payment[]>([]);
  readonly tournaments = signal<Array<{ id: string; name: string }>>([]);
  readonly totalCount = signal<number>(0);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly showDeleteDialog = signal<boolean>(false);
  readonly selectedPaymentId = signal<string | null>(null);

  readonly currentPage = signal<number>(1);
  readonly pageSize = 10;

  searchModel = '';
  tournamentModel = '';
  statusModel = '';

  ngOnInit(): void {
    this.loadPayments();
    this.api.get<Array<{ id: string; name: string }>>('/tournaments').subscribe({
      next: (res) => { if (res.success && res.data) this.tournaments.set(res.data); },
    });
  }

  loadPayments(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const filters: PaymentFilters = { page: this.currentPage(), pageSize: this.pageSize };
    if (this.searchModel.trim()) filters.search = this.searchModel.trim();
    if (this.tournamentModel.trim()) filters.tournamentId = this.tournamentModel.trim();
    if (this.statusModel.trim()) filters.status = this.statusModel.trim();

    this.paymentService.getAll(filters).subscribe({
      next: (r) => { this.payments.set(r.data); this.totalCount.set(r.total); this.isLoading.set(false); },
      error: () => { this.errorMessage.set('No se pudieron cargar los pagos.'); this.isLoading.set(false); },
    });
  }

  onApplyFilters(): void { this.currentPage.set(1); this.loadPayments(); }
  onClearFilters(): void { this.searchModel = ''; this.tournamentModel = ''; this.statusModel = ''; this.currentPage.set(1); this.loadPayments(); }
  onCreatePayment(): void { this.router.navigate(['/payments', 'new']); }
  onEditPayment(id: string): void { this.router.navigate(['/payments', id, 'edit']); }
  onViewDetail(id: string): void { this.router.navigate(['/payments', id]); }

  onDeleteConfirm(payment: Payment): void {
    this.selectedPaymentId.set(payment.id);
    this.showDeleteDialog.set(true);
  }

  onDeleteCancelled(): void { this.showDeleteDialog.set(false); this.selectedPaymentId.set(null); }

  onDeleteConfirmed(): void {
    const id = this.selectedPaymentId();
    if (!id) return;
    this.showDeleteDialog.set(false);
    this.paymentService.delete(id).subscribe({
      next: () => this.loadPayments(),
      error: () => this.errorMessage.set('No se pudo eliminar el pago.'),
    });
  }

  onPageChange(page: number): void { this.currentPage.set(page); this.loadPayments(); }

  get totalPages(): number { return Math.ceil(this.totalCount() / this.pageSize); }
  get pageRange(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: currency || 'COP' }).format(amount);
  }
}
