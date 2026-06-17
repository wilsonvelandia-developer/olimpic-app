import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TeamService }   from '../team.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ConfirmDialog }  from '../../../shared/components/confirm-dialog/confirm-dialog';
import { AuthService }    from '../../../core/services/auth.service';
import type { Team, Player } from '../../../core/models';

@Component({
  selector: 'app-team-detail',
  imports: [RouterLink, LoadingSpinner, ConfirmDialog],
  templateUrl: './team-detail.html',
  styleUrl: './team-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamDetail implements OnInit {
  private readonly route       = inject(ActivatedRoute);
  private readonly router      = inject(Router);
  private readonly teamService = inject(TeamService);
  readonly auth = inject(AuthService);

  readonly team              = signal<Team | null>(null);
  readonly players           = signal<Player[]>([]);
  readonly isLoading         = signal<boolean>(false);
  readonly isLoadingPlayers  = signal<boolean>(false);
  readonly errorMessage      = signal<string | null>(null);
  readonly showDeleteDialog  = signal<boolean>(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTeam(id);
      this.loadPlayers(id);
    }
  }

  private loadTeam(id: string): void {
    this.isLoading.set(true);
    this.teamService.getById(id).subscribe({
      next:  (d) => { this.team.set(d); this.isLoading.set(false); },
      error: () => { this.errorMessage.set('No se pudo cargar el equipo.'); this.isLoading.set(false); },
    });
  }

  private loadPlayers(teamId: string): void {
    this.isLoadingPlayers.set(true);
    this.teamService.getPlayers(teamId, { pageSize: 50 }).subscribe({
      next:  (r) => { this.players.set(r.data); this.isLoadingPlayers.set(false); },
      error: () => this.isLoadingPlayers.set(false),
    });
  }

  onEdit(): void {
    const id = this.team()?.id;
    if (id) this.router.navigate(['/teams', id, 'edit']);
  }

  onAddPlayer(): void {
    this.router.navigate(['/players', 'new'], { queryParams: { teamId: this.team()?.id } });
  }

  onEditPlayer(playerId: string): void {
    const teamId = this.team()?.id;
    if (teamId) this.router.navigate(['/teams', teamId, 'players', playerId, 'edit']);
  }

  onDeleteConfirm():  void { this.showDeleteDialog.set(true); }
  onDeleteCancelled(): void { this.showDeleteDialog.set(false); }

  onDeleteConfirmed(): void {
    const id = this.team()?.id;
    if (!id) return;
    this.showDeleteDialog.set(false);
    this.teamService.delete(id).subscribe({
      next:  () => this.router.navigate(['/teams']),
      error: () => this.errorMessage.set('No se pudo eliminar el equipo.'),
    });
  }
}
