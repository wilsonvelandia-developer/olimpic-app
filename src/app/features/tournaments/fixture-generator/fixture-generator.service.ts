import { inject, Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { generateFixture } from './fixture-algorithms';
import type { FixtureConfig, FixtureSlot } from './fixture.model';

export interface FixtureBatchResult {
  created: number;
  failed:  number;
}

/**
 * Orchestrates fixture generation (local algorithm) and persistence (API).
 * Uses the matches service endpoint POST /matches to create each slot.
 */
@Injectable({ providedIn: 'root' })
export class FixtureGeneratorService {
  private readonly api = inject(ApiService);

  generatePreview(config: FixtureConfig): FixtureSlot[] {
    return generateFixture(config);
  }

  groupByRound(slots: FixtureSlot[]): Record<string, FixtureSlot[]> {
    const groups: Record<string, FixtureSlot[]> = {};
    slots.forEach((slot) => {
      if (!groups[slot.round]) groups[slot.round] = [];
      groups[slot.round].push(slot);
    });
    return groups;
  }

  /**
   * Persists all slots via POST /matches.
   * Backend MatchCreateRequest: { phaseId, homeTeamId, awayTeamId, scheduledAt }
   * The fixture generator needs a phaseId instead of tournamentId.
   */
  saveFixture(phaseId: string, slots: FixtureSlot[]): Observable<FixtureBatchResult> {
    if (slots.length === 0) return of({ created: 0, failed: 0 });

    const requests = slots.map((slot) =>
      this.api.post<unknown>('/matches', {
        phaseId,
        homeTeamId:  slot.homeTeamId,
        awayTeamId:  slot.awayTeamId,
        scheduledAt: slot.scheduledAt,
      }).pipe(catchError(() => of(null))),
    );

    return forkJoin(requests).pipe(
      map((results) => ({
        created: results.filter((r) => r !== null).length,
        failed:  results.filter((r) => r === null).length,
      })),
    );
  }
}
