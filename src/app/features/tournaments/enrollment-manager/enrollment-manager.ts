import { Component, ChangeDetectionStrategy, inject, signal, input, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../shared/components/toast/toast.service';

interface Enrollment {
  id: string;
  teamId: string;
  teamName: string;
  teamShort: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  enrolledAt: string;
  playerCount: number;
}

/**
 * Enrollment manager — allows organizers to view, approve, or reject team enrollments.
 * Designed to be embedded in the tournament detail page.
 */
@Component({
  selector: 'app-enrollment-manager',
  imports: [DatePipe],
  templateUrl: './enrollment-manager.html',
  styleUrl: './enrollment-manager.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnrollmentManager implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly tournamentId = input.required<string>();

  readonly enrollments = signal<Enrollment[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly filter = signal<string>('');

  ngOnInit(): void {
    this.loadEnrollments();
  }

  loadEnrollments(): void {
    const tid = this.tournamentId();
    const status = this.filter();
    const path = status
      ? `/tournaments/${tid}/enrollments?status=${status}`
      : `/tournaments/${tid}/enrollments`;

    this.api.get<Enrollment[]>(path).subscribe({
      next: (res) => {
        this.enrollments.set(res.data ?? []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  onFilterChange(status: string): void {
    this.filter.set(status);
    this.isLoading.set(true);
    this.loadEnrollments();
  }

  approve(enrollment: Enrollment): void {
    this.updateStatus(enrollment, 'active');
  }

  reject(enrollment: Enrollment): void {
    this.updateStatus(enrollment, 'rejected');
  }

  withdraw(enrollment: Enrollment): void {
    this.updateStatus(enrollment, 'withdrawn');
  }

  private updateStatus(enrollment: Enrollment, status: string): void {
    this.api.put(`/tournaments/${this.tournamentId()}/enrollments/${enrollment.id}/status`, { status })
      .subscribe({
        next: () => {
          this.enrollments.update((list) =>
            list.map((e) => e.id === enrollment.id ? { ...e, status } : e),
          );
          const labels: Record<string, string> = {
            active: 'aprobada', rejected: 'rechazada', withdrawn: 'retirada',
          };
          this.toast.success(`Inscripción ${labels[status] ?? status}: ${enrollment.teamName}`);
        },
        error: () => this.toast.error('No se pudo actualizar el estado'),
      });
  }

  removeEnrollment(enrollment: Enrollment): void {
    this.api.delete(`/tournaments/${this.tournamentId()}/enrollments/${enrollment.id}`)
      .subscribe({
        next: () => {
          this.enrollments.update((list) => list.filter((e) => e.id !== enrollment.id));
          this.toast.success(`Inscripción eliminada: ${enrollment.teamName}`);
        },
        error: () => this.toast.error('No se pudo eliminar'),
      });
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active':       return 'Aprobada';
      case 'pending':      return 'Pendiente';
      case 'rejected':     return 'Rechazada';
      case 'withdrawn':    return 'Retirada';
      case 'disqualified': return 'Descalificada';
      default:             return status;
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active':       return 'badge--success';
      case 'pending':      return 'badge--warning';
      case 'rejected':     return 'badge--error';
      case 'withdrawn':    return 'badge--neutral';
      case 'disqualified': return 'badge--error';
      default:             return 'badge--neutral';
    }
  }
}
