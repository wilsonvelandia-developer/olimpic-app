import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SportService } from '../sport.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import type { Sport } from '../../../core/models';

@Component({
  selector: 'app-sport-detail',
  imports: [RouterLink, LoadingSpinner, ConfirmDialog],
  templateUrl: './sport-detail.html',
  styleUrl: './sport-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SportDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sportService = inject(SportService);

  readonly sport = signal<Sport | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showDeleteDialog = signal<boolean>(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadSport(Number(id));
  }

  private loadSport(id: number): void {
    this.isLoading.set(true);
    this.sportService.getById(id).subscribe({
      next: (data) => { this.sport.set(data); this.isLoading.set(false); },
      error: () => { this.errorMessage.set('No se pudo cargar el deporte.'); this.isLoading.set(false); },
    });
  }

  onEdit(): void {
    const id = this.sport()?.id;
    if (id) this.router.navigate(['/sports', id, 'edit']);
  }

  onDeleteConfirm(): void { this.showDeleteDialog.set(true); }
  onDeleteCancelled(): void { this.showDeleteDialog.set(false); }

  onDeleteConfirmed(): void {
    const id = this.sport()?.id;
    if (!id) return;
    this.showDeleteDialog.set(false);
    this.sportService.delete(id).subscribe({
      next: () => this.router.navigate(['/sports']),
      error: () => this.errorMessage.set('No se pudo eliminar el deporte. Puede tener torneos asociados.'),
    });
  }

  getScoringLabel(unit: string): string {
    const labels: Record<string, string> = {
      points: 'Puntos', sets: 'Sets', goals: 'Goles', games: 'Games',
    };
    return labels[unit] ?? unit;
  }
}
