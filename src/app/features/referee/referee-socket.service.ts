import { inject, Injectable, signal, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { OfflineQueueService, type PendingEvent } from './offline-queue.service';

/** Events emitted by the referee (client → server). */
export interface RefereeScoreEvent {
  matchId: string;
  periodNumber: number;
  homeScore: number;
  awayScore: number;
  scorerPlayerId?: string;
  scorerTeamId?: string;
  points?: number;
  matchMinute?: number;
}

export interface RefereeSubstitutionEvent {
  matchId: string;
  teamId: string;
  periodNumber: number;
  playerOutId: string;
  playerInId: string;
  minute: number | null;
}

export interface RefereeSanctionEvent {
  matchId: string;
  sanctionTypeId: string;
  teamId: string;
  playerId: string | null;
  periodNumber: number;
  minute: number | null;
  notes?: string;
}

export interface RefereeTimerSyncEvent {
  matchId: string;
  elapsed: number;
  running: boolean;
}

/** Events received from the server (server → client broadcast). */
export interface MatchScoreUpdate {
  matchId: string;
  homeScore: number;
  awayScore: number;
  periodNumber?: number;
}

export interface MatchSubstitutionUpdate {
  matchId: string;
  teamId: string;
  playerOutId: string;
  playerInId: string;
}

export interface MatchSanctionUpdate {
  matchId: string;
  teamId: string;
  playerId: string | null;
  sanctionName: string;
}

export interface MatchTimerSync {
  matchId: string;
  elapsed: number;
  running: boolean;
}

/**
 * WebSocket service for real-time match communication.
 * Handles connection, authentication (via httpOnly cookies), reconnection,
 * and event emission/subscription.
 */
@Injectable({ providedIn: 'root' })
export class RefereeSocketService implements OnDestroy {
  private readonly offlineQueue = inject(OfflineQueueService);
  private socket: Socket | null = null;

  readonly isConnected = signal<boolean>(false);
  readonly connectionError = signal<string | null>(null);

  /** Number of events waiting in offline queue. */
  readonly pendingOfflineCount = this.offlineQueue.pendingCount;

  /** Callbacks registered by components to handle incoming events. */
  private listeners = new Map<string, Array<(data: unknown) => void>>();

  /**
   * Connect to the WebSocket server.
   * Uses withCredentials to send the httpOnly auth_token cookie.
   * On reconnection, automatically flushes any queued offline events.
   */
  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(environment.apiBaseUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    this.socket.on('connect', () => {
      this.isConnected.set(true);
      this.connectionError.set(null);
      // Flush offline queue on reconnect
      this.flushOfflineQueue();
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected.set(false);
      if (reason === 'io server disconnect') {
        this.connectionError.set('Desconectado por el servidor');
      }
    });

    this.socket.on('connect_error', (err) => {
      this.isConnected.set(false);
      this.connectionError.set(err.message);
    });

    this.socket.on('match:error', (data: { message: string }) => {
      this.connectionError.set(data.message);
    });

    // Forward all match:* and standings:* events to registered listeners
    const matchEvents = [
      'match:score_update', 'match:substitution', 'match:sanction',
      'match:period_change', 'match:finished', 'match:timer_sync',
      'match:scorer_registered', 'standings:updated',
    ];
    for (const event of matchEvents) {
      this.socket.on(event, (data: unknown) => {
        const handlers = this.listeners.get(event);
        if (handlers) {
          handlers.forEach((fn) => fn(data));
        }
      });
    }
  }

  /**
   * Disconnect from the WebSocket server.
   */
  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.isConnected.set(false);
  }

  // ── Referee actions (emit to server) ──────────────────────────────────────

  /** Join a match room as referee (takes control). */
  joinAsReferee(matchId: string): Promise<{ success: boolean; message?: string }> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ success: false, message: 'Not connected' });
        return;
      }
      this.socket.emit('referee:join', { matchId }, (res: { success: boolean; message?: string }) => {
        resolve(res);
      });
    });
  }

  /** Leave referee control of a match. */
  leaveAsReferee(matchId: string): void {
    this.socket?.emit('referee:leave', { matchId });
  }

  /** Join a match room as spectator. */
  joinAsSpectator(matchId: string): void {
    this.socket?.emit('spectator:join', { matchId });
  }

  /** Leave spectator room. */
  leaveAsSpectator(matchId: string): void {
    this.socket?.emit('spectator:leave', { matchId });
  }

  /** Emit score update. */
  emitScore(event: RefereeScoreEvent): void {
    this.socket?.emit('referee:score', event);
  }

  /** Emit substitution. */
  emitSubstitution(event: RefereeSubstitutionEvent): void {
    this.socket?.emit('referee:substitution', event);
  }

  /** Emit sanction. */
  emitSanction(event: RefereeSanctionEvent): void {
    this.socket?.emit('referee:sanction', event);
  }

  /** Emit timer sync to spectators. */
  emitTimerSync(event: RefereeTimerSyncEvent): void {
    this.socket?.emit('referee:timer_sync', event);
  }

  /** Emit match end. */
  emitMatchEnd(matchId: string): void {
    this.socket?.emit('referee:match_end', { matchId });
  }

  // ── Event subscription ────────────────────────────────────────────────────

  /**
   * Subscribe to a specific match event.
   * Returns an unsubscribe function.
   */
  on<T = unknown>(event: string, handler: (data: T) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler as (data: unknown) => void);

    return () => {
      const handlers = this.listeners.get(event);
      if (handlers) {
        const idx = handlers.indexOf(handler as (data: unknown) => void);
        if (idx >= 0) handlers.splice(idx, 1);
      }
    };
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.listeners.clear();
  }

  // ── Offline queue integration ─────────────────────────────────────────────

  /**
   * Emit an event or queue it for later if offline.
   * Used by the referee panel to ensure no events are lost.
   */
  emitOrQueue(eventName: string, data: Record<string, unknown>, matchId: string): void {
    if (this.socket?.connected) {
      this.socket.emit(eventName, data);
    } else {
      this.offlineQueue.enqueue({
        matchId,
        eventType: eventName,
        payload: data,
      });
    }
  }

  /**
   * Flush all pending offline events through the WebSocket.
   */
  private async flushOfflineQueue(): Promise<void> {
    if (!this.socket?.connected) return;

    await this.offlineQueue.flush(async (event: PendingEvent) => {
      if (!this.socket?.connected) return false;

      return new Promise((resolve) => {
        this.socket!.emit(event.eventType, event.payload, (ack: { success?: boolean }) => {
          resolve(ack?.success !== false);
        });
        // If no ack after 5s, consider it sent (fire-and-forget fallback)
        setTimeout(() => resolve(true), 5000);
      });
    });
  }
}
