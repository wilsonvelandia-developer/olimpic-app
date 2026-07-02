import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VenueService } from '../venue.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { ViewToggle, type ViewMode } from '../../../shared/components/view-toggle/view-toggle';
import { AuthService } from '../../../core/services/auth.service';
import type { Venue } from '../../../core/models';
import type { VenueFilters } from '../venue.service';

@Component({
  selector: 'app-venue-list',
  imports: [FormsModule, LoadingSpinner, ConfirmDialog, ViewToggle],
  templateUrl: './venue-list.html',
  styleUrl: './venue-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VenueList implements OnInit {
  private readonly venueService = inject(VenueService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly venues = signal<Venue[]>([]);
  readonly totalCount = signal<number>(0);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly showDeleteDialog = signal<boolean>(false);
  readonly selectedVenueId = signal<string | null>(null);
  readonly selectedVenueName = signal<string>('');

  readonly currentPage = signal<number>(1);
  readonly pageSize = 10;
  readonly viewMode = signal<ViewMode>('card');

  searchModel = '';

  ngOnInit(): void {
    this.loadVenues();
  }

  loadVenues(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const filters: VenueFilters = { page: this.currentPage(), pageSize: this.pageSize };
    if (this.searchModel.trim()) filters.search = this.searchModel.trim();

    this.venueService.getAll(filters).subscribe({
      next: (r) => { this.venues.set(r.data); this.totalCount.set(r.total); this.isLoading.set(false); },
      error: () => { this.errorMessage.set('No se pudieron cargar las sedes.'); this.isLoading.set(false); },
    });
  }

  onApplyFilters(): void { this.currentPage.set(1); this.loadVenues(); }
  onClearFilters(): void { this.searchModel = ''; this.currentPage.set(1); this.loadVenues(); }
  onCreateVenue(): void { this.router.navigate(['/venues', 'new']); }
  onEditVenue(id: string): void { this.router.navigate(['/venues', id, 'edit']); }
  onViewDetail(id: string): void { this.router.navigate(['/venues', id]); }

  onDeleteConfirm(venue: Venue): void {
    this.selectedVenueId.set(venue.id);
    this.selectedVenueName.set(venue.name);
    this.showDeleteDialog.set(true);
  }

  onDeleteCancelled(): void { this.showDeleteDialog.set(false); this.selectedVenueId.set(null); }

  onDeleteConfirmed(): void {
    const id = this.selectedVenueId();
    if (!id) return;
    this.showDeleteDialog.set(false);
    this.venueService.delete(id).subscribe({
      next: () => this.loadVenues(),
      error: () => this.errorMessage.set('No se pudo eliminar la sede.'),
    });
  }

  onPageChange(page: number): void { this.currentPage.set(page); this.loadVenues(); }

  get totalPages(): number { return Math.ceil(this.totalCount() / this.pageSize); }
  get pageRange(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
}
