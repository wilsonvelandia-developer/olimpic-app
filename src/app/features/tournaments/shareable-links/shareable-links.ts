import { Component, ChangeDetectionStrategy, input, signal } from '@angular/core';

interface ShareableLink {
  label: string;
  description: string;
  url: string;
  icon: string;
}

/**
 * Shareable Links — displays copyable public URLs for a tournament.
 * Allows organizers to easily share enrollment links, public views, etc.
 */
@Component({
  selector: 'app-shareable-links',
  templateUrl: './shareable-links.html',
  styleUrl: './shareable-links.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareableLinks {
  readonly tournamentId = input.required<string>();
  readonly tournamentName = input<string>('');

  readonly copiedIndex = signal<number | null>(null);

  get links(): ShareableLink[] {
    const id = this.tournamentId();
    const base = window.location.origin;
    return [
      {
        label: 'Torneo público',
        description: 'Fixture, posiciones, resultados y partidos en vivo',
        url: `${base}/p/tournament/${id}`,
        icon: '🏆',
      },
      {
        label: 'Inscripción de equipos',
        description: 'Formulario para que clubes inscriban sus equipos y jugadores',
        url: `${base}/p/tournament/${id}/enroll`,
        icon: '📋',
      },
    ];
  }

  async copyLink(index: number): Promise<void> {
    const link = this.links[index];
    try {
      await navigator.clipboard.writeText(link.url);
      this.copiedIndex.set(index);
      setTimeout(() => this.copiedIndex.set(null), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = link.url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.copiedIndex.set(index);
      setTimeout(() => this.copiedIndex.set(null), 2000);
    }
  }

  shareLink(index: number): void {
    const link = this.links[index];
    if (navigator.share) {
      navigator.share({
        title: `${this.tournamentName()} — ${link.label}`,
        url: link.url,
      }).catch(() => { /* user cancelled */ });
    } else {
      this.copyLink(index);
    }
  }
}
