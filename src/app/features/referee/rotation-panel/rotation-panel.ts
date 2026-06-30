import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import type { PlayerOption } from '../scorer-select/scorer-select';

export interface RotationSlot {
  zone: number;
  player: PlayerOption | null;
}

/**
 * Visual rotation panel for volleyball.
 * Displays the 6-zone court with players in their current positions.
 * Allows the referee to apply rotation (clockwise shift of all positions).
 *
 * Court layout (standard volleyball zones):
 *   Front row: Zone 4 (left) | Zone 3 (center) | Zone 2 (right)
 *   Back row:  Zone 5 (left) | Zone 6 (center) | Zone 1 (right/serve)
 */
@Component({
  selector: 'app-rotation-panel',
  templateUrl: './rotation-panel.html',
  styleUrl: './rotation-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RotationPanel {
  /** Current rotation slots (6 zones with player assignments). */
  readonly slots = input.required<RotationSlot[]>();

  /** Team name for display. */
  readonly teamName = input.required<string>();

  /** Whether rotation can be applied. */
  readonly canRotate = input<boolean>(true);

  /** Whether this panel is visible. */
  readonly visible = input<boolean>(false);

  /** Current rotation count (0-5). */
  readonly rotationCount = input<number>(0);

  /** Emits when rotation button is pressed. */
  readonly rotated = output<void>();

  /** Emits when panel should close. */
  readonly closed = output<void>();

  /** Get the player for a specific zone. */
  getPlayer(zone: number): PlayerOption | null {
    const slot = this.slots().find((s) => s.zone === zone);
    return slot?.player ?? null;
  }

  /** Get jersey display for a zone. */
  getJersey(zone: number): string {
    const player = this.getPlayer(zone);
    return player ? `#${player.jerseyNumber}` : '—';
  }

  /** Get player name for a zone. */
  getName(zone: number): string {
    const player = this.getPlayer(zone);
    return player?.name ?? '';
  }

  onRotate(): void {
    this.rotated.emit();
  }

  onClose(): void {
    this.closed.emit();
  }
}
