import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { AuthService } from '../../../core/services/auth.service';

interface RefereeAssignment {
  id: string;
  matchId: string;
  refereeId: string;
  refereeName: string;
  role: string;
  matchDate: string | null;
  homeTeam: string;
  awayTeam: string;
  tournamentName: string;
  status: string;
}

interface RefereeUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  matchCount: number;
  isAvailable: boolean;
}

/**
 * Referee management view — shows referee history, availability, and assignments.
 * Accessible by organizers and admins.
 */
@Component({
  selector: 'app-referee-history',
  imports: [DatePipe, LoadingSpinner],
  templateUrl: './referee-history.html',
  styleUrl: './referee-history.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RefereeHistory implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly referees = signal<RefereeUser[]>([]);
  readonly assignments = signal<RefereeAssignment[]>([]);
  readonly selectedReferee = signal<string | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly isLoadingAssignments = signal<boolean>(false);

  ngOnInit(): void {
    this.loadReferees();
  }

  loadReferees(): void {
    this.isLoading.set(true);
    this.api.get<RefereeUser[]>('/users?role=referee').subscribe({
      next: (res) => { this.referees.set(res.data ?? []); this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });
  }

  onSelectReferee(id: string): void {
    this.selectedReferee.set(id);
    this.isLoadingAssignments.set(true);
    this.api.get<RefereeAssignment[]>(`/matches/referees?refereeId=${id}`).subscribe({
      next: (res) => { this.assignments.set(res.data ?? []); this.isLoadingAssignments.set(false); },
      error: () => this.isLoadingAssignments.set(false),
    });
  }

  onViewMatch(matchId: string): void {
    this.router.navigate(['/matches', matchId]);
  }

  getSelectedRefereeName(): string {
    const id = this.selectedReferee();
    const ref = this.referees().find((r) => r.id === id);
    return ref?.name ?? '';
  }
}
