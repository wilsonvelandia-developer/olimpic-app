import {
  Component, ChangeDetectionStrategy, input, output,
  inject, signal, computed, OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import type { PlayerOption } from '../scorer-select/scorer-select';

export interface TeamPlayers {
  teamId: string;
  teamName: string;
  players: PlayerOption[];
}

export interface LineupPlayer {
  playerId: string;
  isStarter: boolean;
  isCaptain: boolean;
  isGoalkeeper: boolean;
  isLibero: boolean;
  volleyballZone: number | null;
}

export interface MatchSetupResult {
  coinTossWinnerTeamId: string | null;
  fieldSideHome: string | null;
  fieldSideAway: string | null;
  firstServeTeamId: string | null;
  homeLineup: LineupPlayer[];
  awayLineup: LineupPlayer[];
}

/**
 * Match setup wizard — shown before the match starts.
 * Steps:
 * 1. Coin toss (who won, field side, first serve)
 * 2. Home team lineup (starters, captain, goalkeeper/libero, volleyball zones)
 * 3. Away team lineup
 */
@Component({
  selector: 'app-match-setup',
  imports: [FormsModule, NgTemplateOutlet],
  templateUrl: './match-setup.html',
  styleUrl: './match-setup.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchSetup implements OnInit {
  private readonly api = inject(ApiService);

  readonly matchId = input.required<string>();
  readonly homeTeam = input.required<TeamPlayers>();
  readonly awayTeam = input.required<TeamPlayers>();
  readonly hasSets = input<boolean>(false);
  readonly sportSlug = input<string>('football');
  readonly playersPerTeam = input<number>(11);
  readonly visible = input<boolean>(false);

  readonly completed = output<MatchSetupResult>();
  readonly closed = output<void>();

  // ── Wizard state ──────────────────────────────────────────────────────────
  readonly currentStep = signal<1 | 2 | 3>(1);

  // Step 1: Coin toss
  readonly coinTossWinner = signal<string | null>(null);
  readonly fieldSideHome = signal<string | null>(null);
  readonly firstServeTeamId = signal<string | null>(null);

  // Step 2 & 3: Lineups
  readonly homeStarters = signal<Set<string>>(new Set());
  readonly homeCaptain = signal<string | null>(null);
  readonly homeGoalkeeper = signal<string | null>(null);
  readonly homeLibero = signal<string | null>(null);
  readonly homeZones = signal<Map<string, number>>(new Map());

  readonly awayStarters = signal<Set<string>>(new Set());
  readonly awayCaptain = signal<string | null>(null);
  readonly awayGoalkeeper = signal<string | null>(null);
  readonly awayLibero = signal<string | null>(null);
  readonly awayZones = signal<Map<string, number>>(new Map());

  // ── Computed ──────────────────────────────────────────────────────────────
  readonly isVolleyball = computed(() => this.sportSlug() === 'volleyball');
  readonly isFootball = computed(() => this.sportSlug() === 'football');
  readonly requiredStarters = computed(() => this.playersPerTeam());

  readonly homeStarterCount = computed(() => this.homeStarters().size);
  readonly awayStarterCount = computed(() => this.awayStarters().size);

  readonly canGoToStep2 = computed(() => true); // coin toss is optional
  readonly canGoToStep3 = computed(() => this.homeStarterCount() === this.requiredStarters());
  readonly canFinish = computed(() => this.awayStarterCount() === this.requiredStarters());

  ngOnInit(): void {
    // Default coin toss winner to home
    this.coinTossWinner.set(this.homeTeam().teamId);
    this.firstServeTeamId.set(this.homeTeam().teamId);
  }

  // ── Step navigation ───────────────────────────────────────────────────────

  nextStep(): void {
    const step = this.currentStep();
    if (step === 1) this.currentStep.set(2);
    else if (step === 2) this.currentStep.set(3);
  }

  prevStep(): void {
    const step = this.currentStep();
    if (step === 3) this.currentStep.set(2);
    else if (step === 2) this.currentStep.set(1);
  }

  // ── Step 1: Coin toss ─────────────────────────────────────────────────────

  setCoinTossWinner(teamId: string): void {
    this.coinTossWinner.set(teamId);
  }

  setFieldSideHome(side: string): void {
    this.fieldSideHome.set(side);
    this.signal_fieldSideAway(side === 'A' ? 'B' : 'A');
  }

  private signal_fieldSideAway(side: string): void {
    // fieldSideAway is derived from home
  }

  setFirstServe(teamId: string): void {
    this.firstServeTeamId.set(teamId);
  }

  // ── Step 2 & 3: Lineup management ────────────────────────────────────────

  toggleStarter(side: 'home' | 'away', playerId: string): void {
    const starters = side === 'home' ? this.homeStarters() : this.awayStarters();
    const newSet = new Set(starters);
    if (newSet.has(playerId)) {
      newSet.delete(playerId);
      // Clear roles if removed as starter
      if (side === 'home') {
        if (this.homeCaptain() === playerId) this.homeCaptain.set(null);
        if (this.homeGoalkeeper() === playerId) this.homeGoalkeeper.set(null);
        if (this.homeLibero() === playerId) this.homeLibero.set(null);
        const zones = new Map(this.homeZones());
        zones.delete(playerId);
        this.homeZones.set(zones);
      } else {
        if (this.awayCaptain() === playerId) this.awayCaptain.set(null);
        if (this.awayGoalkeeper() === playerId) this.awayGoalkeeper.set(null);
        if (this.awayLibero() === playerId) this.awayLibero.set(null);
        const zones = new Map(this.awayZones());
        zones.delete(playerId);
        this.awayZones.set(zones);
      }
    } else {
      const max = this.requiredStarters();
      if (newSet.size >= max) return; // can't add more
      newSet.add(playerId);
    }
    if (side === 'home') this.homeStarters.set(newSet);
    else this.awayStarters.set(newSet);
  }

  setCaptain(side: 'home' | 'away', playerId: string): void {
    if (side === 'home') this.homeCaptain.set(playerId);
    else this.awayCaptain.set(playerId);
  }

  setGoalkeeper(side: 'home' | 'away', playerId: string): void {
    if (side === 'home') this.homeGoalkeeper.set(playerId);
    else this.awayGoalkeeper.set(playerId);
  }

  setLibero(side: 'home' | 'away', playerId: string): void {
    if (side === 'home') this.homeLibero.set(playerId);
    else this.awayLibero.set(playerId);
  }

  setZone(side: 'home' | 'away', playerId: string, zone: number): void {
    const zones = side === 'home' ? new Map(this.homeZones()) : new Map(this.awayZones());
    // Remove any player already in this zone
    for (const [pid, z] of zones) {
      if (z === zone && pid !== playerId) zones.delete(pid);
    }
    zones.set(playerId, zone);
    if (side === 'home') this.homeZones.set(zones);
    else this.awayZones.set(zones);
  }

  isStarter(side: 'home' | 'away', playerId: string): boolean {
    const starters = side === 'home' ? this.homeStarters() : this.awayStarters();
    return starters.has(playerId);
  }

  getZone(side: 'home' | 'away', playerId: string): number | null {
    const zones = side === 'home' ? this.homeZones() : this.awayZones();
    return zones.get(playerId) ?? null;
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  finish(): void {
    const homeLineup = this.buildLineup('home');
    const awayLineup = this.buildLineup('away');

    const fieldSideHome = this.fieldSideHome();

    this.completed.emit({
      coinTossWinnerTeamId: this.coinTossWinner(),
      fieldSideHome,
      fieldSideAway: fieldSideHome === 'A' ? 'B' : fieldSideHome === 'B' ? 'A' : null,
      firstServeTeamId: this.firstServeTeamId(),
      homeLineup,
      awayLineup,
    });
  }

  private buildLineup(side: 'home' | 'away'): LineupPlayer[] {
    const team = side === 'home' ? this.homeTeam() : this.awayTeam();
    const starters = side === 'home' ? this.homeStarters() : this.awayStarters();
    const captain = side === 'home' ? this.homeCaptain() : this.awayCaptain();
    const goalkeeper = side === 'home' ? this.homeGoalkeeper() : this.awayGoalkeeper();
    const libero = side === 'home' ? this.homeLibero() : this.awayLibero();
    const zones = side === 'home' ? this.homeZones() : this.awayZones();

    return team.players.map((p) => ({
      playerId: p.id,
      isStarter: starters.has(p.id),
      isCaptain: captain === p.id,
      isGoalkeeper: goalkeeper === p.id,
      isLibero: libero === p.id,
      volleyballZone: zones.get(p.id) ?? null,
    }));
  }
}
