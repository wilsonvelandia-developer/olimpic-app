import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule }   from '@angular/forms';
import { PlayerService } from '../player.service';
import { ApiService }    from '../../../core/services/api.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ConfirmDialog }  from '../../../shared/components/confirm-dialog/confirm-dialog';
import { ViewToggle, type ViewMode } from '../../../shared/components/view-toggle/view-toggle';
import { AuthService }    from '../../../core/services/auth.service';
import type { Player } from '../../../core/models';

@Component({
  selector: 'app-player-list',
  imports: [FormsModule, LoadingSpinner, ConfirmDialog, ViewToggle],
  templateUrl: './player-list.html',
  styleUrl: './player-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerList implements OnInit {
  private readonly playerService = inject(PlayerService);
  private readonly api           = inject(ApiService);
  private readonly router        = inject(Router);
  private readonly route         = inject(ActivatedRoute);
  readonly auth = inject(AuthService);

  readonly players      = signal<Player[]>([]);
  readonly totalCount   = signal<number>(0);
  readonly isLoading    = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly showDeleteDialog    = signal<boolean>(false);
  readonly selectedPlayerId    = signal<string | null>(null);
  readonly selectedPlayerTeam  = signal<string>('');
  readonly selectedPlayerName  = signal<string>('');

  readonly currentPage = signal<number>(1);
  readonly pageSize    = 10;
  readonly viewMode    = signal<ViewMode>('card');

  teamIdModel = '';
  readonly teams = signal<Array<{ id: string; name: string }>>([]);

  ngOnInit(): void {
    const teamId = this.route.snapshot.queryParamMap.get('teamId');
    if (teamId) this.teamIdModel = teamId;

    // Load teams for the dropdown
    this.api.get<Array<{ id: string; name: string }>>('/teams').subscribe({
      next: (res) => { if (res.success && res.data) this.teams.set(res.data); },
    });

    if (this.teamIdModel) this.loadPlayers();
  }

  loadPlayers(): void {
    if (!this.teamIdModel.trim()) {
      this.players.set([]);
      this.errorMessage.set('Introduce el UUID de un equipo para ver sus jugadores.');
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.playerService.getAllByTeam(this.teamIdModel.trim(), {
      page: this.currentPage(), pageSize: this.pageSize,
    }).subscribe({
      next: (r) => { this.players.set(r.data); this.totalCount.set(r.total); this.isLoading.set(false); },
      error: () => { this.errorMessage.set('No se pudieron cargar los jugadores.'); this.isLoading.set(false); },
    });
  }

  onApplyFilters(): void  { this.currentPage.set(1); this.loadPlayers(); }
  onClearFilters(): void  { this.teamIdModel = ''; this.players.set([]); this.errorMessage.set(null); }

  onCreatePlayer(): void { this.router.navigate(['/players', 'new'], { queryParams: { teamId: this.teamIdModel } }); }

  onViewDetail(p: Player): void  { this.router.navigate(['/teams', p.teamId, 'players', p.id]); }
  onEditPlayer(p: Player): void  { this.router.navigate(['/teams', p.teamId, 'players', p.id, 'edit']); }

  onDeleteConfirm(player: Player): void {
    this.selectedPlayerId.set(player.id);
    this.selectedPlayerTeam.set(player.teamId);
    this.selectedPlayerName.set(player.name);
    this.showDeleteDialog.set(true);
  }

  onDeleteCancelled(): void { this.showDeleteDialog.set(false); this.selectedPlayerId.set(null); }

  onDeleteConfirmed(): void {
    const id     = this.selectedPlayerId();
    const teamId = this.selectedPlayerTeam();
    if (!id || !teamId) return;
    this.showDeleteDialog.set(false);
    this.playerService.delete(teamId, id).subscribe({
      next:  () => this.loadPlayers(),
      error: () => this.errorMessage.set('No se pudo eliminar el jugador.'),
    });
  }

  onPageChange(page: number): void { this.currentPage.set(page); this.loadPlayers(); }

  get totalPages(): number   { return Math.ceil(this.totalCount() / this.pageSize); }
  get pageRange():  number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
}
