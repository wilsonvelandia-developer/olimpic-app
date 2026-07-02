import { Injectable } from '@angular/core';

export interface ParsedRow {
  [key: string]: string;
}

export interface ImportResult<T> {
  success: T[];
  errors: Array<{ row: number; message: string; data: ParsedRow }>;
  totalRows: number;
}

/**
 * CSV/Excel import service.
 * Parses CSV files (including Excel-exported CSVs with BOM).
 * Returns structured data for teams/players bulk import.
 */
@Injectable({ providedIn: 'root' })
export class CsvImportService {

  /**
   * Parses a CSV file into an array of objects using the first row as headers.
   * Handles: BOM, quoted fields, commas inside quotes, CRLF/LF.
   * @param file - the uploaded File object
   * @returns Promise resolving to parsed rows
   */
  async parseFile(file: File): Promise<ParsedRow[]> {
    const text = await file.text();
    return this.parseCsv(text);
  }

  /**
   * Validates file type (csv, xlsx) and size (max 2MB).
   * @returns error message or null if valid
   */
  validateFile(file: File): string | null {
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const validExtensions = ['.csv', '.xls', '.xlsx'];
    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(extension)) {
      return 'Formato no soportado. Use archivos CSV o Excel (.csv, .xlsx).';
    }
    if (file.size > 2 * 1024 * 1024) {
      return 'El archivo excede el límite de 2MB.';
    }
    return null;
  }

  /**
   * Parses a team import CSV with expected columns:
   * nombre, abreviatura, telefono, email, variante
   */
  parseTeamsImport(rows: ParsedRow[]): ImportResult<{ name: string; shortName: string | null; phone: string | null; email: string | null; variant: string | null }> {
    const success: Array<{ name: string; shortName: string | null; phone: string | null; email: string | null; variant: string | null }> = [];
    const errors: Array<{ row: number; message: string; data: ParsedRow }> = [];

    rows.forEach((row, index) => {
      const name = (row['nombre'] ?? row['name'] ?? '').trim();
      if (!name || name.length < 2) {
        errors.push({ row: index + 2, message: 'Nombre requerido (mínimo 2 caracteres)', data: row });
        return;
      }
      success.push({
        name,
        shortName: (row['abreviatura'] ?? row['shortname'] ?? '').trim() || null,
        phone: (row['telefono'] ?? row['phone'] ?? '').trim() || null,
        email: (row['email'] ?? row['correo'] ?? '').trim() || null,
        variant: (row['variante'] ?? row['variant'] ?? '').trim() || null,
      });
    });

    return { success, errors, totalRows: rows.length };
  }

  /**
   * Parses a player import CSV with expected columns:
   * nombre, dorsal, posicion, documento_tipo, documento_numero, email, telefono, fecha_nacimiento
   */
  parsePlayersImport(rows: ParsedRow[]): ImportResult<{ name: string; jerseyNumber: number; position: string | null; documentType: string | null; documentNumber: string | null; email: string | null; phone: string | null; birthDate: string | null }> {
    const success: Array<{ name: string; jerseyNumber: number; position: string | null; documentType: string | null; documentNumber: string | null; email: string | null; phone: string | null; birthDate: string | null }> = [];
    const errors: Array<{ row: number; message: string; data: ParsedRow }> = [];

    rows.forEach((row, index) => {
      const name = (row['nombre'] ?? row['name'] ?? '').trim();
      const dorsalStr = (row['dorsal'] ?? row['jersey'] ?? row['numero'] ?? '').trim();
      const dorsal = parseInt(dorsalStr, 10);

      if (!name || name.length < 2) {
        errors.push({ row: index + 2, message: 'Nombre requerido', data: row });
        return;
      }
      if (isNaN(dorsal) || dorsal < 0 || dorsal > 99) {
        errors.push({ row: index + 2, message: 'Dorsal inválido (0-99)', data: row });
        return;
      }

      success.push({
        name,
        jerseyNumber: dorsal,
        position: (row['posicion'] ?? row['position'] ?? '').trim() || null,
        documentType: (row['documento_tipo'] ?? row['doc_type'] ?? '').trim() || null,
        documentNumber: (row['documento_numero'] ?? row['doc_number'] ?? '').trim() || null,
        email: (row['email'] ?? row['correo'] ?? '').trim() || null,
        phone: (row['telefono'] ?? row['phone'] ?? '').trim() || null,
        birthDate: (row['fecha_nacimiento'] ?? row['birth_date'] ?? '').trim() || null,
      });
    });

    return { success, errors, totalRows: rows.length };
  }

  /**
   * Core CSV parser — handles BOM, quoted fields, newlines in quotes.
   */
  private parseCsv(text: string): ParsedRow[] {
    // Remove BOM if present
    const clean = text.startsWith('\uFEFF') ? text.slice(1) : text;
    const lines = this.splitLines(clean);
    if (lines.length < 2) return [];

    const headers = this.parseLine(lines[0]).map((h) => h.toLowerCase().trim());
    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseLine(lines[i]);
      if (values.length === 0 || (values.length === 1 && values[0] === '')) continue;

      const row: ParsedRow = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx]?.trim() ?? '';
      });
      rows.push(row);
    }

    return rows;
  }

  /** Splits CSV text into lines respecting quoted newlines. */
  private splitLines(text: string): string[] {
    const lines: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        inQuotes = !inQuotes;
        current += char;
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && text[i + 1] === '\n') i++;
        if (current.trim()) lines.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) lines.push(current);

    return lines;
  }

  /** Parses a single CSV line respecting quoted fields. */
  private parseLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        fields.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current);

    return fields;
  }
}
