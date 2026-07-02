import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import type { Match } from '../../../core/models/match.model';

/**
 * Referee match selection page.
 * Shows in_progress and scheduled matches for the referee to pick.
 */
@Component({
  selector: 'app-referee-select',
  imports: [DatePipe],
  templateUrl: './referee-select.html',
  styleUrl: './referee-select.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RefereeSelect implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly matches = signal<Match[]>([]);
  readonly isLoading = signal<boolean>(false);

  ngOnInit(): void {
    this.loadMatches();
  }

  loadMatches(): void {
    this.isLoading.set(true);
    // Load matches only from tournaments where the current user is assigned as referee
    this.api.get<Match[]>('/matches/for-referee').subscribe({
      next: (res) => {
        const matches = res.data ?? [];
        // Show in_progress first, then scheduled
        const sorted = [
          ...matches.filter((m) => m.status === 'in_progress'),
          ...matches.filter((m) => m.status === 'scheduled'),
        ];
        this.matches.set(sorted);
        this.isLoading.set(false);
      },
      error: () => {
        // Fallback: load all matches if the filtered endpoint fails (backward compat)
        this.api.get<Match[]>('/matches?status=in_progress').subscribe({
          next: (res) => {
            const inProgress = res.data ?? [];
            this.api.get<Match[]>('/matches?status=scheduled').subscribe({
              next: (res2) => {
                const scheduled = res2.data ?? [];
                this.matches.set([...inProgress, ...scheduled]);
                this.isLoading.set(false);
              },
              error: () => { this.matches.set(inProgress); this.isLoading.set(false); },
            });
          },
          error: () => this.isLoading.set(false),
        });
      },
    });
  }

  selectMatch(matchId: string): void {
    this.router.navigate(['/referee/match', matchId]);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  /** Format status for display. */
  statusLabel(status: string): string {
    switch (status) {
      case 'in_progress': return 'En curso';
      case 'scheduled':   return 'Programado';
      default:            return status;
    }
  }

  /** Format datetime for display. */
  formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('es-CO', {
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  }
}
