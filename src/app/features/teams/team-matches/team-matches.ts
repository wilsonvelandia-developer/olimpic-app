import { Component, ChangeDetectionStrategy, inject, signal, input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { PdfExportService } from '../../../core/services/pdf-export.service';
import { CsvExportService } from '../../../core/services/csv-export.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import type { Match } from '../../../core/models';

/**
 * Shows the match history for a specific team.
 * Can be embedded in team-detail or used standalone.
 */
@Component({
  selector: 'app-team-matches',
  imports: [DatePipe, LoadingSpinner],
  templateUrl: './team-matches.html',
  styleUrl: './team-matches.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamMatches implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly pdfExport = inject(PdfExportService);
  private readonly csvExport = inject(CsvExportService);

  readonly teamId = input.required<string>();
  readonly teamName = input<string>('');

  readonly matches = signal<Match[]>([]);
  readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadMatches();
  }

  loadMatches(): void {
    this.isLoading.set(true);
    this.api.get<Match[]>(`/matches?teamId=${this.teamId()}`).subscribe({
      next: (res) => { this.matches.set(res.data ?? []); this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });
  }

  onViewMatch(id: string): void {
    this.router.navigate(['/matches', id]);
  }

  onExportPdf(): void {
    this.pdfExport.exportFixtureFromMatches(
      `Historial - ${this.teamName() || 'Equipo'}`,
      this.matches(),
    );
  }

  onExportCsv(): void {
    this.csvExport.exportFixture(
      `historial-${this.teamName() || 'equipo'}`,
      this.matches(),
    );
  }

  getResultClass(match: Match): string {
    if (match.status !== 'finished') return '';
    if (match.winnerId === this.teamId()) return 'result--win';
    if (match.winnerId === null) return 'result--draw';
    return 'result--loss';
  }

  getResultLabel(match: Match): string {
    if (match.status !== 'finished') return 'Pendiente';
    if (match.winnerId === this.teamId()) return 'Victoria';
    if (match.winnerId === null) return 'Empate';
    return 'Derrota';
  }

  get stats() {
    const finished = this.matches().filter((m) => m.status === 'finished');
    return {
      total: finished.length,
      wins: finished.filter((m) => m.winnerId === this.teamId()).length,
      draws: finished.filter((m) => m.winnerId === null).length,
      losses: finished.filter((m) => m.winnerId !== null && m.winnerId !== this.teamId()).length,
    };
  }
}
