import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { SportService } from '../sport.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import type { Sport } from '../../../core/models';

@Component({
  selector: 'app-sport-list',
  imports: [LoadingSpinner, ConfirmDialog],
  templateUrl: './sport-list.html',
  styleUrl: './sport-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SportList implements OnInit {
  private readonly sportService = inject(SportService);
  private readonly router = inject(Router);

  readonly sports = signal<Sport[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly showDeleteDialog = signal<boolean>(false);
  readonly selectedSportId = signal<number | null>(null);
  readonly selectedSportName = signal<string>('');

  ngOnInit(): void {
    this.loadSports();
  }

  loadSports(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.sportService.getAll().subscribe({
      next: (data) => {
        this.sports.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudieron cargar los deportes. Intenta nuevamente.');
        this.isLoading.set(false);
      },
    });
  }

  onCreateSport(): void {
    this.router.navigate(['/sports', 'new']);
  }

  onEditSport(id: number): void {
    this.router.navigate(['/sports', id, 'edit']);
  }

  onViewDetail(id: number): void {
    this.router.navigate(['/sports', id]);
  }

  onDeleteConfirm(sport: Sport): void {
    this.selectedSportId.set(sport.id);
    this.selectedSportName.set(sport.name);
    this.showDeleteDialog.set(true);
  }

  onDeleteCancelled(): void {
    this.showDeleteDialog.set(false);
    this.selectedSportId.set(null);
  }

  onDeleteConfirmed(): void {
    const id = this.selectedSportId();
    if (id === null) return;
    this.showDeleteDialog.set(false);
    this.sportService.delete(id).subscribe({
      next: () => this.loadSports(),
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
