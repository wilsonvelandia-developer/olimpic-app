import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule }    from '@angular/forms';
import { TeamService }    from '../team.service';
import { ApiService }     from '../../../core/services/api.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ConfirmDialog }  from '../../../shared/components/confirm-dialog/confirm-dialog';
import { ViewToggle, type ViewMode } from '../../../shared/components/view-toggle/view-toggle';
import { AuthService }    from '../../../core/services/auth.service';
import type { Team } from '../../../core/models';
import type { TeamFilters } from '../team.service';

@Component({
  selector: 'app-team-list',
  imports: [FormsModule, LoadingSpinner, ConfirmDialog, ViewToggle],
  templateUrl: './team-list.html',
  styleUrl: './team-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamList implements OnInit {
  private readonly teamService = inject(TeamService);
  private readonly router      = inject(Router);
  private readonly api         = inject(ApiService);
  readonly auth = inject(AuthService);

  readonly teams        = signal<Team[]>([]);
  readonly tournaments  = signal<Array<{ id: string; name: string; category: string | null }>>([]);
  readonly totalCount   = signal<number>(0);
  readonly isLoading    = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly showDeleteDialog  = signal<boolean>(false);
  readonly selectedTeamId    = signal<string | null>(null);
  readonly selectedTeamName  = signal<string>('');

  readonly currentPage = signal<number>(1);
  readonly pageSize    = 10;
  readonly viewMode    = signal<ViewMode>('card');

  searchModel      = '';
  tournamentModel  = '';

  ngOnInit(): void {
    this.loadTeams();
    this.api.get<Array<{ id: string; name: string; category: string | null }>>('/tournaments').subscribe({
      next: (res) => { if (res.success && res.data) this.tournaments.set(res.data); },
    });
  }

  loadTeams(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const filters: TeamFilters = { page: this.currentPage(), pageSize: this.pageSize };
    if (this.searchModel.trim())     filters.search       = this.searchModel.trim();
    if (this.tournamentModel.trim()) filters.tournamentId = this.tournamentModel.trim();

    this.teamService.getAll(filters).subscribe({
      next: (r) => { this.teams.set(r.data); this.totalCount.set(r.total); this.isLoading.set(false); },
      error: () => { this.errorMessage.set('No se pudieron cargar los equipos.'); this.isLoading.set(false); },
    });
  }

  onApplyFilters(): void  { this.currentPage.set(1); this.loadTeams(); }
  onClearFilters(): void  { this.searchModel = ''; this.tournamentModel = ''; this.currentPage.set(1); this.loadTeams(); }
  onCreateTeam(): void    { this.router.navigate(['/teams', 'new']); }
  onEditTeam(id: string): void   { this.router.navigate(['/teams', id, 'edit']); }
  onViewDetail(id: string): void { this.router.navigate(['/teams', id]); }

  onDeleteConfirm(team: Team): void {
    this.selectedTeamId.set(team.id);
    this.selectedTeamName.set(team.name);
    this.showDeleteDialog.set(true);
  }

  onDeleteCancelled(): void { this.showDeleteDialog.set(false); this.selectedTeamId.set(null); }

  onDeleteConfirmed(): void {
    const id = this.selectedTeamId();
    if (!id) return;
    this.showDeleteDialog.set(false);
    this.teamService.delete(id).subscribe({
      next:  () => this.loadTeams(),
      error: () => this.errorMessage.set('No se pudo eliminar el equipo.'),
    });
  }

  onPageChange(page: number): void { this.currentPage.set(page); this.loadTeams(); }

  get totalPages(): number   { return Math.ceil(this.totalCount() / this.pageSize); }
  get pageRange():  number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
}
