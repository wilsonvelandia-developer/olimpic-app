import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
  imports: [CurrencyPipe],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly plans = signal<Plan[]>([
    // Fallback estático — se actualiza con datos de la API cuando está disponible
    {
      id: '1', slug: 'basic', name: 'Básico', priceCop: 49900, displayOrder: 1,
      maxTeamsPerTournament: 8, maxActiveTournaments: 1, maxVenues: 1,
      features: { chat: false, gallery: false, analytics: false, pdf: true, publicEnrollment: false, notifications: false, customBranding: false, multiCup: false },
    },
    {
      id: '2', slug: 'professional', name: 'Profesional', priceCop: 149900, displayOrder: 2,
      maxTeamsPerTournament: 20, maxActiveTournaments: 3, maxVenues: 3,
      features: { chat: false, gallery: true, analytics: true, pdf: true, publicEnrollment: true, notifications: true, customBranding: false, multiCup: true },
    },
    {
      id: '3', slug: 'premium', name: 'Premium', priceCop: 299900, displayOrder: 3,
      maxTeamsPerTournament: 32, maxActiveTournaments: 0, maxVenues: 0,
      features: { chat: true, gallery: true, analytics: true, pdf: true, publicEnrollment: true, notifications: true, customBranding: true, multiCup: true },
    },
  ]);

  ngOnInit(): void {
    // Try to load plans from API (overrides fallback if successful)
    this.http
      .get<{ data: Plan[] }>(`${environment.apiBaseUrl}/public/plans`)
      .subscribe({
        next: (res) => { if (res.data?.length) this.plans.set(res.data); },
        error: () => { /* keep fallback static plans */ },
      });
  }

  goToLogin(): void {
    window.open('/auth/login', '_blank');
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
