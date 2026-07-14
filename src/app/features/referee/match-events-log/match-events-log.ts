import { Component, ChangeDetectionStrategy, input } from '@angular/core';

export interface MatchEventItem {
  id: string;
  eventType: string;
  teamName?: string;
  playerName?: string;
  playerJersey?: number;
  periodNumber: number;
  matchMinute: number | null;
  createdAt: string;
  payload: Record<string, unknown>;
  partialScore?: { home: number; away: number; homeSets: number; awaySets: number } | null;
}

/** Maps event types to display icons. */
const EVENT_ICONS: Record<string, string> = {
  score: '⚽',
  substitution: '🔀',
  sanction: '🟨',
  rotation: '🔄',
  period_start: '▶',
  period_end: '⏹',
  timeout: '⏸',
  match_start: '🏁',
  match_end: '🏆',
};

/**
 * Match events timeline — shows chronological log of all match events.
 * Displayed as a vertical list with icons, timestamps, and descriptions.
 */
@Component({
  selector: 'app-match-events-log',
  templateUrl: './match-events-log.html',
  styleUrl: './match-events-log.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchEventsLog {
  readonly events = input.required<MatchEventItem[]>();
  readonly visible = input<boolean>(true);

  /** Get icon for event type. */
  getIcon(eventType: string): string {
    return EVENT_ICONS[eventType] ?? '📌';
  }

  /** Get human-readable label for event type. */
  getLabel(event: MatchEventItem): string {
    const playerTag = event.playerName
      ? (event.playerJersey ? `#${event.playerJersey} ${event.playerName}` : event.playerName)
      : '';

    switch (event.eventType) {
      case 'score':
        return playerTag
          ? `Punto — ${playerTag} (${event.teamName})`
          : `Punto — ${event.teamName}`;
      case 'substitution': {
        const playerIn = event.payload?.['playerInName'] as string | undefined;
        const playerOut = event.payload?.['playerOutName'] as string | undefined;
        const jerseyIn = event.payload?.['playerInJersey'] as number | undefined;
        const jerseyOut = event.payload?.['playerOutJersey'] as number | undefined;
        if (playerIn && playerOut) {
          const inTag = jerseyIn ? `#${jerseyIn} ${playerIn}` : playerIn;
          const outTag = jerseyOut ? `#${jerseyOut} ${playerOut}` : playerOut;
          return `Cambio — ↑${inTag} ↓${outTag} (${event.teamName})`;
        }
        return `Cambio — ${event.teamName}`;
      }
      case 'sanction':
        return playerTag
          ? `Sanción — ${playerTag} (${event.teamName})`
          : `Sanción — ${event.teamName}`;
      case 'rotation':
        return `Rotación — ${event.teamName}`;
      case 'period_start':
        return `Inicio período ${event.periodNumber}`;
      case 'period_end':
      case 'set_end':
        return `Fin período ${event.periodNumber}`;
      case 'timeout':
        return 'Tiempo fuera';
      case 'match_start':
        return 'Inicio del partido';
      case 'match_end':
        return 'Fin del partido';
      default:
        return event.eventType;
    }
  }

  /** Format partial score display. */
  getPartialScore(event: MatchEventItem): string {
    if (!event.partialScore) return '';
    const { home, away, homeSets, awaySets } = event.partialScore;
    if (homeSets > 0 || awaySets > 0) {
      return `(${homeSets}-${awaySets}) ${home}-${away}`;
    }
    return `${home}-${away}`;
  }

  /** Format time for display. */
  formatTime(event: MatchEventItem): string {
    if (event.matchMinute !== null) {
      return `${event.matchMinute}'`;
    }
    const date = new Date(event.createdAt);
    return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }
}
