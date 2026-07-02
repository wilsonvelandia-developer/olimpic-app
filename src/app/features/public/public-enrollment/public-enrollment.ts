import { Component, ChangeDetectionStrategy, inject, signal, input, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { PublicApiService } from '../public-api.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import type { Tournament } from '../../../core/models/tournament.model';

/**
 * Public team enrollment form.
 * Allows teams to self-register for a tournament without authentication.
 * The organizer approves/rejects enrollments from the admin panel.
 */
@Component({
  selector: 'app-public-enrollment',
  imports: [ReactiveFormsModule],
  templateUrl: './public-enrollment.html',
  styleUrl: './public-enrollment.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicEnrollment implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly publicApi = inject(PublicApiService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly tournamentId = input.required<string>();

  readonly tournament = signal<Tournament | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly isSaving = signal<boolean>(false);
  readonly success = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    teamName:     ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    shortName:    ['', [Validators.maxLength(10)]],
    contactName:  ['', [Validators.required, Validators.minLength(3)]],
    contactPhone: ['', [Validators.required]],
    contactEmail: ['', [Validators.email]],
    players:      this.fb.array([] as ReturnType<typeof this.createPlayerGroup>[]),
  });

  ngOnInit(): void {
    this.publicApi.get<Tournament>(`/tournaments/${this.tournamentId()}`).subscribe({
      next: (t) => { this.tournament.set(t); this.isLoading.set(false); },
      error: () => { this.errorMessage.set('Torneo no encontrado'); this.isLoading.set(false); },
    });

    // Start with 6 player slots
    for (let i = 0; i < 6; i++) {
      this.addPlayer();
    }
  }

  get players(): FormArray {
    return this.form.get('players') as FormArray;
  }

  createPlayerGroup() {
    return this.fb.group({
      name:         ['', [Validators.required, Validators.minLength(2)]],
      jerseyNumber: [null as number | null, [Validators.required, Validators.min(0)]],
      position:     [''],
    });
  }

  addPlayer(): void {
    this.players.push(this.createPlayerGroup());
  }

  removePlayer(index: number): void {
    if (this.players.length > 1) {
      this.players.removeAt(index);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSaving.set(true);
    this.errorMessage.set(null);

    const v = this.form.value;
    const payload = {
      tournamentId: this.tournamentId(),
      teamName:     v.teamName,
      shortName:    v.shortName || null,
      contactName:  v.contactName,
      contactPhone: v.contactPhone,
      contactEmail: v.contactEmail || null,
      players:      v.players?.filter((p: Record<string, unknown>) => p && (p['name'] as string)?.trim()).map((p: Record<string, unknown>) => ({
        name:         p['name'],
        jerseyNumber: p['jerseyNumber'],
        position:     p['position'] || null,
      })),
    };

    // Use the public enrollment endpoint (no auth needed)
    this.http.post(`${environment.apiBaseUrl}/public/tournaments/${this.tournamentId()}/enroll`, payload)
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.success.set(true);
        },
        error: (err) => {
          const msg = err?.error?.message ?? 'Error al enviar la inscripción';
          this.errorMessage.set(msg);
          this.isSaving.set(false);
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/p/tournament', this.tournamentId()]);
  }
}
