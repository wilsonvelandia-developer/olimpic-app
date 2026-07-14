import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { LoadingSpinner } from '../../shared/components/loading-spinner/loading-spinner';
import { ToastService } from '../../shared/components/toast/toast.service';

interface Observation {
  id: string;
  subject: string;
  body: string;
  status: string;
  matchId: string | null;
  createdAt: string;
  observerName?: string;
}

/**
 * Observations page — allows observers to submit and view observations about tournaments.
 */
@Component({
  selector: 'app-observations',
  imports: [FormsModule, LoadingSpinner],
  template: `
    <section class="page">
      <div class="page__header">
        <h1 class="page__title">Observaciones</h1>
        <p class="page__subtitle">Registra observaciones sobre los torneos asignados</p>
      </div>

      <!-- New observation form -->
      @if (auth.isAuthenticated$()) {
        <div class="obs-form">
          <h3>Nueva observación</h3>
          <div class="form-group">
            <label class="form-label">Torneo</label>
            <select class="form-control" [(ngModel)]="selectedTournament">
              @for (t of tournaments(); track t.id) {
                <option [value]="t.id">{{ t.name }}</option>
              }
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Asunto</label>
            <input class="form-control" [(ngModel)]="newSubject" placeholder="Asunto de la observación" />
          </div>
          <div class="form-group">
            <label class="form-label">Descripción</label>
            <textarea class="form-control" [(ngModel)]="newBody" rows="4" placeholder="Describe tu observación..."></textarea>
          </div>
          <button class="btn btn--primary" (click)="onSubmit()" [disabled]="!selectedTournament || !newSubject || !newBody">
            Enviar observación
          </button>
        </div>
      }

      <!-- List -->
      @if (isLoading()) { <app-loading-spinner label="Cargando observaciones..." /> }

      @if (!isLoading() && observations().length === 0) {
        <p class="empty-state">No hay observaciones registradas.</p>
      }

      @if (!isLoading() && observations().length > 0) {
        <div class="obs-list">
          @for (obs of observations(); track obs.id) {
            <article class="obs-card">
              <div class="obs-card__header">
                <strong>{{ obs.subject }}</strong>
                <span class="obs-card__status badge" [class.badge--success]="obs.status === 'resolved'" [class.badge--warning]="obs.status === 'pending'">{{ obs.status }}</span>
              </div>
              <p class="obs-card__body">{{ obs.body }}</p>
              <span class="obs-card__date">{{ formatDate(obs.createdAt) }}</span>
            </article>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 1.5rem; }
    .page__title { font-size: 1.5rem; font-weight: 700; }
    .page__subtitle { color: var(--color-text-secondary); font-size: 0.9rem; }
    .obs-form { background: var(--color-bg-primary); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .obs-form h3 { font-size: 1rem; font-weight: 600; margin: 0; }
    .obs-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .obs-card { background: var(--color-bg-primary); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1rem; }
    .obs-card__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .obs-card__body { font-size: 0.9rem; color: var(--color-text-secondary); margin: 0; }
    .obs-card__date { font-size: 0.75rem; color: var(--color-text-secondary); margin-top: 0.5rem; display: block; }
    .empty-state { text-align: center; color: var(--color-text-secondary); padding: 2rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Observations implements OnInit {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly isLoading = signal(true);
  readonly observations = signal<Observation[]>([]);
  readonly tournaments = signal<Array<{ id: string; name: string }>>([]);

  selectedTournament = '';
  newSubject = '';
  newBody = '';

  ngOnInit(): void {
    this.api.get<Array<{ id: string; name: string }>>('/tournaments').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.tournaments.set(res.data);
          if (res.data.length > 0) this.selectedTournament = res.data[0].id;
          this.loadObservations();
        }
      },
    });
  }

  loadObservations(): void {
    if (!this.selectedTournament) { this.isLoading.set(false); return; }
    this.isLoading.set(true);
    this.api.get<Observation[]>(`/tournaments/${this.selectedTournament}/observations`).subscribe({
      next: (res) => { this.observations.set(res.data ?? []); this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });
  }

  onSubmit(): void {
    if (!this.selectedTournament || !this.newSubject || !this.newBody) return;
    this.api.post(`/tournaments/${this.selectedTournament}/observations`, {
      subject: this.newSubject,
      body: this.newBody,
    }).subscribe({
      next: () => {
        this.toast.success('Observación enviada');
        this.newSubject = '';
        this.newBody = '';
        this.loadObservations();
      },
      error: () => this.toast.error('Error al enviar observación'),
    });
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
  }
}
