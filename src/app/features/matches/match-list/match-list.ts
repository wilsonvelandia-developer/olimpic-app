import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule }    from '@angular/forms';
import { forkJoin, of }  from 'rxjs';
import { catchError }    from 'rxjs/operators';
import { MatchService }   from '../match.service';
import { ApiService }     from '../../../core/services/api.service';
import { StatusBadge }    from '../../../shared/components/status-badge/status-badge';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ConfirmDialog }  from '../../../shared/components/confirm-dialog/confirm-dialog';
import { ViewToggle, type ViewMode } from '../../../shared/components/view-toggle/view-toggle';
import { AuthService }    from '../../../core/services/auth.service';
import type { Match, Team } from '../../../core/models';
import type { MatchFilters } from '../match.service';

@Component({
  selector: 'app-match-list',
  imports: [FormsModule, StatusBadge, LoadingSpinner, ConfirmDialog, ViewToggle],
  templateUrl: './match-list.html',
  styleUrl: './match-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchList implements OnInit {
  private readonly matchService = inject(MatchService);
  private readonly api          = inject(ApiService);
  private readonly router       = inject(Router);
  readonly auth = inject(AuthService);

  readonly matches      = signal<Match[]>([]);
  readonly totalCount   = signal<number>(0);
  readonly isLoading    = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly showDeleteDialog   = signal<boolean>(false);
  readonly selectedMatchId    = signal<string | null>(null);
  readonly selectedMatchLabel = signal<string>('');

  readonly currentPage = signal<number>(1);
  readonly pageSize    = 10;

  /** Team lookup cache: id → { name, imageUrl } */
  private teamMap = new Map<string, { name: string; imageUrl: string | null }>();
  readonly viewMode = signal<ViewMode>('card');

  phaseIdModel      = '';
  filterStatusModel = '';
  tournamentIdModel = '';

  readonly tournaments = signal<Array<{ id: string; name: string; category: string | null }>>([]);
  readonly phases      = signal<Array<{ id: string; name: string }>>([]);

  ngOnInit(): void {
    this.loadMatches();
    this.api.get<Array<{ id: string; name: string; category: string | null }>>('/tournaments').subscribe({
      next: (res) => { if (res.success && res.data) this.tournaments.set(res.data); },
    });
  }

  onTournamentFilterChange(): void {
    const tid = this.tournamentIdModel;
    this.phaseIdModel = '';
    if (tid) {
      this.api.get<Array<{ id: string; name: string }>>(`/tournaments/${tid}/phases`).subscribe({
        next: (res) => { if (res.success && res.data) this.phases.set(res.data); },
      });
    } else {
      this.phases.set([]);
    }
    this.onApplyFilters();
  }

  loadMatches(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const filters: MatchFilters = { page: this.currentPage(), pageSize: this.pageSize };
    if (this.phaseIdModel.trim())  filters.phaseId = this.phaseIdModel.trim();
    if (this.filterStatusModel)    filters.status  = this.filterStatusModel;

    forkJoin({
      matches: this.matchService.getAll(filters),
      teams:   this.api.getPaginated<Team>('/teams', { pageSize: 500 }).pipe(
        catchError(() => of({ data: [] as Team[], total: 0, page: 1, pageSize: 500, totalPages: 0, success: true, message: '' })),
      ),
    }).subscribe({
      next: ({ matches, teams }) => {
        // Build team lookup
        (teams.data as Team[]).forEach((t) => this.teamMap.set(t.id, { name: t.shortName ?? t.name, imageUrl: t.imageUrl ?? null }));

        // Enrich matches with team names
        const enriched = matches.data.map((m) => ({
          ...m,
          homeTeamName: this.teamMap.get(m.homeTeamId)?.name ?? m.homeTeamId.slice(0, 8),
          awayTeamName: this.teamMap.get(m.awayTeamId)?.name ?? m.awayTeamId.slice(0, 8),
        }));

        this.matches.set(enriched);
        this.totalCount.set(matches.total);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudieron cargar los partidos.');
        this.isLoading.set(false);
      },
    });
  }

  onApplyFilters(): void  { this.currentPage.set(1); this.loadMatches(); }
  onClearFilters(): void  { this.phaseIdModel = ''; this.filterStatusModel = ''; this.tournamentIdModel = ''; this.phases.set([]); this.currentPage.set(1); this.loadMatches(); }
  onScheduleMatch(): void { this.router.navigate(['/matches', 'new']); }
  onViewDetail(id: string): void     { this.router.navigate(['/matches', id]); }
  onRegisterResult(id: string): void { this.router.navigate(['/matches', id, 'result']); }

  onDeleteConfirm(match: Match): void {
    this.selectedMatchId.set(match.id);
    this.selectedMatchLabel.set(`${match.homeTeamName ?? match.homeTeamId} vs ${match.awayTeamName ?? match.awayTeamId}`);
    this.showDeleteDialog.set(true);
  }

  onDeleteCancelled(): void { this.showDeleteDialog.set(false); this.selectedMatchId.set(null); }

  onDeleteConfirmed(): void {
    const id = this.selectedMatchId();
    if (!id) return;
    this.showDeleteDialog.set(false);
    this.matchService.delete(id).subscribe({
      next:  () => this.loadMatches(),
      error: () => this.errorMessage.set('No se pudo eliminar el partido.'),
    });
  }

  onPageChange(page: number): void { this.currentPage.set(page); this.loadMatches(); }

  get totalPages(): number   { return Math.ceil(this.totalCount() / this.pageSize); }
  get pageRange():  number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  formatDateTime(d: string | null | undefined): string {
    if (!d) return '—';
    return new Date(d).toLocaleString('es-CO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  canRegisterResult(m: Match): boolean { return m.status === 'scheduled' || m.status === 'in_progress'; }

  teamLabel(m: Match, side: 'home' | 'away'): string {
    const id = side === 'home' ? m.homeTeamId : m.awayTeamId;
    return m[side === 'home' ? 'homeTeamName' : 'awayTeamName']
      ?? this.teamMap.get(id)?.name
      ?? id.slice(0, 8);
  }

  teamImage(m: Match, side: 'home' | 'away'): string {
    const id = side === 'home' ? m.homeTeamId : m.awayTeamId;
    return this.teamMap.get(id)?.imageUrl ?? 'https://img.icons8.com/3d-fluency/256/shield.png';
  }
}
