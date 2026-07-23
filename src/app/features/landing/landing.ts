import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CurrencyPipe } from '@angular/common';
import { environment } from '../../../environments/environment';

interface Plan {
  id: string;
  slug: string;
  name: string;
  priceCop: number;
  maxTeamsPerTournament: number;
  maxActiveTournaments: number;
  maxVenues: number;
  features: Record<string, boolean>;
  displayOrder: number;
}

/**
 * Landing page — public commercial page shown to visitors.
 * Displays features, pricing plans, and CTAs to login/register.
 */
@Component({
  selector: 'app-landing',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly plans = signal<Plan[]>([]);

  ngOnInit(): void {
    this.http
      .get<{ data: Plan[] }>(`${environment.apiBaseUrl}/public/plans/available`)
      .subscribe({
        next: (res) => this.plans.set(res.data ?? []),
        error: () => {},
      });
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  goToContact(): void {
    window.open('https://wa.me/573001234567?text=Hola, me interesa OlimpicApp', '_blank');
  }

  featureLabel(key: string): string {
    const labels: Record<string, string> = {
      chat: 'Chat en tiempo real (equipos y organizador)',
      gallery: 'Galería de fotos y videos por torneo',
      analytics: 'Dashboard de analytics y métricas avanzadas',
      pdf: 'Exportar planillas, fixture y posiciones en PDF',
      publicEnrollment: 'Inscripción pública online (link compartible)',
      notifications: 'Notificaciones push a jugadores y entrenadores',
      customBranding: 'Logo y colores personalizados del torneo',
      multiCup: 'Multi-copa (Oro, Plata, Bronce) + bracket visual',
    };
    return labels[key] ?? key;
  }

  planFeatures(plan: Plan): Array<{ label: string; included: boolean }> {
    return Object.entries(plan.features).map(([key, value]) => ({
      label: this.featureLabel(key),
      included: value as boolean,
    }));
  }

  formatLimit(value: number): string {
    return value === 0 ? 'Ilimitados' : String(value);
  }
}
