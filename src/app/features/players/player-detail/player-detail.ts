import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PlayerService } from '../player.service';
import { PlayerStatsComponent } from '../player-stats/player-stats';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ConfirmDialog }  from '../../../shared/components/confirm-dialog/confirm-dialog';
import type { Player } from '../../../core/models';

@Component({
  selector: 'app-player-detail',
  imports: [RouterLink, LoadingSpinner, ConfirmDialog, PlayerStatsComponent],
  templateUrl: './player-detail.html',
  styleUrl: './player-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerDetail implements OnInit {
  private readonly route         = inject(ActivatedRoute);
  private readonly router        = inject(Router);
  private readonly playerService = inject(PlayerService);

  readonly player           = signal<Player | null>(null);
  readonly isLoading        = signal<boolean>(false);
  readonly errorMessage     = signal<string | null>(null);
  readonly showDeleteDialog = signal<boolean>(false);

  ngOnInit(): void {
    // Supports /teams/:teamId/players/:id or /players/:id?teamId=...
    const teamId   = this.route.snapshot.paramMap.get('teamId')
                  ?? this.route.snapshot.queryParamMap.get('teamId') ?? '';
    const playerId = this.route.snapshot.paramMap.get('id') ?? '';
    if (teamId && playerId) this.loadPlayer(teamId, playerId);
  }

  private loadPlayer(teamId: string, playerId: string): void {
    this.isLoading.set(true);
    this.playerService.getById(teamId, playerId).subscribe({
      next:  (p) => { this.player.set(p); this.isLoading.set(false); },
      error: () => { this.errorMessage.set('No se pudo cargar el jugador.'); this.isLoading.set(false); },
    });
  }

  onEdit(): void {
    const p = this.player();
    if (p) this.router.navigate(['/teams', p.teamId, 'players', p.id, 'edit']);
  }

  onViewTeam(): void {
    const teamId = this.player()?.teamId;
    if (teamId) this.router.navigate(['/teams', teamId]);
  }

  onDeleteConfirm():  void { this.showDeleteDialog.set(true); }
  onDeleteCancelled(): void { this.showDeleteDialog.set(false); }

  onDeleteConfirmed(): void {
    const p = this.player();
    if (!p) return;
    this.showDeleteDialog.set(false);
    this.playerService.delete(p.teamId, p.id).subscribe({
      next:  () => this.router.navigate(['/teams', p.teamId]),
      error: () => this.errorMessage.set('No se pudo eliminar el jugador.'),
    });
  }
}
