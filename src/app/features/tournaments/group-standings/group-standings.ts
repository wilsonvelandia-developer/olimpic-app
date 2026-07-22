import {
  Component, ChangeDetectionStrategy, inject, signal, input, OnInit, OnDestroy, effect,
} from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { LiveUpdatesService } from '../../../core/services/live-updates.service';
import { TournamentLiveService } from '../../../core/services/tournament-live.service';

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
export class GroupStandings implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly liveUpdates = inject(LiveUpdatesService);
  private readonly tournamentLive = inject(TournamentLiveService);

  readonly tournamentId = input.required<string>();

  readonly groups    = signal<GroupData[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMsg  = signal<string | null>(null);

  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // React to real-time updates from WebSocket
    effect(() => {
      this.tournamentLive.lastUpdate(); // dependency
      if (this.groups().length > 0) {
        this.loadStandings(); // reload silently
      }
    });
  }

  ngOnInit(): void {
    this.loadStandings();
    // Join tournament WebSocket room
    this.tournamentLive.joinTournament(this.tournamentId());
    // Also poll every 30s as fallback
    this.refreshInterval = setInterval(() => this.loadStandings(), 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    this.tournamentLive.leaveTournament();
  }

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
