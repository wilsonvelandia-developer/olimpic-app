import {
  Component, ChangeDetectionStrategy, signal, input, output,
  OnDestroy, OnInit, computed,
} from '@angular/core';

export type TimerMode = 'progressive' | 'countdown';

/**
 * Match timer component.
 * Supports progressive (0:00:00 → ∞) and countdown (target → 0:00:00) modes.
 * Persists elapsed time in localStorage so it survives page reloads.
 */
@Component({
  selector: 'app-timer',
  templateUrl: './timer.html',
  styleUrl: './timer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Timer implements OnInit, OnDestroy {
  /** Timer mode: progressive counts up, countdown counts down. */
  readonly mode = input<TimerMode>('progressive');

  /** Target time in seconds for countdown mode. */
  readonly countdownTarget = input<number>(0);

  /** Whether timer controls should be disabled. */
  readonly disabled = input<boolean>(false);

  /** Match ID for persistence key. */
  readonly matchId = input<string>('');

  readonly paused = output<number>();
  readonly resumed = output<void>();
  readonly finished = output<void>();

  /** Elapsed seconds since timer started. */
  readonly elapsed = signal<number>(0);
  readonly isRunning = signal<boolean>(false);

  /** Formatted time display (HH:MM:SS). */
  readonly display = computed(() => {
    const mode = this.mode();
    const elapsed = this.elapsed();
    const target = this.countdownTarget();

    if (mode === 'countdown' && target > 0) {
      const remaining = Math.max(0, target - elapsed);
      return this.formatTime(remaining);
    }
    return this.formatTime(elapsed);
  });

  /** Progress percentage for countdown mode (0-100). */
  readonly progress = computed(() => {
    const target = this.countdownTarget();
    if (this.mode() !== 'countdown' || target === 0) return 0;
    return Math.min(100, (this.elapsed() / target) * 100);
  });

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastSaveTime = 0;

  ngOnInit(): void {
    this.restoreState();
  }

  /** Start or resume the timer. */
  start(): void {
    if (this.isRunning() || this.disabled()) return;
    this.isRunning.set(true);
    this.intervalId = setInterval(() => {
      this.elapsed.update((e) => e + 1);

      // Save every 5 seconds to avoid excessive writes
      const now = Date.now();
      if (now - this.lastSaveTime > 5000) {
        this.saveState();
        this.lastSaveTime = now;
      }

      // Check countdown finish
      if (this.mode() === 'countdown' && this.countdownTarget() > 0) {
        if (this.elapsed() >= this.countdownTarget()) {
          this.pause();
          this.finished.emit();
        }
      }
    }, 1000);
    this.resumed.emit();
    this.saveState();
  }

  /** Pause the timer. */
  pause(): void {
    if (!this.isRunning()) return;
    this.isRunning.set(false);
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.paused.emit(this.elapsed());
    this.saveState();
  }

  /** Reset the timer to zero. */
  reset(): void {
    this.pause();
    this.elapsed.set(0);
    this.clearState();
  }

  /** Auto-pause: called by parent when events happen (substitution, sanction). */
  autoPause(): void {
    if (this.isRunning()) {
      this.pause();
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
    }
    this.saveState();
  }

  // ── Persistence ─────────────────────────────────────────────────────────

  private get storageKey(): string {
    return `timer_${this.matchId()}`;
  }

  private saveState(): void {
    const key = this.storageKey;
    if (!key || key === 'timer_') return;
    try {
      const state = {
        elapsed: this.elapsed(),
        isRunning: this.isRunning(),
        savedAt: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(state));
    } catch { /* storage unavailable */ }
  }

  private restoreState(): void {
    const key = this.storageKey;
    if (!key || key === 'timer_') return;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;

      const state = JSON.parse(raw) as { elapsed: number; isRunning: boolean; savedAt: number };

      // If timer was running when saved, add the time that passed since save
      let restoredElapsed = state.elapsed;
      if (state.isRunning && state.savedAt) {
        const secondsSinceSave = Math.floor((Date.now() - state.savedAt) / 1000);
        restoredElapsed += secondsSinceSave;
      }

      this.elapsed.set(restoredElapsed);

      // Auto-resume if it was running
      if (state.isRunning) {
        // Small delay to let the component fully initialize
        setTimeout(() => this.start(), 100);
      }
    } catch { /* corrupted data */ }
  }

  clearState(): void {
    const key = this.storageKey;
    if (key && key !== 'timer_') {
      localStorage.removeItem(key);
    }
  }

  private formatTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
}
