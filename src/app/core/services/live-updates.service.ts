import { Injectable, signal, OnDestroy } from '@angular/core';

/**
 * Live Updates Service — provides periodic auto-refresh for tournament data.
 *
 * Components subscribe to refresh signals and reload their data when triggered.
 * Default interval: 30 seconds (configurable).
 *
 * Usage in a component:
 *   constructor() {
 *     effect(() => {
 *       this.liveUpdates.tick(); // reactive dependency
 *       this.loadData();        // re-executes on each tick
 *     });
 *   }
 */
@Injectable({ providedIn: 'root' })
export class LiveUpdatesService implements OnDestroy {
  /** Increments every refresh interval — use in effects to trigger reloads. */
  readonly tick = signal<number>(0);

  /** Whether auto-refresh is active. */
  readonly isActive = signal<boolean>(false);

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private intervalMs = 30000; // 30 seconds default

  /**
   * Starts periodic refresh.
   * @param intervalMs - refresh interval in milliseconds (default 30s)
   */
  start(intervalMs = 30000): void {
    if (this.intervalId) return; // already running
    this.intervalMs = intervalMs;
    this.isActive.set(true);
    this.intervalId = setInterval(() => {
      this.tick.update((t) => t + 1);
    }, this.intervalMs);
  }

  /** Stops periodic refresh. */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isActive.set(false);
  }

  /** Forces an immediate refresh (triggers all subscribers). */
  refresh(): void {
    this.tick.update((t) => t + 1);
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
