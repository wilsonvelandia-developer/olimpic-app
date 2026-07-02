import { Component, ChangeDetectionStrategy, inject, signal, input, output } from '@angular/core';
import { CsvImportService, type ParsedRow, type ImportResult } from '../../../core/services/csv-import.service';

/**
 * Reusable CSV import dialog — accepts file, validates, previews, and emits parsed data.
 * Used for bulk team/player import.
 */
@Component({
  selector: 'app-csv-import-dialog',
  templateUrl: './csv-import-dialog.html',
  styleUrl: './csv-import-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CsvImportDialog {
  private readonly importService = inject(CsvImportService);

  /** Import type: 'teams' or 'players'. */
  readonly importType = input<'teams' | 'players'>('teams');
  /** Dialog title. */
  readonly title = input<string>('Importar desde CSV');

  /** Emits the parsed valid rows on confirm. */
  readonly confirmed = output<unknown[]>();
  /** Emits when the dialog is cancelled. */
  readonly cancelled = output<void>();

  readonly file = signal<File | null>(null);
  readonly isProcessing = signal<boolean>(false);
  readonly preview = signal<ParsedRow[]>([]);
  readonly errors = signal<Array<{ row: number; message: string }>>([]);
  readonly validCount = signal<number>(0);
  readonly fileError = signal<string | null>(null);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;

    const validation = this.importService.validateFile(f);
    if (validation) {
      this.fileError.set(validation);
      return;
    }

    this.fileError.set(null);
    this.file.set(f);
    this.processFile(f);
  }

  private async processFile(f: File): Promise<void> {
    this.isProcessing.set(true);
    try {
      const rows = await this.importService.parseFile(f);
      this.preview.set(rows.slice(0, 5));

      if (this.importType() === 'teams') {
        const result = this.importService.parseTeamsImport(rows);
        this.validCount.set(result.success.length);
        this.errors.set(result.errors.map((e) => ({ row: e.row, message: e.message })));
      } else {
        const result = this.importService.parsePlayersImport(rows);
        this.validCount.set(result.success.length);
        this.errors.set(result.errors.map((e) => ({ row: e.row, message: e.message })));
      }
    } catch {
      this.fileError.set('Error al leer el archivo.');
    }
    this.isProcessing.set(false);
  }

  async onConfirm(): Promise<void> {
    const f = this.file();
    if (!f) return;

    const rows = await this.importService.parseFile(f);
    if (this.importType() === 'teams') {
      const result = this.importService.parseTeamsImport(rows);
      this.confirmed.emit(result.success);
    } else {
      const result = this.importService.parsePlayersImport(rows);
      this.confirmed.emit(result.success);
    }
  }

  onCancel(): void { this.cancelled.emit(); }

  get previewHeaders(): string[] {
    const first = this.preview()[0];
    return first ? Object.keys(first) : [];
  }
}
