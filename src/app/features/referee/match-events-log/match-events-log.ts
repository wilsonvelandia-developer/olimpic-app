import { Component, ChangeDetectionStrategy, input } from '@angular/core';

export interface MatchEventItem {
  id: string;
  eventType: string;
  teamName?: string;
  playerName?: string;
  periodNumber: number;
  matchMinute: number | null;
  createdAt: string;
  payload: Record<string, unknown>;
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
    switch (event.eventType) {
      case 'score':
        return event.playerName
          ? `Punto — ${event.playerName} (${event.teamName})`
          : `Punto — ${event.teamName}`;
      case 'substitution':
        return `Cambio — ${event.teamName}`;
      case 'sanction':
        return event.playerName
          ? `Sanción — ${event.playerName} (${event.teamName})`
          : `Sanción — ${event.teamName}`;
      case 'rotation':
        return `Rotación — ${event.teamName}`;
      case 'period_start':
        return `Inicio período ${event.periodNumber}`;
      case 'period_end':
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

  /** Format time for display. */
  formatTime(event: MatchEventItem): string {
    if (event.matchMinute !== null) {
      return `${event.matchMinute}'`;
    }
    const date = new Date(event.createdAt);
    return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }
}
