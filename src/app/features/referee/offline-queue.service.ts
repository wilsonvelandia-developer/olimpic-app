import { Injectable, signal } from '@angular/core';

/**
 * Pending event stored in IndexedDB when offline.
 */
export interface PendingEvent {
  id: string;
  matchId: string;
  eventType: string;
  payload: Record<string, unknown>;
  timestamp: number;
  retries: number;
}

const DB_NAME = 'olimpicapp-referee';
const DB_VERSION = 1;
const STORE_NAME = 'pending-events';

/**
 * Offline queue service — stores referee events in IndexedDB when the
 * WebSocket connection is lost. Automatically replays them when reconnected.
 *
 * Flow:
 * 1. Referee action → check if online → if yes, emit directly; if no, queue
 * 2. On reconnect → flush queue (replay all pending events in order)
 * 3. On successful replay → remove from IndexedDB
 */
@Injectable({ providedIn: 'root' })
export class OfflineQueueService {
  private db: IDBDatabase | null = null;

  /** Number of pending events waiting to be sent. */
  readonly pendingCount = signal<number>(0);

  /** Whether the queue is currently flushing (replaying events). */
  readonly isFlushing = signal<boolean>(false);

  constructor() {
    this.openDatabase();
  }

  // ── Database ──────────────────────────────────────────────────────────────

  private openDatabase(): void {
    if (typeof indexedDB === 'undefined') return;

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('matchId', 'matchId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      this.db = (event.target as IDBOpenDBRequest).result;
      this.updatePendingCount();
    };

    request.onerror = () => {
      console.error('Failed to open IndexedDB for offline queue');
    };
  }

  // ── Queue operations ──────────────────────────────────────────────────────

  /** Add an event to the offline queue. */
  async enqueue(event: Omit<PendingEvent, 'id' | 'timestamp' | 'retries'>): Promise<void> {
    if (!this.db) return;

    const pendingEvent: PendingEvent = {
      id: crypto.randomUUID(),
      matchId: event.matchId,
      eventType: event.eventType,
      payload: event.payload,
      timestamp: Date.now(),
      retries: 0,
    };

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.add(pendingEvent);
      request.onsuccess = () => {
        this.updatePendingCount();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /** Get all pending events for a match, ordered by timestamp. */
  async getPending(matchId?: string): Promise<PendingEvent[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);

      let request: IDBRequest;
      if (matchId) {
        const index = store.index('matchId');
        request = index.getAll(matchId);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        const events = (request.result as PendingEvent[])
          .sort((a, b) => a.timestamp - b.timestamp);
        resolve(events);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /** Remove a successfully replayed event from the queue. */
  async dequeue(eventId: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(eventId);
      request.onsuccess = () => {
        this.updatePendingCount();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /** Clear all pending events (e.g. after successful full flush). */
  async clearAll(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => {
        this.pendingCount.set(0);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Flush the queue — replay all pending events using the provided sender function.
   * Events that fail will remain in the queue with incremented retry count.
   */
  async flush(sender: (event: PendingEvent) => Promise<boolean>): Promise<number> {
    if (this.isFlushing()) return 0;
    this.isFlushing.set(true);

    const pending = await this.getPending();
    let flushed = 0;

    for (const event of pending) {
      try {
        const success = await sender(event);
        if (success) {
          await this.dequeue(event.id);
          flushed++;
        } else {
          await this.incrementRetry(event.id);
        }
      } catch {
        await this.incrementRetry(event.id);
      }
    }

    this.isFlushing.set(false);
    return flushed;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async incrementRetry(eventId: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(eventId);
      getReq.onsuccess = () => {
        const event = getReq.result as PendingEvent;
        if (event) {
          event.retries++;
          store.put(event);
        }
        resolve();
      };
      getReq.onerror = () => resolve();
    });
  }

  private updatePendingCount(): void {
    if (!this.db) return;

    const tx = this.db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.count();
    request.onsuccess = () => {
      this.pendingCount.set(request.result);
    };
  }
}
