import { Injectable } from '@angular/core';
import type { Match, StandingsEntry } from '../models';

/**
 * Service for exporting data as CSV files.
 * Uses native Blob API — no external dependencies required.
 */
@Injectable({ providedIn: 'root' })
export class CsvExportService {

  /**
   * Exports fixture/match list as CSV.
   * @param tournamentName - used for the filename
   * @param matches - array of Match objects
   */
  exportFixture(tournamentName: string, matches: Match[]): void {
    const headers = ['Ronda', 'Fecha', 'Hora', 'Local', 'Visitante', 'Resultado', 'Sede', 'Estado'];
    const rows = matches.map((m) => [
      m.round ?? '',
      m.scheduledAt ? new Date(m.scheduledAt).toLocaleDateString('es-CO') : '',
      m.scheduledAt ? new Date(m.scheduledAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '',
      m.homeTeamName ?? '',
      m.awayTeamName ?? '',
      m.homeScore != null && m.awayScore != null ? `${m.homeScore} - ${m.awayScore}` : '',
      m.venue ?? '',
      m.status,
    ]);

    const filename = `fixture-${tournamentName.replace(/\s+/g, '-').toLowerCase()}.csv`;
    this.downloadCsv(headers, rows, filename);
  }

  /**
   * Exports standings table as CSV.
   * @param tournamentName - used for the filename
   * @param standings - array of standings entries
   */
  exportStandings(tournamentName: string, standings: StandingsEntry[]): void {
    const headers = ['Pos', 'Equipo', 'PJ', 'PG', 'PE', 'PP', 'GF', 'GC', 'DG', 'Pts'];
    const rows = standings.map((s, i) => [
      String(i + 1),
      s.teamName,
      String(s.played),
      String(s.won),
      String(s.drawn),
      String(s.lost),
      String(s.goalsFor),
      String(s.goalsAgainst),
      String(s.goalDifference),
      String(s.points),
    ]);

    const filename = `posiciones-${tournamentName.replace(/\s+/g, '-').toLowerCase()}.csv`;
    this.downloadCsv(headers, rows, filename);
  }

  /**
   * Generic CSV download helper.
   * Properly escapes fields with commas, quotes, and newlines.
   */
  private downloadCsv(headers: string[], rows: string[][], filename: string): void {
    const escape = (field: string): string => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };

    const lines = [
      headers.map(escape).join(','),
      ...rows.map((row) => row.map(escape).join(',')),
    ];

    const bom = '\uFEFF';
    const csv = bom + lines.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
