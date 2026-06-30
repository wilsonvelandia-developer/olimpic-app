import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import type { PlayerOption } from '../scorer-select/scorer-select';

export interface SubstitutionSelection {
  teamId: string;
  playerOutId: string;
  playerInId: string;
  playerOutName: string;
  playerInName: string;
  minute: number | null;
}

/**
 * Substitution dialog — allows the referee to register a player change.
 * Step 1: Select player going OUT (from starters/on-court).
 * Step 2: Select player coming IN (from bench/substitutes).
 * Touch-optimized for tablet use.
 */
@Component({
  selector: 'app-substitution-dialog',
  templateUrl: './substitution-dialog.html',
  styleUrl: './substitution-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubstitutionDialog {
  /** Players currently on court (candidates to go OUT). */
  readonly playersOnCourt = input.required<PlayerOption[]>();

  /** Players on bench (candidates to come IN). */
  readonly playersOnBench = input.required<PlayerOption[]>();

  /** Team name for display. */
  readonly teamName = input.required<string>();
  readonly teamId = input.required<string>();

  /** Current match minute (from timer). */
  readonly currentMinute = input<number | null>(null);

  /** Max subs allowed info for display. */
  readonly subsUsed = input<number>(0);
  readonly subsMax = input<number | null>(null);

  /** Visibility toggle. */
  readonly visible = input<boolean>(false);

  /** Emits when substitution is confirmed. */
  readonly confirmed = output<SubstitutionSelection>();
  readonly closed = output<void>();

  // ── Internal state ────────────────────────────────────────────────────────
  readonly step = signal<1 | 2>(1);
  readonly selectedOut = signal<PlayerOption | null>(null);

  readonly canConfirm = computed(() => {
    return this.step() === 2 && this.selectedOut() !== null;
  });

  readonly subsLimitReached = computed(() => {
    const max = this.subsMax();
    if (max === null) return false;
    return this.subsUsed() >= max;
  });

  selectPlayerOut(player: PlayerOption): void {
    this.selectedOut.set(player);
    this.step.set(2);
  }

  selectPlayerIn(player: PlayerOption): void {
    const out = this.selectedOut();
    if (!out) return;

    this.confirmed.emit({
      teamId: this.teamId(),
      playerOutId: out.id,
      playerInId: player.id,
      playerOutName: out.name,
      playerInName: player.name,
      minute: this.currentMinute(),
    });
    this.reset();
  }

  goBackToStep1(): void {
    this.step.set(1);
    this.selectedOut.set(null);
  }

  close(): void {
    this.reset();
    this.closed.emit();
  }

  private reset(): void {
    this.step.set(1);
    this.selectedOut.set(null);
  }
}
