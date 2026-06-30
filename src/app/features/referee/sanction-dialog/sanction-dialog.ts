import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import type { PlayerOption } from '../scorer-select/scorer-select';

export interface SanctionType {
  id: string;
  name: string;
  code: string;
  color: string | null;
  icon: string | null;
}

export interface SanctionSelection {
  sanctionTypeId: string;
  teamId: string;
  playerId: string | null;
  playerName: string | null;
  sanctionName: string;
  minute: number | null;
}

/**
 * Sanction dialog — register a card/foul during a match.
 * Step 1: Select sanction type (from tournament catalog).
 * Step 2: Select player (or apply to team).
 */
@Component({
  selector: 'app-sanction-dialog',
  templateUrl: './sanction-dialog.html',
  styleUrl: './sanction-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SanctionDialog {
  /** Available sanction types for this tournament. */
  readonly sanctionTypes = input.required<SanctionType[]>();

  /** Players on court for the sanctioned team. */
  readonly players = input.required<PlayerOption[]>();

  /** Team info. */
  readonly teamName = input.required<string>();
  readonly teamId = input.required<string>();

  /** Current match minute. */
  readonly currentMinute = input<number | null>(null);

  /** Visibility toggle. */
  readonly visible = input<boolean>(false);

  /** Emits when sanction is confirmed. */
  readonly confirmed = output<SanctionSelection>();
  readonly closed = output<void>();

  // ── Internal state ────────────────────────────────────────────────────────
  readonly step = signal<1 | 2>(1);
  readonly selectedType = signal<SanctionType | null>(null);

  selectSanctionType(type: SanctionType): void {
    this.selectedType.set(type);
    this.step.set(2);
  }

  selectPlayer(player: PlayerOption): void {
    const type = this.selectedType();
    if (!type) return;

    this.confirmed.emit({
      sanctionTypeId: type.id,
      teamId: this.teamId(),
      playerId: player.id,
      playerName: player.name,
      sanctionName: type.name,
      minute: this.currentMinute(),
    });
    this.reset();
  }

  applyToTeam(): void {
    const type = this.selectedType();
    if (!type) return;

    this.confirmed.emit({
      sanctionTypeId: type.id,
      teamId: this.teamId(),
      playerId: null,
      playerName: null,
      sanctionName: type.name,
      minute: this.currentMinute(),
    });
    this.reset();
  }

  goBackToStep1(): void {
    this.step.set(1);
    this.selectedType.set(null);
  }

  close(): void {
    this.reset();
    this.closed.emit();
  }

  private reset(): void {
    this.step.set(1);
    this.selectedType.set(null);
  }
}
