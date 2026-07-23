import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

type RoleSection = 'admin' | 'organizer' | 'referee' | 'coach' | 'player' | 'parent' | 'public';

/**
 * Help Center — role-based documentation page.
 * Shows step-by-step guides for each profile with visual references.
 * Accessible publicly at /ayuda (no auth required).
 */
@Component({
  selector: 'app-help',
  templateUrl: './help.html',
  styleUrl: './help.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Help {
  readonly activeSection = signal<RoleSection>('organizer');

  readonly sections: Array<{ id: RoleSection; label: string; icon: string }> = [
    { id: 'admin', label: 'Administrador', icon: '🛡️' },
    { id: 'organizer', label: 'Organizador de torneos', icon: '🏆' },
    { id: 'referee', label: 'Árbitro / Juez', icon: '👨‍⚖️' },
    { id: 'coach', label: 'Entrenador / DT', icon: '📋' },
    { id: 'player', label: 'Jugador', icon: '🏃' },
    { id: 'parent', label: 'Padre / Acudiente', icon: '👨‍👧' },
    { id: 'public', label: 'Público general', icon: '👀' },
  ];

  setSection(id: RoleSection): void {
    this.activeSection.set(id);
  }
}
