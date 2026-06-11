import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  computed,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TournamentService } from '../tournament.service';
import { StandingsService } from '../standings.service';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { StandingsTable } from '../standings-table/standings-table';
import { TournamentStats } from '../tournament-stats/tournament-stats';
import { MatchHistory } from '../match-history/match-history';
import { AuthService } from '../../../core/services/auth.service';
import type { Tournament, StandingsEntry, TournamentStatsData, Match } from '../../../core/models';

type ActiveTab = 'standings' | 'matches' | 'stats';

/**
 * Tournament detail view with standings table, match history and statistics.
 */
@Component({
  selector: 'app-tournament-detail',
  imports: [
    RouterLink,
    StatusBadge,
    LoadingSpinner,
    ConfirmDialog,
    StandingsTable,
    TournamentStats,
    MatchHistory,
  ],
  templateUrl: './tournament-detail.html',
  styleUrl: './tournament-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tournamentService = inject(TournamentService);
  private readonly standingsService = inject(StandingsService);
  readonly auth = inject(AuthService);

  readonly tournament = signal<Tournament | null>(null);
  readonly standings = signal<StandingsEntry[]>([]);
  readonly stats = signal<TournamentStatsData | null>(null);
  readonly matches = signal<Match[]>([]);
  readonly totalMatches = signal<number>(0);
  readonly matchPage = signal<number>(1);

  readonly isLoading = signal<boolean>(false);
  readonly isLoadingStandings = signal<boolean>(false);
  readonly isLoadingStats = signal<boolean>(false);
  readonly isLoadingMatches = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showDeleteDialog = signal<boolean>(false);

  readonly activeTab = signal<ActiveTab>('standings');

  readonly tabLabel = computed(() => {
    const tab = this.activeTab();
    if (tab === 'standings') return 'Tabla de posiciones';
    if (tab === 'matches') return 'Partidos';
    return 'Estadísticas';
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadAll(Number(id));
    }
  }

  private loadAll(id: number): void {
    this.loadTournament(id);
    this.loadStandings(id);
    this.loadStats(id);
    this.loadMatches(id, 1);
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

  private loadStandings(id: number): void {
    this.isLoadingStandings.set(true);
    // Try API first; on error, compute from matches
    this.standingsService.getStandings(id).subscribe({
      next: (data) => {
        this.standings.set(data);
        this.isLoadingStandings.set(false);
      },
      error: () => {
        // Fallback: compute locally
        this.standingsService.computeStandingsFromMatches(id).subscribe({
          next: (data) => {
            this.standings.set(data);
            this.isLoadingStandings.set(false);
          },
          error: () => this.isLoadingStandings.set(false),
        });
      },
    });
  }

  private loadStats(id: number): void {
    this.isLoadingStats.set(true);
    this.standingsService.getTournamentStats(id).subscribe({
      next: (data) => {
        this.stats.set(data);
        this.isLoadingStats.set(false);
      },
      error: () => this.isLoadingStats.set(false),
    });
  }

  private loadMatches(id: number, page: number): void {
    this.isLoadingMatches.set(true);
    this.standingsService.getTournamentMatches(id, page).subscribe({
      next: ({ data, total }) => {
        this.matches.set(data);
        this.totalMatches.set(total);
        this.isLoadingMatches.set(false);
      },
      error: () => this.isLoadingMatches.set(false),
    });
  }

  onTabChange(tab: ActiveTab): void {
    this.activeTab.set(tab);
  }

  onMatchPageChange(page: number): void {
    const id = this.tournament()?.id;
    if (!id) return;
    this.matchPage.set(page);
    this.loadMatches(id, page);
  }

  onMatchClick(matchId: number): void {
    this.router.navigate(['/matches', matchId]);
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
