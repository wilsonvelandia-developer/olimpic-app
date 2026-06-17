import {
  Component, ChangeDetectionStrategy, inject, signal, input, OnInit, computed,
} from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import type { Team } from '../../../core/models';

interface GroupAssignment {
  teamId:    string;
  teamName:  string;
  groupName: string;
  drawOrder: number;
}

/**
 * Group Draw component.
 * Randomly distributes teams into groups with visual feedback.
 * Only enabled when tournament is in 'draft' status.
 */
@Component({
  selector: 'app-group-draw',
  templateUrl: './group-draw.html',
  styleUrl: './group-draw.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupDraw implements OnInit {
  private readonly api  = inject(ApiService);
  readonly auth = inject(AuthService);

  readonly tournamentId = input.required<string>();
  readonly numGroups    = input<number>(2);
  readonly status       = input<string>('draft');

  readonly teams       = signal<Team[]>([]);
  readonly groups      = signal<Record<string, GroupAssignment[]>>({});
  readonly isLoading   = signal<boolean>(false);
  readonly isSaving    = signal<boolean>(false);
  readonly isConfirmed = signal<boolean>(false);
  readonly errorMsg    = signal<string | null>(null);
  readonly successMsg  = signal<string | null>(null);
  readonly isAnimating = signal<boolean>(false);

  /** True when the draw can be modified (draft + not confirmed). */
  readonly canDraw = computed(() =>
    this.status() === 'draft' && !this.isConfirmed() && this.auth.canEdit(),
  );

  /** Expose Math.ceil for template use. */
  readonly Math = Math;
  readonly Object = Object;

  /** Group labels: A, B, C, ... */
  readonly groupLabels = computed(() => {
    const n = this.numGroups() || 2;
    return Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i));
  });

  ngOnInit(): void {
    this.loadTeams();
    this.loadExistingDraw();
  }

  private loadTeams(): void {
    this.isLoading.set(true);
    this.api.getPaginated<Team>('/teams', { tournamentId: this.tournamentId(), pageSize: 200 })
      .subscribe({
        next: (r) => { this.teams.set(r.data); this.isLoading.set(false); },
        error: () => { this.errorMsg.set('No se pudieron cargar los equipos.'); this.isLoading.set(false); },
      });
  }

  private loadExistingDraw(): void {
    this.api.get<GroupAssignment[]>(`/tournaments/${this.tournamentId()}/groups`)
      .subscribe({
        next: (r) => {
          if (r.data && r.data.length > 0) {
            this.groups.set(this.groupByName(r.data));
            this.isConfirmed.set(true);
          }
        },
      });
  }

  /** Performs a random draw — shuffles teams and distributes into groups */
  onDraw(): void {
    const teamList = [...this.teams()];
    if (teamList.length === 0) {
      this.errorMsg.set('No hay equipos registrados en este torneo.');
      return;
    }

    this.isAnimating.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);

    // Fisher-Yates shuffle
    for (let i = teamList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [teamList[i], teamList[j]] = [teamList[j], teamList[i]];
    }

    // Distribute into groups (round-robin assignment)
    const numG = this.numGroups() || 2;
    const result: Record<string, GroupAssignment[]> = {};
    const labels = this.groupLabels();

    labels.forEach((l) => result[l] = []);

    teamList.forEach((team, idx) => {
      const groupLabel = labels[idx % numG];
      const orderInGroup = Math.floor(idx / numG) + 1;
      result[groupLabel].push({
        teamId:    team.id,
        teamName:  team.shortName ?? team.name,
        groupName: groupLabel,
        drawOrder: orderInGroup,
      });
    });

    // Animate delay
    setTimeout(() => {
      this.groups.set(result);
      this.isAnimating.set(false);
    }, 600);
  }

  /** Saves the current draw to the backend */
  onConfirm(): void {
    const allAssignments: GroupAssignment[] = [];
    Object.values(this.groups()).forEach((g) => allAssignments.push(...g));

    if (allAssignments.length === 0) {
      this.errorMsg.set('Realiza el sorteo primero.');
      return;
    }

    this.isSaving.set(true);
    this.errorMsg.set(null);

    const payload = allAssignments.map((a) => ({
      teamId:    a.teamId,
      groupName: a.groupName,
      drawOrder: a.drawOrder,
    }));

    this.api.post<GroupAssignment[]>(`/tournaments/${this.tournamentId()}/groups`, payload)
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.isConfirmed.set(true);
          this.successMsg.set('✓ Sorteo confirmado y guardado exitosamente.');
        },
        error: () => {
          this.isSaving.set(false);
          this.errorMsg.set('No se pudo guardar el sorteo. Intenta nuevamente.');
        },
      });
  }

  /** Resets the confirmed state to allow re-draw */
  onReset(): void {
    this.isConfirmed.set(false);
    this.successMsg.set(null);
    this.groups.set({});
  }

  private groupByName(data: GroupAssignment[]): Record<string, GroupAssignment[]> {
    const result: Record<string, GroupAssignment[]> = {};
    data.forEach((a) => {
      if (!result[a.groupName]) result[a.groupName] = [];
      result[a.groupName].push(a);
    });
    return result;
  }
}
