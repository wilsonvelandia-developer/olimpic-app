import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { VenueService } from '../venue.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { AuthService } from '../../../core/services/auth.service';
import type { Venue } from '../../../core/models';

@Component({
  selector: 'app-venue-detail',
  imports: [RouterLink, LoadingSpinner, ConfirmDialog],
  templateUrl: './venue-detail.html',
  styleUrl: './venue-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VenueDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly venueService = inject(VenueService);
  readonly auth = inject(AuthService);

  readonly venue = signal<Venue | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showDeleteDialog = signal<boolean>(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadVenue(id);
  }

  private loadVenue(id: string): void {
    this.isLoading.set(true);
    this.venueService.getById(id).subscribe({
      next: (d) => { this.venue.set(d); this.isLoading.set(false); },
      error: () => { this.errorMessage.set('No se pudo cargar la sede.'); this.isLoading.set(false); },
    });
  }

  onEdit(): void {
    const id = this.venue()?.id;
    if (id) this.router.navigate(['/venues', id, 'edit']);
  }

  onDeleteConfirm(): void { this.showDeleteDialog.set(true); }
  onDeleteCancelled(): void { this.showDeleteDialog.set(false); }

  onDeleteConfirmed(): void {
    const id = this.venue()?.id;
    if (!id) return;
    this.showDeleteDialog.set(false);
    this.venueService.delete(id).subscribe({
      next: () => this.router.navigate(['/venues']),
      error: () => this.errorMessage.set('No se pudo eliminar la sede.'),
    });
  }
}
