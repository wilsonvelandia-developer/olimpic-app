import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { StandingsEntry, Match } from '../models';

interface MatchSheetData {
  tournamentName: string;
  sportName: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  venue: string;
  round: string;
  homePlayers: Array<{ jerseyNumber: number; name: string; position: string | null }>;
  awayPlayers: Array<{ jerseyNumber: number; name: string; position: string | null }>;
}

interface FixtureEntry {
  round: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  time: string;
}

/**
 * Service for generating PDF exports using jsPDF.
 * Supports: match sheet (planilla), standings table, and fixture list.
 */
@Injectable({ providedIn: 'root' })
export class PdfExportService {

  /**
   * Generates a match sheet PDF (planilla de partido).
   * @param data - match and team roster information
   */
  exportMatchSheet(data: MatchSheetData): void {
    const doc = new jsPDF('portrait', 'mm', 'letter');
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PLANILLA DE PARTIDO', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(data.tournamentName, pageWidth / 2, 22, { align: 'center' });
    doc.text(`${data.sportName} — ${data.round}`, pageWidth / 2, 27, { align: 'center' });

    // Match info
    doc.setFontSize(9);
    doc.text(`Fecha: ${data.date}`, 15, 36);
    doc.text(`Sede: ${data.venue}`, 15, 41);

    // Teams header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(data.homeTeam, 15, 52);
    doc.text('vs', pageWidth / 2, 52, { align: 'center' });
    doc.text(data.awayTeam, pageWidth - 15, 52, { align: 'right' });

    // Score boxes
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(pageWidth / 2 - 20, 55, 15, 12);
    doc.rect(pageWidth / 2 + 5, 55, 15, 12);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('LOCAL', pageWidth / 2 - 12.5, 70, { align: 'center' });
    doc.text('VISITANTE', pageWidth / 2 + 12.5, 70, { align: 'center' });

    // Home team roster
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${data.homeTeam} — Nómina`, 15, 80);

    autoTable(doc, {
      startY: 83,
      head: [['#', 'Nombre', 'Posición', 'Goles', 'TA', 'TR']],
      body: data.homePlayers.map((p) => [
        String(p.jerseyNumber), p.name, p.position ?? '—', '', '', '',
      ]),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [26, 86, 219], textColor: 255 },
      margin: { left: 15, right: 15 },
      tableWidth: (pageWidth - 30) / 2 - 5,
    });

    // Away team roster
    const homeTableEnd = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 130;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${data.awayTeam} — Nómina`, 15, homeTableEnd + 8);

    autoTable(doc, {
      startY: homeTableEnd + 11,
      head: [['#', 'Nombre', 'Posición', 'Goles', 'TA', 'TR']],
      body: data.awayPlayers.map((p) => [
        String(p.jerseyNumber), p.name, p.position ?? '—', '', '', '',
      ]),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [100, 100, 100], textColor: 255 },
      margin: { left: 15, right: 15 },
    });

    // Signatures
    const awayTableEnd = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 200;
    const sigY = Math.min(awayTableEnd + 20, 250);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.line(15, sigY, 75, sigY);
    doc.text('Firma Árbitro', 45, sigY + 4, { align: 'center' });
    doc.line(95, sigY, 155, sigY);
    doc.text('Firma DT Local', 125, sigY + 4, { align: 'center' });
    doc.line(165, sigY, 200, sigY);
    doc.text('Firma DT Visitante', 182.5, sigY + 4, { align: 'center' });

    doc.save(`planilla-${data.homeTeam}-vs-${data.awayTeam}.pdf`);
  }

  /**
   * Generates a standings table PDF.
   * @param tournamentName - name of the tournament
   * @param standings - array of standings entries
   */
  exportStandings(tournamentName: string, standings: StandingsEntry[]): void {
    const doc = new jsPDF('landscape', 'mm', 'letter');
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TABLA DE POSICIONES', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(tournamentName, pageWidth / 2, 21, { align: 'center' });
    doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, pageWidth / 2, 26, { align: 'center' });

    autoTable(doc, {
      startY: 32,
      head: [['Pos', 'Equipo', 'PJ', 'PG', 'PE', 'PP', 'GF', 'GC', 'DG', 'Pts']],
      body: standings.map((s, i) => [
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
      ]),
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 3, halign: 'center' },
      headStyles: { fillColor: [26, 86, 219], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'left' } },
      margin: { left: 15, right: 15 },
    });

    doc.save(`posiciones-${tournamentName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  }

  /**
   * Generates a fixture (calendar) PDF.
   * @param tournamentName - name of the tournament
   * @param fixtures - array of fixture entries (matches)
   */
  exportFixture(tournamentName: string, fixtures: FixtureEntry[]): void {
    const doc = new jsPDF('portrait', 'mm', 'letter');
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('FIXTURE / PROGRAMACIÓN', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(tournamentName, pageWidth / 2, 21, { align: 'center' });
    doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, pageWidth / 2, 26, { align: 'center' });

    autoTable(doc, {
      startY: 32,
      head: [['Ronda', 'Fecha', 'Hora', 'Local', 'Visitante', 'Sede']],
      body: fixtures.map((f) => [
        f.round, f.date, f.time, f.homeTeam, f.awayTeam, f.venue,
      ]),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [26, 86, 219], textColor: 255, fontStyle: 'bold' },
      margin: { left: 10, right: 10 },
    });

    doc.save(`fixture-${tournamentName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  }

  /**
   * Generates a fixture for a list of matches (from Match model).
   * Convenience wrapper that maps Match[] to FixtureEntry[].
   * @param tournamentName - tournament name
   * @param matches - array of Match objects
   */
  exportFixtureFromMatches(tournamentName: string, matches: Match[]): void {
    const fixtures: FixtureEntry[] = matches.map((m) => ({
      round: m.round ?? '—',
      date: m.scheduledAt ? new Date(m.scheduledAt).toLocaleDateString('es-CO') : '—',
      time: m.scheduledAt ? new Date(m.scheduledAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '—',
      homeTeam: m.homeTeamName ?? 'TBD',
      awayTeam: m.awayTeamName ?? 'TBD',
      venue: m.venue ?? '—',
    }));
    this.exportFixture(tournamentName, fixtures);
  }
}
