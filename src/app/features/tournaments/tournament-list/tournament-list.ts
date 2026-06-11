import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TournamentService } from '../tournament.service';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import type { Tournament, TournamentFormat } from '../../../core/models';
import type { TournamentFilters } from '../tournament.service';

@Component({
  selector: 'app-tournament-list',
  imports: [SlicePipe, StatusBadge, LoadingSpinner, ConfirmDialog, FormsModule],
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
  readonly selectedTournamentId = signal<number | null>(null);
  readonly selectedTournamentName = signal<string>('');

  // Filters
  readonly filterStatus = signal<string>('');
  readonly filterSeason = signal<string>('');
  readonly currentPage = signal<number>(1);
  readonly pageSize = 10;

  // Form models for ngModel bindings
  filterStatusModel = '';
  filterSeasonModel = '';

  ngOnInit(): void {
    this.loadTournaments();
  }

  loadTournaments(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const filters: TournamentFilters = {
      page: this.currentPage(),
      pageSize: this.pageSize,
    };
    if (this.filterStatus()) filters.status = this.filterStatus();
    if (this.filterSeason()) filters.season = this.filterSeason();

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

  onEditTournament(id: number): void {
    this.router.navigate(['/tournaments', id, 'edit']);
  }

  onViewDetail(id: number): void {
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
      next: () => this.loadTournaments(),
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

  formatLabel(format: TournamentFormat): string {
    const labels: Record<TournamentFormat, string> = {
      groups_knockout: 'Grupos + Eliminatoria',
      round_robin: 'Todos contra todos',
      single_elimination: 'Eliminación simple',
      double_elimination: 'Eliminación doble',
    };
    return labels[format] ?? format;
  }
}
