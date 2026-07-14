import { Component, ChangeDetectionStrategy, inject, signal, input, OnInit, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { AuthService } from '../../../core/services/auth.service';
import type { Venue } from '../../../core/models';

/**
 * Displays venues associated with the current tournament.
 * Supports many-to-many linking/unlinking.
 * Embedded as a tab inside tournament-detail.
 */
@Component({
  selector: 'app-tournament-venues',
  imports: [LoadingSpinner],
  templateUrl: './tournament-venues.html',
  styleUrl: './tournament-venues.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentVenues implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly tournamentId = input.required<string>();

  readonly venues = signal<Venue[]>([]);
  readonly allVenues = signal<Venue[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly showLinkDialog = signal<boolean>(false);

  /** Venues not yet linked to this tournament. */
  readonly availableVenues = computed(() => {
    const linked = new Set(this.venues().map((v) => v.id));
    return this.allVenues().filter((v) => !linked.has(v.id));
  });

  ngOnInit(): void {
    this.loadVenues();
    this.loadAllVenues();
  }

  loadVenues(): void {
    this.isLoading.set(true);
    this.api.get<Venue[]>(`/venues/by-tournament/${this.tournamentId()}`).subscribe({
      next: (res) => { this.venues.set(res.data ?? []); this.isLoading.set(false); },
      error: () => {
        // Fallback to legacy query param approach
        this.api.get<Venue[]>(`/venues?tournamentId=${this.tournamentId()}`).subscribe({
          next: (res) => { this.venues.set(res.data ?? []); this.isLoading.set(false); },
          error: () => this.isLoading.set(false),
        });
      },
    });
  }

  /** Load all venues (for the link dialog). */
  loadAllVenues(): void {
    this.api.get<Venue[]>('/venues').subscribe({
      next: (res) => { this.allVenues.set(res.data ?? []); },
    });
  }

  onViewVenue(id: string): void {
    this.router.navigate(['/venues', id]);
  }

  onManageVenues(): void {
    this.router.navigate(['/venues']);
  }

  onLinkVenue(venueId: string): void {
    this.api.post('/venues/link', { tournamentId: this.tournamentId(), venueId }).subscribe({
      next: () => {
        this.showLinkDialog.set(false);
        this.loadVenues();
      },
    });
  }

  onUnlinkVenue(event: Event, venueId: string): void {
    event.stopPropagation();
    this.api.post('/venues/unlink', { tournamentId: this.tournamentId(), venueId }).subscribe({
      next: () => this.loadVenues(),
    });
  }
}
