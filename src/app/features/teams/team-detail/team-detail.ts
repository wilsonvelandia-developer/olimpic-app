import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SlicePipe } from '@angular/common';
import { TeamService } from '../team.service';
import { PlayerService } from '../../players/player.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import type { Team, Player } from '../../../core/models';

/**
 * Team detail view. Shows team metadata and a list of its players.
 */
@Component({
  selector: 'app-team-detail',
  imports: [RouterLink, SlicePipe, LoadingSpinner, ConfirmDialog],
  templateUrl: './team-detail.html',
  styleUrl: './team-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly teamService = inject(TeamService);
  private readonly playerService = inject(PlayerService);

  readonly team = signal<Team | null>(null);
  readonly players = signal<Player[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isLoadingPlayers = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showDeleteDialog = signal<boolean>(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTeam(Number(id));
      this.loadPlayers(Number(id));
    }
  }

  private loadTeam(id: number): void {
    this.isLoading.set(true);
    this.teamService.getById(id).subscribe({
      next: (data) => {
        this.team.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudo cargar el equipo.');
        this.isLoading.set(false);
      },
    });
  }

  private loadPlayers(teamId: number): void {
    this.isLoadingPlayers.set(true);
    this.playerService.getAll({ teamId, pageSize: 50 }).subscribe({
      next: (response) => {
        this.players.set(response.data);
        this.isLoadingPlayers.set(false);
      },
      error: () => this.isLoadingPlayers.set(false),
    });
  }

  onEdit(): void {
    const id = this.team()?.id;
    if (id) this.router.navigate(['/teams', id, 'edit']);
  }

  onAddPlayer(): void {
    this.router.navigate(['/players', 'new'], {
      queryParams: { teamId: this.team()?.id },
    });
  }

  onEditPlayer(playerId: number): void {
    this.router.navigate(['/players', playerId, 'edit']);
  }

  onDeleteConfirm(): void {
    this.showDeleteDialog.set(true);
  }

  onDeleteCancelled(): void {
    this.showDeleteDialog.set(false);
  }

  onDeleteConfirmed(): void {
    const id = this.team()?.id;
    if (!id) return;
    this.showDeleteDialog.set(false);
    this.teamService.delete(id).subscribe({
      next: () => this.router.navigate(['/teams']),
      error: () => this.errorMessage.set('No se pudo eliminar el equipo.'),
    });
  }

  getPlayerFullName(player: Player): string {
    return `${player.firstName} ${player.lastName}`;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
