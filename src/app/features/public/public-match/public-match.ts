import { Component, ChangeDetectionStrategy, inject, signal, input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PublicApiService } from '../public-api.service';
import type { MatchDetail, Match, MatchPeriod } from '../../../core/models/match.model';

/**
 * Public match detail — shows scoreboard, periods, and basic info.
 * No login required. If match is in_progress, redirects to live view.
 */
@Component({
  selector: 'app-public-match',
  templateUrl: './public-match.html',
  styleUrl: './public-match.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicMatch implements OnInit {
  private readonly api = inject(PublicApiService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();

  readonly match = signal<Match | null>(null);
  readonly periods = signal<MatchPeriod[]>([]);
  readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.api.get<MatchDetail>(`/matches/${this.id()}`).subscribe({
      next: (data) => {
        if (data) {
          this.match.set(data.match);
          this.periods.set(data.periods);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  get totalHome(): number {
    return this.periods().reduce((sum, p) => sum + p.homeScore, 0);
  }

  get totalAway(): number {
    return this.periods().reduce((sum, p) => sum + p.awayScore, 0);
  }

  goBack(): void {
    this.router.navigate(['/p']);
  }
}
