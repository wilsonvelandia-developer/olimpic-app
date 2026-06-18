import {
  Component, ChangeDetectionStrategy, inject, signal, input, OnInit,
} from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

interface GroupEntry {
  teamId: string;
  teamName: string;
  teamShort: string | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  scoreFor: number;
  scoreAgainst: number;
  scoreDiff: number;
  setsWon: number;
  setsLost: number;
  fairPlayScore: number;
}

interface GroupData {
  groupName: string;
  standings: GroupEntry[];
}

@Component({
  selector: 'app-group-standings',
  imports: [LoadingSpinner],
  templateUrl: './group-standings.html',
  styleUrl: './group-standings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupStandings implements OnInit {
  private readonly api = inject(ApiService);

  readonly tournamentId = input.required<string>();

  readonly groups    = signal<GroupData[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMsg  = signal<string | null>(null);

  ngOnInit(): void { this.loadStandings(); }

  loadStandings(): void {
    this.isLoading.set(true);
    this.api.get<GroupData[]>(`/standings/groups/${this.tournamentId()}`).subscribe({
      next: (r) => { this.groups.set(r.data ?? []); this.isLoading.set(false); },
      error: () => { this.errorMsg.set('No se pudieron cargar las posiciones.'); this.isLoading.set(false); },
    });
  }

  positionIcon(pos: number): string {
    if (pos === 1) return '🥇';
    if (pos === 2) return '🥈';
    if (pos === 3) return '🥉';
    return String(pos);
  }
}
