import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  computed,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PlayerService } from '../player.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import type { Player } from '../../../core/models';

/**
 * Player detail view with full profile information.
 */
@Component({
  selector: 'app-player-detail',
  imports: [RouterLink, LoadingSpinner, ConfirmDialog],
  templateUrl: './player-detail.html',
  styleUrl: './player-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly playerService = inject(PlayerService);

  readonly player = signal<Player | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showDeleteDialog = signal<boolean>(false);

  readonly fullName = computed(() => {
    const p = this.player();
    return p ? `${p.firstName} ${p.lastName}` : '';
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadPlayer(Number(id));
  }

  private loadPlayer(id: number): void {
    this.isLoading.set(true);
    this.playerService.getById(id).subscribe({
      next: (data) => {
        this.player.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudo cargar el jugador.');
        this.isLoading.set(false);
      },
    });
  }

  onEdit(): void {
    const id = this.player()?.id;
    if (id) this.router.navigate(['/players', id, 'edit']);
  }

  onViewTeam(): void {
    const teamId = this.player()?.teamId;
    if (teamId) this.router.navigate(['/teams', teamId]);
  }

  onDeleteConfirm(): void {
    this.showDeleteDialog.set(true);
  }

  onDeleteCancelled(): void {
    this.showDeleteDialog.set(false);
  }

  onDeleteConfirmed(): void {
    const id = this.player()?.id;
    if (!id) return;
    this.showDeleteDialog.set(false);
    this.playerService.delete(id).subscribe({
      next: () => this.router.navigate(['/players']),
      error: () => this.errorMessage.set('No se pudo eliminar el jugador.'),
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }
}
