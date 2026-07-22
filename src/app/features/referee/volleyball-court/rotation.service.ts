import { Injectable, signal, computed } from '@angular/core';
import type { CourtPlayer } from './volleyball-court';

/**
 * Volleyball rotation service — manages serve tracking, automatic rotation,
 * side assignment, and set transitions.
 *
 * Rules:
 * - Set 1: sides and serve come from the setup (coin toss)
 * - Set 2: sides swap, serve goes to the team that did NOT serve first in set 1
 * - Set 3/5 (decisive): new toss required for serve and side
 * - Within a set: serving team scores → no rotation; receiving team scores → they gain serve + rotate clockwise
 * - Rotation: Z2→Z1, Z1→Z6, Z6→Z5, Z5→Z4, Z4→Z3, Z3→Z2
 */
@Injectable()
export class RotationService {
  /** Which team currently has serve */
  readonly servingTeam = signal<'home' | 'away'>('home');

  /** Current positions on court for each team */
  readonly homePositions = signal<CourtPlayer[]>([]);
  readonly awayPositions = signal<CourtPlayer[]>([]);

  /** Which team is on side A (bottom of court) and side B (top) */
  readonly sideATeam = signal<'home' | 'away'>('home');

  /** Rotation count per team in current set */
  readonly homeRotations = signal<number>(0);
  readonly awayRotations = signal<number>(0);

  /** Current set number (1-based) */
  readonly currentSet = signal<number>(1);

  /** Track who served FIRST in set 1 (for alternation logic) */
  private firstSetFirstServe: 'home' | 'away' = 'home';

  /** Track who served first in each set */
  private setServeHistory: Array<'home' | 'away'> = [];

  /** Initial lineup (saved for reset at start of each set) */
  private initialHomeLineup: CourtPlayer[] = [];
  private initialAwayLineup: CourtPlayer[] = [];

  /** Whether a decisive set re-toss is needed */
  readonly needsDecisiveToss = signal<boolean>(false);

  /** Sets to win (for detecting decisive set) */
  private setsToWin = 3;

  /** Match ID for persistence */
  private matchId: string = '';

  // ── Persistence ─────────────────────────────────────────────────────────

  /**
   * Saves the current rotation state to localStorage.
   * Called after every state change (point, rotation, substitution, set end).
   */
  saveState(): void {
    if (!this.matchId) return;
    const state = {
      homePositions: this.homePositions(),
      awayPositions: this.awayPositions(),
      servingTeam: this.servingTeam(),
      sideATeam: this.sideATeam(),
      homeRotations: this.homeRotations(),
      awayRotations: this.awayRotations(),
      currentSet: this.currentSet(),
      firstSetFirstServe: this.firstSetFirstServe,
      setServeHistory: this.setServeHistory,
      initialHomeLineup: this.initialHomeLineup,
      initialAwayLineup: this.initialAwayLineup,
      setsToWin: this.setsToWin,
    };
    try {
      localStorage.setItem(`rotation_${this.matchId}`, JSON.stringify(state));
    } catch { /* storage full or unavailable */ }
  }

  /**
   * Restores rotation state from localStorage.
   * @returns true if state was restored, false if no saved state found.
   */
  restoreState(matchId: string): boolean {
    this.matchId = matchId;
    try {
      const raw = localStorage.getItem(`rotation_${matchId}`);
      if (!raw) return false;

      const state = JSON.parse(raw) as {
        homePositions: CourtPlayer[];
        awayPositions: CourtPlayer[];
        servingTeam: 'home' | 'away';
        sideATeam: 'home' | 'away';
        homeRotations: number;
        awayRotations: number;
        currentSet: number;
        firstSetFirstServe: 'home' | 'away';
        setServeHistory: Array<'home' | 'away'>;
        initialHomeLineup: CourtPlayer[];
        initialAwayLineup: CourtPlayer[];
        setsToWin: number;
      };

      this.homePositions.set(state.homePositions);
      this.awayPositions.set(state.awayPositions);
      this.servingTeam.set(state.servingTeam);
      this.sideATeam.set(state.sideATeam);
      this.homeRotations.set(state.homeRotations);
      this.awayRotations.set(state.awayRotations);
      this.currentSet.set(state.currentSet);
      this.firstSetFirstServe = state.firstSetFirstServe;
      this.setServeHistory = state.setServeHistory;
      this.initialHomeLineup = state.initialHomeLineup;
      this.initialAwayLineup = state.initialAwayLineup;
      this.setsToWin = state.setsToWin;
      this.needsDecisiveToss.set(false);

      return true;
    } catch {
      return false;
    }
  }

