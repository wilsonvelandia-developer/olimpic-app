import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TournamentService } from '../tournament.service';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { AuthService } from '../../../core/services/auth.service';
import type { Tournament } from '../../../core/models';

/**
 * Tournament detail view.
 * Shows tournament metadata, participating teams, and scheduled matches.
 */
@Component({
  selector: 'app-tournament-detail',
  imports: [RouterLink, StatusBadge, LoadingSpinner, ConfirmDialog],
  templateUrl: './tournament-detail.html',
  styleUrl: './tournament-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tournamentService = inject(TournamentService);
  readonly auth = inject(AuthService);

  readonly tournament = signal<Tournament | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showDeleteDialog = signal<boolean>(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTournament(Number(id));
    }
  }

  private loadTournament(id: number): void {
    this.isLoading.set(true);
    this.tournamentService.getById(id).subscribe({
      next: (data) => {
        this.tournament.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudo cargar el torneo.');
        this.isLoading.set(false);
      },
    });
  }

  onEdit(): void {
    const id = this.tournament()?.id;
    if (id) this.router.navigate(['/tournaments', id, 'edit']);
  }

  onDeleteConfirm(): void {
    this.showDeleteDialog.set(true);
  }

  onDeleteCancelled(): void {
    this.showDeleteDialog.set(false);
  }

  onDeleteConfirmed(): void {
    const id = this.tournament()?.id;
    if (!id) return;

    this.showDeleteDialog.set(false);
    this.tournamentService.delete(id).subscribe({
      next: () => this.router.navigate(['/tournaments']),
      error: () => this.errorMessage.set('No se pudo eliminar el torneo.'),
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatLabel(format: string): string {
    const labels: Record<string, string> = {
      groups_knockout: 'Grupos + Eliminatoria',
      round_robin: 'Todos contra todos',
      single_elimination: 'Eliminación simple',
      double_elimination: 'Eliminación doble',
    };
    return labels[format] ?? format;
  }
}
