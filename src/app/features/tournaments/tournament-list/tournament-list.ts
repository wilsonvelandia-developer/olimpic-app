import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TournamentService } from '../tournament.service';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import type { Tournament } from '../../../core/models';
import type { TournamentFilters } from '../tournament.service';

@Component({
  selector: 'app-tournament-list',
  imports: [FormsModule, StatusBadge, LoadingSpinner, ConfirmDialog],
  templateUrl: './tournament-list.html',
  styleUrl: './tournament-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentList implements OnInit {
  private readonly tournamentService = inject(TournamentService);
  private readonly router = inject(Router);

  readonly tournaments = signal<Tournament[]>([]);
  readonly totalCount = signal<number>(0);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly showDeleteDialog = signal<boolean>(false);
  readonly selectedTournamentId = signal<string | null>(null);
  readonly selectedTournamentName = signal<string>('');

  readonly filterStatus = signal<string>('');
  readonly filterSeason = signal<string>('');
  readonly currentPage = signal<number>(1);
  readonly pageSize = 10;

  /** View mode: 'card' (default) or 'list'. */
  readonly viewMode = signal<'card' | 'list'>('card');

  filterStatusModel = '';
  filterSeasonModel = '';

  ngOnInit(): void {
    this.loadTournaments();
  }

  loadTournaments(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const filters: TournamentFilters = {
      page:     this.currentPage(),
      pageSize: this.pageSize,
    };
    if (this.filterStatus()) filters.status  = this.filterStatus();
    if (this.filterSeason()) filters.season  = this.filterSeason();

    this.tournamentService.getAll(filters).subscribe({
      next: (response) => {
        this.tournaments.set(response.data);
        this.totalCount.set(response.total);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudieron cargar los torneos. Intenta nuevamente.');
        this.isLoading.set(false);
      },
    });
  }

  onApplyFilters(): void {
    this.filterStatus.set(this.filterStatusModel);
    this.filterSeason.set(this.filterSeasonModel);
    this.currentPage.set(1);
    this.loadTournaments();
  }

  onClearFilters(): void {
    this.filterStatusModel = '';
    this.filterSeasonModel = '';
    this.filterStatus.set('');
    this.filterSeason.set('');
    this.currentPage.set(1);
    this.loadTournaments();
  }

  onCreateTournament(): void {
    this.router.navigate(['/tournaments', 'new']);
  }

  onEditTournament(id: string): void {
    this.router.navigate(['/tournaments', id, 'edit']);
  }

  onViewDetail(id: string): void {
    this.router.navigate(['/tournaments', id]);
  }

  onDeleteConfirm(tournament: Tournament): void {
    this.selectedTournamentId.set(tournament.id);
    this.selectedTournamentName.set(tournament.name);
    this.showDeleteDialog.set(true);
  }

  onDeleteCancelled(): void {
    this.showDeleteDialog.set(false);
    this.selectedTournamentId.set(null);
  }

  onDeleteConfirmed(): void {
    const id = this.selectedTournamentId();
    if (id === null) return;
    this.showDeleteDialog.set(false);
    this.tournamentService.delete(id).subscribe({
      next:  () => this.loadTournaments(),
      error: () => this.errorMessage.set('No se pudo eliminar el torneo.'),
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadTournaments();
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount() / this.pageSize);
  }

  get pageRange(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  /** Maps backend status values to display labels. */
  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft:     'Borrador',
      active:    'Activo',
      finished:  'Finalizado',
      suspended: 'Suspendido',
      cancelled: 'Cancelado',
      archived:  'Archivado',
    };
    return labels[status] ?? status;
  }

  toggleView(): void {
    this.viewMode.set(this.viewMode() === 'card' ? 'list' : 'card');
  }
}