  /** Clears saved state (call when match finishes). */
  clearState(): void {
    if (this.matchId) {
      localStorage.removeItem(`rotation_${this.matchId}`);
    }
  }

  /**
   * Initializes the rotation state from match setup.
   * @param homePlayers - initial lineup with positions (from setup)
   * @param awayPlayers - initial lineup with positions (from setup)
   * @param firstServe - who serves first (from coin toss)
   * @param sideATeamId - which team starts on side A (bottom) — 'home' or 'away'
   * @param setsToWin - number of sets to win match (default 3)
   */
  initialize(
    homePlayers: CourtPlayer[],
    awayPlayers: CourtPlayer[],
    firstServe: 'home' | 'away',
    sideA: 'home' | 'away' = 'home',
    setsToWin: number = 3,
  ): void {
    // Save initial lineups for reset between sets
    this.initialHomeLineup = homePlayers.map((p) => ({ ...p }));
    this.initialAwayLineup = awayPlayers.map((p) => ({ ...p }));

    this.homePositions.set([...homePlayers]);
    this.awayPositions.set([...awayPlayers]);
    this.servingTeam.set(firstServe);
    this.sideATeam.set(sideA);
    this.homeRotations.set(0);
    this.awayRotations.set(0);
    this.currentSet.set(1);
    this.setsToWin = setsToWin;
    this.needsDecisiveToss.set(false);

    // Track serve history
    this.firstSetFirstServe = firstServe;
    this.setServeHistory = [firstServe];

    this.saveState();
  }

  /**
   * Called when a point is scored.
   * @param scoringTeam - team that won the rally
   * @returns true if a rotation occurred
   */
  onPointScored(scoringTeam: 'home' | 'away'): boolean {
    const serving = this.servingTeam();

    if (scoringTeam === serving) {
      // Serving team scored → no rotation
      this.saveState();
      return false;
    } else {
      // Receiving team scored → they gain serve + rotate
      this.servingTeam.set(scoringTeam);
      this.rotateTeam(scoringTeam);
      this.saveState();
      return true;
    }
  }

  /**
   * Called when a set ends. Handles:
   * - Side swap
   * - Serve alternation
   * - Rotation reset to initial positions
   * - Decisive set detection
   * @param homeSetsWon - current sets won by home
   * @param awaySetsWon - current sets won by away
   */
  onSetEnd(homeSetsWon: number, awaySetsWon: number): void {
    const nextSet = this.currentSet() + 1;
    this.currentSet.set(nextSet);

    // Check if next set is decisive (both at setsToWin - 1)
    const isDecisive = homeSetsWon === this.setsToWin - 1 && awaySetsWon === this.setsToWin - 1;

    if (isDecisive) {
      // Decisive set: needs new toss
      this.needsDecisiveToss.set(true);
      // Don't auto-swap — wait for toss result via applyDecisiveToss()
    } else {
      // Normal set transition: swap sides
      this.sideATeam.update((current) => current === 'home' ? 'away' : 'home');

      // Serve goes to the team that did NOT serve first in the previous set
      const previousSetFirstServe = this.setServeHistory[this.setServeHistory.length - 1];
      const nextServe: 'home' | 'away' = previousSetFirstServe === 'home' ? 'away' : 'home';
      this.servingTeam.set(nextServe);
      this.setServeHistory.push(nextServe);
    }

    // Reset rotations to initial positions
    this.homePositions.set(this.initialHomeLineup.map((p) => ({ ...p })));
    this.awayPositions.set(this.initialAwayLineup.map((p) => ({ ...p })));
    this.homeRotations.set(0);
    this.awayRotations.set(0);

    this.saveState();
  }

