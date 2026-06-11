import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PlayerService } from '../player.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import type { Player } from '../../../core/models';
import type { PlayerFilters } from '../player.service';

@Component({
  selector: 'app-player-list',
  imports: [FormsModule, LoadingSpinner, ConfirmDialog],
  templateUrl: './player-list.html',
  styleUrl: './player-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerList implements OnInit {
  private readonly playerService = inject(PlayerService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly players = signal<Player[]>([]);
  readonly totalCount = signal<number>(0);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly showDeleteDialog = signal<boolean>(false);
  readonly selectedPlayerId = signal<number | null>(null);
  readonly selectedPlayerName = signal<string>('');

  readonly currentPage = signal<number>(1);
  readonly pageSize = 10;

  // Filter models
  searchModel = '';
  teamIdModel = '';
  filterActiveModel = '';

  ngOnInit(): void {
    // Support pre-filtering by teamId from query params (e.g. from team detail)
    const teamId = this.route.snapshot.queryParamMap.get('teamId');
    if (teamId) this.teamIdModel = teamId;
    this.loadPlayers();
  }

  loadPlayers(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const filters: PlayerFilters = {
      page: this.currentPage(),
      pageSize: this.pageSize,
    };
    if (this.searchModel.trim()) filters.search = this.searchModel.trim();
    if (this.teamIdModel) filters.teamId = Number(this.teamIdModel);
    if (this.filterActiveModel !== '') filters.isActive = this.filterActiveModel === 'true';

    this.playerService.getAll(filters).subscribe({
      next: (response) => {
        this.players.set(response.data);
        this.totalCount.set(response.total);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudieron cargar los jugadores. Intenta nuevamente.');
        this.isLoading.set(false);
      },
    });
  }

  onApplyFilters(): void {
    this.currentPage.set(1);
    this.loadPlayers();
  }

  onClearFilters(): void {
    this.searchModel = '';
    this.teamIdModel = '';
    this.filterActiveModel = '';
    this.currentPage.set(1);
    this.loadPlayers();
  }

  onCreatePlayer(): void {
    this.router.navigate(['/players', 'new']);
  }

  onEditPlayer(id: number): void {
    this.router.navigate(['/players', id, 'edit']);
  }

  onViewDetail(id: number): void {
    this.router.navigate(['/players', id]);
  }

  onDeleteConfirm(player: Player): void {
    this.selectedPlayerId.set(player.id);
    this.selectedPlayerName.set(`${player.firstName} ${player.lastName}`);
    this.showDeleteDialog.set(true);
  }

  onDeleteCancelled(): void {
    this.showDeleteDialog.set(false);
    this.selectedPlayerId.set(null);
  }

  onDeleteConfirmed(): void {
    const id = this.selectedPlayerId();
    if (id === null) return;
    this.showDeleteDialog.set(false);
    this.playerService.delete(id).subscribe({
      next: () => this.loadPlayers(),
      error: () => this.errorMessage.set('No se pudo eliminar el jugador.'),
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadPlayers();
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount() / this.pageSize);
  }

  get pageRange(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getFullName(player: Player): string {
    return `${player.firstName} ${player.lastName}`;
  }
}
