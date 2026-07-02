import { Injectable, signal, computed } from '@angular/core';

export interface TourStep {
  /** CSS selector of the target element to highlight. */
  target: string;
  /** Title of the step. */
  title: string;
  /** Description/content of the step. */
  content: string;
  /** Position of the tooltip relative to the target. */
  position: 'top' | 'bottom' | 'left' | 'right';
}

const STORAGE_KEY = 'olimpicapp_onboarding_completed';

/**
 * Onboarding tour service — guides new users through key features.
 * Manages step progression, completion state, and persistence.
 */
@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly _isActive = signal<boolean>(false);
  private readonly _currentStep = signal<number>(0);
  private readonly _steps = signal<TourStep[]>([]);

  readonly isActive = this._isActive.asReadonly();
  readonly currentStep = this._currentStep.asReadonly();
  readonly steps = this._steps.asReadonly();

  readonly currentStepData = computed<TourStep | null>(() => {
    if (!this._isActive()) return null;
    return this._steps()[this._currentStep()] ?? null;
  });

  readonly progress = computed(() => {
    const total = this._steps().length;
    if (total === 0) return 0;
    return Math.round(((this._currentStep() + 1) / total) * 100);
  });

  readonly isLastStep = computed(() => this._currentStep() >= this._steps().length - 1);

  /** Default tour steps for new organizers. */
  private readonly DEFAULT_STEPS: TourStep[] = [
    {
      target: '[data-tour="sidebar"]',
      title: 'Navegación principal',
      content: 'Usa el menú lateral para acceder a torneos, equipos, partidos y más.',
      position: 'right',
    },
    {
      target: '[data-tour="dashboard"]',
      title: 'Dashboard',
      content: 'Aquí ves un resumen de la actividad: partidos recientes, equipos inscritos y métricas.',
      position: 'bottom',
    },
    {
      target: '[data-tour="create-tournament"]',
      title: 'Crear torneo',
      content: 'Comienza creando tu primer torneo. Define el deporte, formato y fechas.',
      position: 'bottom',
    },
    {
      target: '[data-tour="teams"]',
      title: 'Gestionar equipos',
      content: 'Registra equipos y agrega jugadores con sus dorsales y posiciones.',
      position: 'right',
    },
    {
      target: '[data-tour="matches"]',
      title: 'Programar partidos',
      content: 'Genera el fixture automáticamente o programa partidos manualmente.',
      position: 'right',
    },
    {
      target: '[data-tour="referee"]',
      title: 'Modo árbitro',
      content: 'Los árbitros pueden registrar resultados en tiempo real desde una tablet.',
      position: 'left',
    },
  ];

  /**
   * Starts the onboarding tour if the user hasn't completed it before.
   * Call this on first login or from a "help" button.
   */
  startTour(steps?: TourStep[]): void {
    this._steps.set(steps ?? this.DEFAULT_STEPS);
    this._currentStep.set(0);
    this._isActive.set(true);
  }

  /**
   * Starts the tour only if it hasn't been completed before.
   */
  startIfNew(): void {
    if (!this.hasCompleted()) {
      this.startTour();
    }
  }

  /** Advances to the next step. Completes tour if on last step. */
  next(): void {
    if (this.isLastStep()) {
      this.complete();
    } else {
      this._currentStep.update((s) => s + 1);
    }
  }

  /** Goes back to the previous step. */
  previous(): void {
    this._currentStep.update((s) => Math.max(0, s - 1));
  }

  /** Skips the tour entirely and marks as completed. */
  skip(): void {
    this.complete();
  }

  /** Marks the tour as completed and persists. */
  private complete(): void {
    this._isActive.set(false);
    this._currentStep.set(0);
    try { localStorage.setItem(STORAGE_KEY, 'true'); } catch { /* noop */ }
  }

  /** Checks if tour was previously completed. */
  hasCompleted(): boolean {
    try { return localStorage.getItem(STORAGE_KEY) === 'true'; } catch { return false; }
  }

  /** Resets completion state (for re-running the tour). */
  reset(): void {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
  }
}
