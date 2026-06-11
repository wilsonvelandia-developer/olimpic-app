import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TeamService } from '../team.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { AuthService } from '../../../core/services/auth.service';
import type { Team } from '../../../core/models';
import type { TeamFilters } from '../team.service';
import { SlicePipe } from '@angular/common';

@Component({
  selector: 'app-team-list',
  imports: [FormsModule, LoadingSpinner, ConfirmDialog, SlicePipe],
  templateUrl: './team-list.html',
  styleUrl: './team-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamList implements OnInit {
  private readonly teamService = inject(TeamService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly teams = signal<Team[]>([]);
  readonly totalCount = signal<number>(0);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly showDeleteDialog = signal<boolean>(false);
  readonly selectedTeamId = signal<number | null>(null);
  readonly selectedTeamName = signal<string>('');

  readonly currentPage = signal<number>(1);
  readonly pageSize = 10;

  // Filter models
  searchModel = '';
  filterActiveModel = '';

  ngOnInit(): void {
    this.loadTeams();
  }

  loadTeams(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const filters: TeamFilters = {
      page: this.currentPage(),
      pageSize: this.pageSize,
    };
    if (this.searchModel.trim()) filters.search = this.searchModel.trim();
    if (this.filterActiveModel !== '') filters.isActive = this.filterActiveModel === 'true';

    this.teamService.getAll(filters).subscribe({
      next: (response) => {
        this.teams.set(response.data);
        this.totalCount.set(response.total);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudieron cargar los equipos. Intenta nuevamente.');
        this.isLoading.set(false);
      },
    });
  }

  onApplyFilters(): void {
    this.currentPage.set(1);
    this.loadTeams();
  }

  onClearFilters(): void {
    this.searchModel = '';
    this.filterActiveModel = '';
    this.currentPage.set(1);
    this.loadTeams();
  }

  onCreateTeam(): void {
    this.router.navigate(['/teams', 'new']);
  }

  onEditTeam(id: number): void {
    this.router.navigate(['/teams', id, 'edit']);
  }

  onViewDetail(id: number): void {
    this.router.navigate(['/teams', id]);
  }

  onDeleteConfirm(team: Team): void {
    this.selectedTeamId.set(team.id);
    this.selectedTeamName.set(team.name);
    this.showDeleteDialog.set(true);
  }

  onDeleteCancelled(): void {
    this.showDeleteDialog.set(false);
    this.selectedTeamId.set(null);
  }

  onDeleteConfirmed(): void {
    const id = this.selectedTeamId();
    if (id === null) return;
    this.showDeleteDialog.set(false);
    this.teamService.delete(id).subscribe({
      next: () => this.loadTeams(),
      error: () => this.errorMessage.set('No se pudo eliminar el equipo.'),
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadTeams();
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount() / this.pageSize);
  }

  get pageRange(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
