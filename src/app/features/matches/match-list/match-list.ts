import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatchService } from '../match.service';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { AuthService } from '../../../core/services/auth.service';
import type { Match } from '../../../core/models';
import type { MatchFilters } from '../match.service';

@Component({
  selector: 'app-match-list',
  imports: [FormsModule, StatusBadge, LoadingSpinner, ConfirmDialog],
  templateUrl: './match-list.html',
  styleUrl: './match-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchList implements OnInit {
  private readonly matchService = inject(MatchService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly matches = signal<Match[]>([]);
  readonly totalCount = signal<number>(0);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly showDeleteDialog = signal<boolean>(false);
  readonly selectedMatchId = signal<number | null>(null);
  readonly selectedMatchLabel = signal<string>('');

  readonly currentPage = signal<number>(1);
  readonly pageSize = 10;

  // Filter models
  tournamentIdModel = '';
  filterStatusModel = '';
  filterRoundModel = '';

  ngOnInit(): void {
    this.loadMatches();
  }

  loadMatches(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const filters: MatchFilters = { page: this.currentPage(), pageSize: this.pageSize };
    if (this.tournamentIdModel) filters.tournamentId = Number(this.tournamentIdModel);
    if (this.filterStatusModel) filters.status = this.filterStatusModel;
    if (this.filterRoundModel.trim()) filters.round = this.filterRoundModel.trim();

    this.matchService.getAll(filters).subscribe({
      next: (response) => {
        this.matches.set(response.data);
        this.totalCount.set(response.total);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudieron cargar los partidos. Intenta nuevamente.');
        this.isLoading.set(false);
      },
    });
  }

  onApplyFilters(): void {
    this.currentPage.set(1);
    this.loadMatches();
  }

  onClearFilters(): void {
    this.tournamentIdModel = '';
    this.filterStatusModel = '';
    this.filterRoundModel = '';
    this.currentPage.set(1);
    this.loadMatches();
  }

  onScheduleMatch(): void {
    this.router.navigate(['/matches', 'new']);
  }

  onViewDetail(id: number): void {
    this.router.navigate(['/matches', id]);
  }

  onRegisterResult(id: number): void {
    this.router.navigate(['/matches', id, 'result']);
  }

  onDeleteConfirm(match: Match): void {
    this.selectedMatchId.set(match.id);
    this.selectedMatchLabel.set(`${match.homeTeamName} vs ${match.awayTeamName}`);
    this.showDeleteDialog.set(true);
  }

  onDeleteCancelled(): void {
    this.showDeleteDialog.set(false);
    this.selectedMatchId.set(null);
  }

  onDeleteConfirmed(): void {
    const id = this.selectedMatchId();
    if (id === null) return;
    this.showDeleteDialog.set(false);
    this.matchService.delete(id).subscribe({
      next: () => this.loadMatches(),
      error: () => this.errorMessage.set('No se pudo eliminar el partido.'),
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadMatches();
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount() / this.pageSize);
  }

  get pageRange(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('es-CO', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  canRegisterResult(match: Match): boolean {
    return match.status === 'scheduled' || match.status === 'in_progress';
  }
}
