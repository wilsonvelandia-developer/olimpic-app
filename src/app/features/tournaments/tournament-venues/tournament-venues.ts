import { Component, ChangeDetectionStrategy, inject, signal, input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { AuthService } from '../../../core/services/auth.service';
import type { Venue } from '../../../core/models';

/**
 * Displays venues associated with the current tournament.
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
  readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadVenues();
  }

  loadVenues(): void {
    this.isLoading.set(true);
    this.api.get<Venue[]>(`/venues?tournamentId=${this.tournamentId()}`).subscribe({
      next: (res) => { this.venues.set(res.data ?? []); this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });
  }

  onViewVenue(id: string): void {
    this.router.navigate(['/venues', id]);
  }

  onManageVenues(): void {
    this.router.navigate(['/venues']);
  }
}