  /**
   * Apply the result of a decisive set re-toss.
   * @param serve - who serves in the decisive set
   * @param sideA - who starts on side A in the decisive set
   */
  applyDecisiveToss(serve: 'home' | 'away', sideA: 'home' | 'away'): void {
    this.needsDecisiveToss.set(false);
    this.servingTeam.set(serve);
    this.sideATeam.set(sideA);
    this.setServeHistory.push(serve);

    // Reset positions
    this.homePositions.set(this.initialHomeLineup.map((p) => ({ ...p })));
    this.awayPositions.set(this.initialAwayLineup.map((p) => ({ ...p })));
    this.homeRotations.set(0);
    this.awayRotations.set(0);

    this.saveState();
  }

  /**
   * Mid-set side swap (in decisive set at 8 points for set-to-15).
   * Only swaps sides, does NOT change serve or rotation.
   */
  midSetSwap(): void {
    this.sideATeam.update((current) => current === 'home' ? 'away' : 'home');
  }

  /** Handles a substitution in the rotation. */
  substitute(team: 'home' | 'away', outPlayerId: string, inPlayer: CourtPlayer): void {
    const positions = team === 'home' ? this.homePositions : this.awayPositions;
    const current = positions();
    const outIdx = current.findIndex((p) => p.playerId === outPlayerId);
    if (outIdx === -1) return;

    const zone = current[outIdx].position;
    const updated = [...current];
    updated[outIdx] = { ...inPlayer, position: zone };
    positions.set(updated);
    this.saveState();
  }

  /**
   * Undo last point — reverses the serve change AND rotation if one occurred.
   */
  undoLastPoint(teamThatScored: 'home' | 'away'): void {
    const serving = this.servingTeam();

    if (serving === teamThatScored) {
      // This team gained serve from the last point → undo: reverse rotation + return serve
      this.reverseRotateTeam(teamThatScored);
      const otherTeam: 'home' | 'away' = teamThatScored === 'home' ? 'away' : 'home';
      this.servingTeam.set(otherTeam);
    }
    this.saveState();
  }

  /**
   * Manual rotation: rotate the team clockwise (forward).
   */
  manualRotateForward(team: 'home' | 'away'): void {
    this.rotateTeam(team);
    this.saveState();
  }

  /**
   * Manual rotation: rotate the team counter-clockwise (backward).
   */
  manualRotateBackward(team: 'home' | 'away'): void {
    this.reverseRotateTeam(team);
    this.saveState();
  }

  /**
   * Performs rotation for a team when they gain serve.
   * Side B (home/top): 1→6, 6→5, 5→4, 4→3, 3→2, 2→1 (clockwise)
   * Side A (away/bottom): 1→6, 6→5, 5→4, 4→3, 3→2, 2→1 (clockwise)
   */
  private rotateTeam(team: 'home' | 'away'): void {
    const positions = team === 'home' ? this.homePositions : this.awayPositions;
    const rotations = team === 'home' ? this.homeRotations : this.awayRotations;

    const current = positions();
    const rotated = current.map((player) => ({
      ...player,
      position: this.nextPositionClockwise(player.position),
    }));

    positions.set(rotated);
    rotations.update((r) => r + 1);
  }

  /**
   * Reverses a rotation (undo). Moves positions in the opposite direction.
   */
  private reverseRotateTeam(team: 'home' | 'away'): void {
    const positions = team === 'home' ? this.homePositions : this.awayPositions;
    const rotations = team === 'home' ? this.homeRotations : this.awayRotations;

    const current = positions();
    const reversed = current.map((player) => ({
      ...player,
      position: this.nextPositionCounterClockwise(player.position),
    }));

    positions.set(reversed);
    rotations.update((r) => Math.max(0, r - 1));
  }

  /** Clockwise: 1→6, 6→5, 5→4, 4→3, 3→2, 2→1 */
  private nextPositionClockwise(current: number): number {
    const map: Record<number, number> = { 1: 6, 6: 5, 5: 4, 4: 3, 3: 2, 2: 1 };
    return map[current] ?? current;
  }

  /** Counter-clockwise: 1→2, 2→3, 3→4, 4→5, 5→6, 6→1 */
  private nextPositionCounterClockwise(current: number): number {
    const map: Record<number, number> = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 1 };
    return map[current] ?? current;
  }
}
