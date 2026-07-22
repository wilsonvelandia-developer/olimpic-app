import { Injectable, signal, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

/**
 * Tournament Live Service — connects to WebSocket for real-time tournament updates.
 * When a match finishes or standings change, emits a refresh signal.
 * Components can subscribe to `lastUpdate` to trigger data reload.
 */
@Injectable({ providedIn: 'root' })
export class TournamentLiveService {
  private socket: Socket | null = null;
  private currentTournamentId: string | null = null;

  /** Increments when standings/results are updated — use in effects or subscribe. */
  readonly lastUpdate = signal<number>(0);

  /** Last event info for display. */
  readonly lastEvent = signal<{ type: string; timestamp: string } | null>(null);

  /**
   * Join a tournament room to receive live updates.
   * Call when entering a tournament detail view.
   */
  joinTournament(tournamentId: string): void {
    if (this.currentTournamentId === tournamentId && this.socket?.connected) return;

    this.leaveTournament();
    this.currentTournamentId = tournamentId;

    const url = environment.apiBaseUrl || window.location.origin;
    this.socket = io(url, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    this.socket.on('connect', () => {
      this.socket?.emit('tournament:join', { tournamentId });
    });

    // Listen for standings refresh events
    this.socket.on('standings:refresh', (data: { tournamentId: string; timestamp: string }) => {
      if (data.tournamentId === this.currentTournamentId) {
        this.lastUpdate.update((v) => v + 1);
        this.lastEvent.set({ type: 'standings', timestamp: data.timestamp });
      }
    });

    // Listen for score updates (from any match in this tournament)
    this.socket.on('match:scoreUpdate', () => {
      this.lastUpdate.update((v) => v + 1);
    });
  }

  /**
   * Leave the current tournament room.
   * Call when leaving the tournament detail view.
   */
  leaveTournament(): void {
    if (this.socket && this.currentTournamentId) {
      this.socket.emit('tournament:leave', { tournamentId: this.currentTournamentId });
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentTournamentId = null;
  }

  /**
   * Notify that standings were updated (called by referee panel after match ends).
   */
  emitStandingsUpdate(tournamentId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('standings:updated', { tournamentId });
    }
  }
}
