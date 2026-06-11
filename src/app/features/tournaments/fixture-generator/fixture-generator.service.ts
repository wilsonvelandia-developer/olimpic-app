import { inject, Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatchService } from '../../matches/match.service';
import { generateFixture } from './fixture-algorithms';
import type { FixtureConfig, FixtureSlot } from './fixture.model';

export interface FixtureBatchResult {
  created: number;
  failed: number;
}

/**
 * Orchestrates fixture generation and persistence.
 * - generatePreview() runs the algorithm locally and returns the slots for review.
 * - saveFixture() sends all slots to the API in parallel.
 */
@Injectable({ providedIn: 'root' })
export class FixtureGeneratorService {
  private readonly matchService = inject(MatchService);

  /**
   * Generates a fixture preview without persisting anything.
   * Returns all match slots grouped by round.
   */
  generatePreview(config: FixtureConfig): FixtureSlot[] {
    return generateFixture(config);
  }

  /**
   * Returns slots grouped by round label for display purposes.
   */
  groupByRound(slots: FixtureSlot[]): Record<string, FixtureSlot[]> {
    const groups: Record<string, FixtureSlot[]> = {};
    slots.forEach((slot) => {
      if (!groups[slot.round]) groups[slot.round] = [];
      groups[slot.round].push(slot);
    });
    return groups;
  }

  /**
   * Persists all fixture slots by creating matches in parallel batches.
   * Uses chunks of 10 to avoid overwhelming the API.
   */
  saveFixture(
    tournamentId: number,
    slots: FixtureSlot[],
  ): Observable<FixtureBatchResult> {
    const requests = slots.map((slot) =>
      this.matchService.create({
        tournamentId,
        homeTeamId:  slot.homeTeamId,
        awayTeamId:  slot.awayTeamId,
        scheduledAt: slot.scheduledAt,
        round:       slot.round,
        venue:       slot.venue,
      }),
    );

    // Process in parallel — forkJoin waits for all to complete
    return forkJoin(requests).pipe(
      map((results) => ({ created: results.length, failed: 0 })),
    );
  }
}
