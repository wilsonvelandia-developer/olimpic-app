import {
  Component, ChangeDetectionStrategy, inject, signal, input, OnInit, computed,
} from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import type { Team } from '../../../core/models';

/**
 * Fixture matches component — generates, displays and allows editing
 * of group phase matches. Placed in the "Partidos" tab.
 */
@Component({
  selector: 'app-fixture-matches',
  templateUrl: './fixture-matches.html',
  styleUrl: './fixture-matches.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FixtureMatches implements OnInit {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);

  readonly tournamentId = input.required<string>();
  readonly status       = input<string>('draft');

  readonly teams           = signal<Team[]>([]);
  readonly fixtureMatches  = signal<unknown[]>([]);
  readonly isLoading       = signal<boolean>(false);
  readonly isGenerating    = signal<boolean>(false);
  readonly fixtureGenerated = signal<boolean>(false);
  readonly errorMsg        = signal<string | null>(null);
  readonly successMsg      = signal<string | null>(null);

  readonly canEditFixture = computed(() =>
    this.status() === 'draft' && this.auth.canEdit(),
  );

  readonly fixtureConfig = signal<{
    startDate: string;
    matchDurationMinutes: number;
    matchesPerDay: number;
    firstMatchTime: string;
    numVenues: number;
    randomOrder: boolean;
  }>({
    startDate: new Date().toISOString().slice(0, 10),
    matchDurationMinutes: 90,
    matchesPerDay: 6,
    firstMatchTime: '08:00',
    numVenues: 1,
    randomOrder: false,
  });

  ngOnInit(): void {
    this.loadTeams();
    this.loadExistingFixture();
  }

  private loadTeams(): void {
    this.api.getPaginated<Team>('/teams', { tournamentId: this.tournamentId(), pageSize: 200 })
      .subscribe({ next: (r) => this.teams.set(r.data) });
  }

  private loadExistingFixture(): void {
    this.isLoading.set(true);
    this.api.get<Array<{ id: string; name: string }>>(
      `/tournaments/${this.tournamentId()}/phases`,
    ).subscribe({
      next: (r) => {
        const gruposPhase = (r.data ?? []).find((p) => p.name === 'Fase de Grupos');
        if (gruposPhase) {
          this.api.getPaginated<unknown>('/matches', { phaseId: gruposPhase.id, pageSize: 200 })
            .subscribe({
              next: (matchesRes) => {
                if (matchesRes.data && matchesRes.data.length > 0) {
                  this.fixtureMatches.set(matchesRes.data);
                  this.fixtureGenerated.set(true);
                }
                this.isLoading.set(false);
              },
              error: () => this.isLoading.set(false),
            });
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => this.isLoading.set(false),
    });
  }

  onGenerateFixture(): void {
    this.isGenerating.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);

    const cfg = this.fixtureConfig();
    this.api.post<unknown[]>(`/tournaments/${this.tournamentId()}/generate-fixture`, cfg)
      .subscribe({
        next: (r) => {
          this.fixtureMatches.set(r.data as unknown[]);
          this.fixtureGenerated.set(true);
          this.isGenerating.set(false);
          this.successMsg.set(`✓ ${(r.data as unknown[]).length} partidos generados.`);
        },
        error: () => {
          this.errorMsg.set('No se pudieron generar los partidos. Confirma el sorteo de grupos primero.');
          this.isGenerating.set(false);
        },
      });
  }

  onUpdateConfig(field: string, value: string | number | boolean): void {
    this.fixtureConfig.set({ ...this.fixtureConfig(), [field]: value });
  }

  // ── Match helpers ─────────────────────────────────────────────────────────

  teamName(id: string): string {
    const t = this.teams().find((team) => team.id === id);
    return t ? (t.shortName ?? t.name) : id.slice(0, 8);
  }

  getMatchTeamName(match: unknown, side: 'home' | 'away'): string {
    const m = match as Record<string, unknown>;
    const id = (side === 'home'
      ? (m['home_team_id'] ?? m['homeTeamId'])
      : (m['away_team_id'] ?? m['awayTeamId'])) as string;
    return id ? this.teamName(id) : '?';
  }

  getMatchVenue(match: unknown): string {
    const m = match as Record<string, unknown>;
    const venue = m['venue'] as string | null;
    if (venue) return venue;
    const dt = ((m['scheduled_at'] ?? m['scheduledAt']) as string) ?? '';
    const timeSlot = dt.slice(0, 16);
    const all = this.sortedMatches();
    const sameSlot = all.filter((o) => {
      const od = ((o as Record<string, unknown>)['scheduled_at'] ?? (o as Record<string, unknown>)['scheduledAt']) as string ?? '';
      return od.slice(0, 16) === timeSlot;
    });
    const idx = sameSlot.indexOf(match);
    return `Cancha ${(idx >= 0 ? idx : 0) + 1}`;
  }

  getMatchDateOnly(match: unknown): string {
    const m = match as Record<string, unknown>;
    const dt = (m['scheduled_at'] ?? m['scheduledAt']) as string | null;
    return dt ? dt.slice(0, 10) : '';
  }

  getMatchTimeOnly(match: unknown): string {
    const m = match as Record<string, unknown>;
    const dt = (m['scheduled_at'] ?? m['scheduledAt']) as string | null;
    return dt ? dt.slice(11, 16) : '08:00';
  }

  sortedMatches(): unknown[] {
    return [...this.fixtureMatches()].sort((a, b) => {
      const da = ((a as Record<string, unknown>)['scheduled_at'] ?? (a as Record<string, unknown>)['scheduledAt']) as string ?? '';
      const db = ((b as Record<string, unknown>)['scheduled_at'] ?? (b as Record<string, unknown>)['scheduledAt']) as string ?? '';
      return da.localeCompare(db);
    });
  }

  onEditMatchDate(match: unknown, newDate: string): void {
    const m = match as Record<string, unknown>;
    const id = m['id'] as string;
    const oldDt = ((m['scheduled_at'] ?? m['scheduledAt']) as string) ?? '';
    const time = oldDt.slice(11, 19) || '08:00:00';
    const newVal = `${newDate}T${time}`;
    this.api.patch<unknown>(`/matches/${id}/schedule`, { scheduledAt: newVal }).subscribe({
      next: () => { m['scheduled_at'] = newVal; m['scheduledAt'] = newVal; this.fixtureMatches.set([...this.fixtureMatches()]); },
    });
  }

  onEditMatchTime(match: unknown, newTime: string): void {
    const m = match as Record<string, unknown>;
    const id = m['id'] as string;
    const oldDt = ((m['scheduled_at'] ?? m['scheduledAt']) as string) ?? '';
    const date = oldDt.slice(0, 10) || new Date().toISOString().slice(0, 10);
    const newVal = `${date}T${newTime}:00`;
    this.api.patch<unknown>(`/matches/${id}/schedule`, { scheduledAt: newVal }).subscribe({
      next: () => { m['scheduled_at'] = newVal; m['scheduledAt'] = newVal; this.fixtureMatches.set([...this.fixtureMatches()]); },
    });
  }

  onEditMatchVenue(match: unknown, newVenue: string): void {
    const m = match as Record<string, unknown>;
    const id = m['id'] as string;
    this.api.patch<unknown>(`/matches/${id}/schedule`, { venue: newVenue }).subscribe({
      next: () => { m['venue'] = newVenue; this.fixtureMatches.set([...this.fixtureMatches()]); },
    });
  }
}
