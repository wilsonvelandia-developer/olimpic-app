import { Component, ChangeDetectionStrategy, inject, signal, input, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { AuthService } from '../../../core/services/auth.service';

interface Sanction {
  id: string;
  playerId: string;
  playerName: string;
  teamName: string;
  matchId: string;
  type: 'yellow_card' | 'red_card' | 'suspension';
  reason: string | null;
  matchDate: string | null;
  accumulatedYellows: number;
  isSuspended: boolean;
}

/**
 * Tournament sanctions — shows yellow/red cards, accumulated sanctions,
 * and suspended players for the current tournament.
 */
@Component({
  selector: 'app-tournament-sanctions',
  imports: [DatePipe, LoadingSpinner],
  templateUrl: './tournament-sanctions.html',
  styleUrl: './tournament-sanctions.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentSanctions implements OnInit {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);

  readonly tournamentId = input.required<string>();

  readonly sanctions = signal<Sanction[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly filter = signal<string>('all');

  ngOnInit(): void {
    this.loadSanctions();
  }

  loadSanctions(): void {
    this.isLoading.set(true);
    this.api.get<Sanction[]>(`/matches/sanctions?tournamentId=${this.tournamentId()}`).subscribe({
      next: (res) => { this.sanctions.set(res.data ?? []); this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });
  }

  onFilterChange(value: string): void {
    this.filter.set(value);
  }

  get filteredSanctions(): Sanction[] {
    const f = this.filter();
    if (f === 'all') return this.sanctions();
    if (f === 'suspended') return this.sanctions().filter((s) => s.isSuspended);
    if (f === 'yellow') return this.sanctions().filter((s) => s.type === 'yellow_card');
    if (f === 'red') return this.sanctions().filter((s) => s.type === 'red_card');
    return this.sanctions();
  }

  get suspendedCount(): number {
    return this.sanctions().filter((s) => s.isSuspended).length;
  }

  get totalYellows(): number {
    return this.sanctions().filter((s) => s.type === 'yellow_card').length;
  }

  get totalReds(): number {
    return this.sanctions().filter((s) => s.type === 'red_card').length;
  }
}
