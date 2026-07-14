import { Component, ChangeDetectionStrategy, inject, signal, input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { AuthService } from '../../../core/services/auth.service';
import type { Payment } from '../../../core/models';

/**
 * Displays payments for the current tournament.
 * Embedded as a tab inside tournament-detail.
 */
@Component({
  selector: 'app-tournament-payments',
  imports: [DatePipe, LoadingSpinner],
  templateUrl: './tournament-payments.html',
  styleUrl: './tournament-payments.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentPayments implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly tournamentId = input.required<string>();

  readonly payments = signal<Payment[]>([]);
  readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.isLoading.set(true);
    this.api.get<Payment[]>(`/payments?tournamentId=${this.tournamentId()}`).subscribe({
      next: (res) => { this.payments.set(res.data ?? []); this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });
  }

  onRegisterPayment(): void {
    this.router.navigate(['/payments', 'new'], { queryParams: { tournamentId: this.tournamentId() } });
  }

  onViewPayment(id: string): void {
    this.router.navigate(['/payments', id]);
  }

  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: currency || 'COP' }).format(amount);
  }

  get totalCollected(): number {
    return this.payments().filter((p) => p.status === 'confirmed').reduce((sum, p) => sum + p.amount, 0);
  }

  get pendingCount(): number {
    return this.payments().filter((p) => p.status === 'pending').length;
  }
}
