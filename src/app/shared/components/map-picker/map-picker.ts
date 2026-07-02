import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

/**
 * Map picker component — allows selecting a location via Google Maps embed.
 * Shows an embedded map and a text field for the Google Maps URL.
 * Users can paste a Google Maps link or click "Abrir Maps" to select a location.
 */
@Component({
  selector: 'app-map-picker',
  imports: [FormsModule],
  template: `
    <div class="map-picker">
      <label class="map-picker__label">{{ label() }}</label>

      <div class="map-picker__input-row">
        <input type="url" class="form-control"
          [ngModel]="urlValue()"
          (ngModelChange)="onUrlChange($event)"
          placeholder="https://maps.google.com/..." maxlength="500" />
        <button type="button" class="btn btn--secondary btn--sm" (click)="onOpenMaps()">
          📍 Abrir Maps
        </button>
      </div>

      @if (urlValue()) {
        <div class="map-picker__preview">
          <iframe class="map-picker__iframe"
            [src]="embedUrl()"
            loading="lazy" allowfullscreen
            referrerpolicy="no-referrer-when-downgrade"
            title="Ubicación en mapa">
          </iframe>
        </div>
      }

      <span class="map-picker__hint">Pega un enlace de Google Maps o haz clic en "Abrir Maps" para seleccionar la ubicación.</span>
    </div>
  `,
  styles: [`
    .map-picker { display: flex; flex-direction: column; gap: 0.5rem; }
    .map-picker__label { font-size: 0.875rem; font-weight: 500; }
    .map-picker__input-row { display: flex; gap: 0.5rem; align-items: center; }
    .map-picker__input-row .form-control { flex: 1; }
    .map-picker__preview {
      border-radius: var(--radius-md);
      overflow: hidden;
      border: 1px solid var(--color-border);
      height: 200px;
    }
    .map-picker__iframe { width: 100%; height: 100%; border: 0; }
    .map-picker__hint { font-size: 0.75rem; color: var(--color-text-secondary); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapPicker {
  readonly label = input<string>('Ubicación (Google Maps)');
  readonly currentUrl = input<string | null>(null);
  readonly urlChanged = output<string>();

  readonly urlValue = signal<string>('');

  ngOnInit(): void {
    const initial = this.currentUrl();
    if (initial) this.urlValue.set(initial);
  }

  onUrlChange(value: string): void {
    this.urlValue.set(value);
    this.urlChanged.emit(value);
  }

  onOpenMaps(): void {
    window.open('https://www.google.com/maps', '_blank');
  }

  embedUrl(): string {
    const url = this.urlValue();
    if (!url) return '';
    // Convert Google Maps URL to embed format
    if (url.includes('google.com/maps')) {
      // Extract coordinates or place from the URL
      const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (match) {
        return `https://maps.google.com/maps?q=${match[1]},${match[2]}&output=embed`;
      }
      // Try place-based URL
      const placeMatch = url.match(/place\/([^/]+)/);
      if (placeMatch) {
        return `https://maps.google.com/maps?q=${encodeURIComponent(placeMatch[1])}&output=embed`;
      }
    }
    // Fallback: try using it directly as embed
    return `https://maps.google.com/maps?q=${encodeURIComponent(url)}&output=embed`;
  }
}
