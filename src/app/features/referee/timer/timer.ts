import {
  Component, ChangeDetectionStrategy, signal, input, output,
  OnDestroy, computed,
} from '@angular/core';

export type TimerMode = 'progressive' | 'countdown';

/**
 * Match timer component.
 * Supports progressive (0:00 → ∞) and countdown (target → 0:00) modes.
 * The referee can choose the mode or it defaults based on sport config.
 * Emits events when paused/resumed and when countdown reaches zero.
 */
@Component({
  selector: 'app-timer',
  templateUrl: './timer.html',
  styleUrl: './timer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Timer implements OnDestroy {
  /** Timer mode: progressive counts up, countdown counts down. */
  readonly mode = input<TimerMode>('progressive');

  /** Target time in seconds for countdown mode (e.g. 2700 for 45 minutes). */
  readonly countdownTarget = input<number>(0);

  /** Whether timer controls should be disabled. */
  readonly disabled = input<boolean>(false);

  readonly paused = output<number>();
  readonly resumed = output<void>();
  readonly finished = output<void>();

  /** Elapsed seconds since timer started. */
  readonly elapsed = signal<number>(0);
  readonly isRunning = signal<boolean>(false);

  /** Formatted time display (MM:SS). */
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

  /** Start or resume the timer. */
  start(): void {
    if (this.isRunning() || this.disabled()) return;
    this.isRunning.set(true);
    this.intervalId = setInterval(() => {
      this.elapsed.update((e) => e + 1);

      // Check countdown finish
      if (this.mode() === 'countdown' && this.countdownTarget() > 0) {
        if (this.elapsed() >= this.countdownTarget()) {
          this.pause();
          this.finished.emit();
        }
      }
    }, 1000);
    this.resumed.emit();
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
  }

  /** Reset the timer to zero. */
  reset(): void {
    this.pause();
    this.elapsed.set(0);
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
  }

  private formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
}
