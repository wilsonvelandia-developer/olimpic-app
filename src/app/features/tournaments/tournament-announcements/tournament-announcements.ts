import { Component, ChangeDetectionStrategy, inject, signal, input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, SlicePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { AuthService } from '../../../core/services/auth.service';
import type { Announcement } from '../../../core/models';

/**
 * Displays announcements scoped to the current tournament.
 * Embedded as a tab inside tournament-detail.
 */
@Component({
  selector: 'app-tournament-announcements',
  imports: [DatePipe, SlicePipe, LoadingSpinner],
  templateUrl: './tournament-announcements.html',
  styleUrl: './tournament-announcements.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentAnnouncements implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly tournamentId = input.required<string>();

  readonly announcements = signal<Announcement[]>([]);
  readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadAnnouncements();
  }

  loadAnnouncements(): void {
    this.isLoading.set(true);
    this.api.get<Announcement[]>(`/announcements?tournamentId=${this.tournamentId()}`).subscribe({
      next: (res) => { this.announcements.set(res.data ?? []); this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });
  }

  onCreateAnnouncement(): void {
    this.router.navigate(['/announcements', 'new'], { queryParams: { tournamentId: this.tournamentId() } });
  }

  onViewAnnouncement(id: string): void {
    this.router.navigate(['/announcements', id]);
  }
}
