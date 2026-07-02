import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PublicApiService } from '../public-api.service';
import type { Tournament } from '../../../core/models/tournament.model';

/**
 * Public tournament list — shows all active tournaments.
 * No login required.
 */
@Component({
  selector: 'app-public-tournaments',
  templateUrl: './public-tournaments.html',
  styleUrl: './public-tournaments.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicTournaments implements OnInit {
  private readonly api = inject(PublicApiService);
  private readonly router = inject(Router);

  readonly tournaments = signal<Tournament[]>([]);
  readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.api.get<Tournament[]>('/tournaments').subscribe({
      next: (data) => {
        this.tournaments.set(data ?? []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  openTournament(id: string): void {
    this.router.navigate(['/p/tournament', id]);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active':   return 'En curso';
      case 'finished': return 'Finalizado';
      case 'draft':    return 'Próximamente';
      default:         return status;
    }
  }
}
