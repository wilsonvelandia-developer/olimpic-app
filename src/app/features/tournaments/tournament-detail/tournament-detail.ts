import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  computed,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TournamentService }  from '../tournament.service';
import { StandingsService }   from '../standings.service';
import { StatusBadge }        from '../../../shared/components/status-badge/status-badge';
import { LoadingSpinner }     from '../../../shared/components/loading-spinner/loading-spinner';
import { ConfirmDialog }      from '../../../shared/components/confirm-dialog/confirm-dialog';
import { StandingsTable }     from '../standings-table/standings-table';
import { TournamentStats }    from '../tournament-stats/tournament-stats';
import { MatchHistory }       from '../match-history/match-history';
import { GroupDraw }          from '../group-draw/group-draw';
import { FixtureMatches }    from '../fixture-matches/fixture-matches';
import { GroupStandings }    from '../group-standings/group-standings';
import { EnrollmentManager } from '../enrollment-manager/enrollment-manager';
import { TournamentVenues }        from '../tournament-venues/tournament-venues';
import { TournamentPayments }      from '../tournament-payments/tournament-payments';
import { TournamentAnnouncements } from '../tournament-announcements/tournament-announcements';
import { TournamentGallery }       from '../tournament-gallery/tournament-gallery';
import { AuthService }        from '../../../core/services/auth.service';
import type {
  Tournament, StandingsEntry, TournamentStatsData, Match,
} from '../../../core/models';

type ActiveTab = 'info' | 'groups' | 'matches' | 'standings' | 'stats' | 'enrollments' | 'venues' | 'payments' | 'announcements' | 'gallery';

@Component({
  selector: 'app-tournament-detail',
  imports: [
    RouterLink, StatusBadge, LoadingSpinner, ConfirmDialog,
    StandingsTable, TournamentStats, MatchHistory, GroupDraw, FixtureMatches, GroupStandings,
    EnrollmentManager, TournamentVenues, TournamentPayments, TournamentAnnouncements, TournamentGallery,
  ],
  templateUrl: './tournament-detail.html',
  styleUrl:    './tournament-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentDetail implements OnInit {
  private readonly route             = inject(ActivatedRoute);
  private readonly router            = inject(Router);
  private readonly tournamentService = inject(TournamentService);
  private readonly standingsService  = inject(StandingsService);
  readonly auth = inject(AuthService);

  readonly tournament         = signal<Tournament | null>(null);
  readonly standings          = signal<StandingsEntry[]>([]);
  readonly stats              = signal<TournamentStatsData | null>(null);
  readonly matches            = signal<Match[]>([]);
  readonly totalMatches       = signal<number>(0);
  readonly matchPage          = signal<number>(1);
  readonly isLoading          = signal<boolean>(false);
  readonly isLoadingStandings = signal<boolean>(false);
  readonly isLoadingStats     = signal<boolean>(false);
  readonly isLoadingMatches   = signal<boolean>(false);
  readonly errorMessage       = signal<string | null>(null);
  readonly showDeleteDialog   = signal<boolean>(false);
  readonly activeTab          = signal<ActiveTab>('info');

  readonly tabLabel = computed(() => {
    const t = this.activeTab();
    if (t === 'info')          return 'Información general';
    if (t === 'groups')        return 'Grupos';
    if (t === 'matches')       return 'Partidos';
    if (t === 'standings')     return 'Posiciones';
    if (t === 'stats')         return 'Estadísticas';
    if (t === 'enrollments')   return 'Inscripciones';
    if (t === 'venues')        return 'Sedes';
    if (t === 'payments')      return 'Pagos';
    if (t === 'announcements') return 'Comunicados';
    if (t === 'gallery')       return 'Galería';
    return 'Información general';
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadAll(id);
  }

  private loadAll(id: string): void {
    this.loadTournament(id);
    this.loadStandings(id);
    this.loadStats(id);
    this.loadMatches(id, 1);
  }

  private loadTournament(id: string): void {
    this.isLoading.set(true);
    this.tournamentService.getById(id).subscribe({
      next:  (data) => { this.tournament.set(data); this.isLoading.set(false); },
      error: () => {
        this.errorMessage.set('No se pudo cargar el torneo.');
        this.isLoading.set(false);
      },
    });
  }

  private loadStandings(id: string): void {
    this.isLoadingStandings.set(true);
    this.standingsService.getStandings(id).subscribe({
      next:  (data) => { this.standings.set(data); this.isLoadingStandings.set(false); },
      error: () => {
        this.standingsService.computeStandingsFromMatches(id).subscribe({
          next:  (data) => { this.standings.set(data); this.isLoadingStandings.set(false); },
          error: () => this.isLoadingStandings.set(false),
        });
      },
    });
  }

  private loadStats(id: string): void {
    this.isLoadingStats.set(true);
    this.standingsService.getTournamentStats(id).subscribe({
      next:  (data) => { this.stats.set(data); this.isLoadingStats.set(false); },
      error: () => this.isLoadingStats.set(false),
    });
  }

  private loadMatches(id: string, page: number): void {
    this.isLoadingMatches.set(true);
    this.standingsService.getTournamentMatches(id, page).subscribe({
      next:  ({ data, total }) => {
        this.matches.set(data);
        this.totalMatches.set(total);
        this.isLoadingMatches.set(false);
      },
      error: () => this.isLoadingMatches.set(false),
    });
  }

  onTabChange(tab: ActiveTab): void { this.activeTab.set(tab); }

  onMatchPageChange(page: number): void {
    const id = this.tournament()?.id;
    if (!id) return;
    this.matchPage.set(page);
    this.loadMatches(id, page);
  }

  onMatchClick(matchId: string): void { this.router.navigate(['/matches', matchId]); }

  onEdit(): void {
    const id = this.tournament()?.id;
    if (id) this.router.navigate(['/tournaments', id, 'edit']);
  }

  onDeleteConfirm(): void  { this.showDeleteDialog.set(true); }
  onDeleteCancelled(): void { this.showDeleteDialog.set(false); }

  onDeleteConfirmed(): void {
    const id = this.tournament()?.id;
    if (!id) return;
    this.showDeleteDialog.set(false);
    this.tournamentService.delete(id).subscribe({
      next:  () => this.router.navigate(['/tournaments']),
      error: () => this.errorMessage.set('No se pudo eliminar el torneo.'),
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-CO', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  }

  formatLabel(format: string): string {
    const labels: Record<string, string> = {
      groups_knockout:    'Grupos + Eliminatoria',
      round_robin:        'Todos contra todos',
      single_elimination: 'Eliminación simple',
      double_elimination: 'Eliminación doble',
      groups:             'Grupos',
      single_elim:        'Eliminación simple',
      double_elim:        'Eliminación doble',
    };
    return labels[format] ?? format;
  }
}
