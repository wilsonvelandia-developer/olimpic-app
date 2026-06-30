import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';

export interface PlayerOption {
  id: string;
  name: string;
  jerseyNumber: number;
  position?: string;
}

export interface ScorerSelection {
  playerId: string;
  playerName: string;
  jerseyNumber: number;
}

/**
 * Scorer select dialog — shown after the referee adds a point.
 * Displays the team's active players (starters on court) for quick selection.
 * Touch-optimized with large tap targets.
 */
@Component({
  selector: 'app-scorer-select',
  templateUrl: './scorer-select.html',
  styleUrl: './scorer-select.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScorerSelect {
  /** List of players currently on court for the scoring team. */
  readonly players = input.required<PlayerOption[]>();

  /** Team name for the header. */
  readonly teamName = input.required<string>();

  /** Whether the dialog is visible. */
  readonly visible = input<boolean>(false);

  /** Emits the selected player when tapped. */
  readonly playerSelected = output<ScorerSelection>();

  /** Emits when the dialog is dismissed without selection (skip). */
  readonly skipped = output<void>();

  /** Emits when the dialog should close. */
  readonly closed = output<void>();

  readonly searchTerm = signal<string>('');

  /** Filtered players based on search. */
  get filteredPlayers(): PlayerOption[] {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.players();
    return this.players().filter(
      (p) => p.name.toLowerCase().includes(term) || String(p.jerseyNumber).includes(term),
    );
  }

  selectPlayer(player: PlayerOption): void {
    this.playerSelected.emit({
      playerId: player.id,
      playerName: player.name,
      jerseyNumber: player.jerseyNumber,
    });
  }

  skip(): void {
    this.skipped.emit();
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }
}
