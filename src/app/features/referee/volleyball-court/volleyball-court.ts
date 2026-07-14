import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';

export interface CourtPlayer {
  playerId: string;
  jerseyNumber: number;
  name: string;
  position: number; // 1-6
  isCaptain?: boolean;
  isLibero?: boolean;
}

export interface CourtState {
  homePlayers: CourtPlayer[];
  awayPlayers: CourtPlayer[];
  homeColor: string;
  awayColor: string;
  servingTeam: 'home' | 'away';
}

/**
 * Volleyball court visualization — 2D top-down view showing both teams.
 * Displays player positions (zones 1-6) with jersey numbers.
 * Highlights which team has the serve.
 * Positions follow FIVB standard:
 *   Front row: 4 - 3 - 2 (left to right facing net)
 *   Back row:  5 - 6 - 1 (left to right facing net)
 */
@Component({
  selector: 'app-volleyball-court',
  template: `
    <div class="court-container">
      <!-- Layout: Serve(left) | Court | Bench(right) -->
      <div class="court-layout">
        <!-- Left: Serve indicator — bottom dot = side A (away half), top dot = side B (home half) -->
        <div class="court-left-side">
          <div class="serve-indicator">
            <span class="serve-dot" [class.serve-dot--active]="state().servingTeam === 'away'"></span>
            <span class="serve-icon">🏐</span>
            <span class="serve-dot" [class.serve-dot--active]="state().servingTeam === 'home'"></span>
          </div>
        </div>

        <!-- Center: Court -->
        <div class="court">
          <!-- Home side (Side B = top) -->
          <div class="court-half court-half--home">
            <div class="court-zones">
              @for (zone of [1, 6, 5]; track zone) {
                <div class="court-zone" [attr.data-zone]="zone">
                  @if (getPlayer('home', zone); as player) {
                    <div class="player-icon" [style.background]="getColor('home')"
                      [class.player-icon--captain]="player.isCaptain"
                      [class.player-icon--libero]="player.isLibero">
                      <span class="player-icon__number">{{ player.jerseyNumber }}</span>
                    </div>
                  }
                  <span class="zone-label">{{ zone }}</span>
                </div>
              }
              @for (zone of [2, 3, 4]; track zone) {
                <div class="court-zone" [attr.data-zone]="zone">
                  @if (getPlayer('home', zone); as player) {
                    <div class="player-icon" [style.background]="getColor('home')"
                      [class.player-icon--captain]="player.isCaptain"
                      [class.player-icon--libero]="player.isLibero">
                      <span class="player-icon__number">{{ player.jerseyNumber }}</span>
                    </div>
                  }
                  <span class="zone-label">{{ zone }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Net -->
          <div class="court-net">
            <span class="court-net__line"></span>
          </div>

          <!-- Away side (Side A = bottom) -->
          <div class="court-half court-half--away">
            <div class="court-zones">
              @for (zone of [4, 3, 2]; track zone) {
                <div class="court-zone" [attr.data-zone]="zone">
                  @if (getPlayer('away', zone); as player) {
                    <div class="player-icon" [style.background]="getColor('away')"
                      [class.player-icon--captain]="player.isCaptain"
                      [class.player-icon--libero]="player.isLibero">
                      <span class="player-icon__number">{{ player.jerseyNumber }}</span>
                    </div>
                  }
                  <span class="zone-label">{{ zone }}</span>
                </div>
              }
              @for (zone of [5, 6, 1]; track zone) {
                <div class="court-zone" [attr.data-zone]="zone">
                  @if (getPlayer('away', zone); as player) {
                    <div class="player-icon" [style.background]="getColor('away')"
                      [class.player-icon--captain]="player.isCaptain"
                      [class.player-icon--libero]="player.isLibero">
                      <span class="player-icon__number">{{ player.jerseyNumber }}</span>
                    </div>
                  }
                  <span class="zone-label">{{ zone }}</span>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Right side: Home bench (top) + Away bench (bottom) -->
        <div class="court-right-side">
          <div class="court-bench court-bench--home">
            @for (sub of homeSubs(); track sub.playerId) {
              <div class="bench-player" [style.background]="getColor('home')">
                <span class="bench-player__num">{{ sub.jerseyNumber }}</span>
              </div>
            }
          </div>
          <div class="court-bench court-bench--away">
            @for (sub of awaySubs(); track sub.playerId) {
              <div class="bench-player" [style.background]="getColor('away')">
                <span class="bench-player__num">{{ sub.jerseyNumber }}</span>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    .court-container { display: flex; flex-direction: column; width: 100%; height: 100%; }

    /* Main layout: serve(left) | court | bench(right) */
    .court-layout {
      display: flex;
      align-items: stretch;
      gap: 0.25rem;
      height: 100%;
    }

    /* Left side: serve indicator */
    .court-left-side {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.125rem;
    }

    /* Court — fills available height */
    .court {
      flex: 1;
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 4px;
      overflow: hidden;
      background: #1a4b2e;
      display: flex;
      flex-direction: column;
      min-width: 80px;
    }

    .court-half { padding: 0.375rem; flex: 1; display: flex; align-items: stretch; }
    .court-half--home { background: linear-gradient(180deg, #1a5c33 0%, #1a4b2e 100%); }
    .court-half--away { background: linear-gradient(0deg, #1a5c33 0%, #1a4b2e 100%); }

    .court-zones {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(2, 1fr);
      gap: 0.2rem;
      width: 100%;
      height: 100%;
    }

    .court-zone {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 0.1rem; position: relative;
    }
    /* .zone-label {
      font-size: 0.45rem; color: rgba(255,255,255,0.3); position: absolute;
      bottom: 0; right: 2px;
      transform: rotate(-90deg);
    } */
    .zone-label {
      font-size: 4rem;
      color: rgb(255 255 255 / 11%);
      position: absolute;
      transform: rotate(-90deg);
      font-weight: bold;
      z-index: 10;
    }

    /* Net */
    .court-net {
      display: flex; align-items: center; padding: 0 0.25rem;
      height: 3px; background: #0f3320; flex-shrink: 0;
    }
    .court-net__line { flex: 1; height: 2px; background: #fbbf24; }

    /* Player icons — responsive size */
    .player-icon {
      width: clamp(20px, 4vw, 30px);
      height: clamp(20px, 4vw, 30px);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 700;
      font-size: clamp(0.55rem, 1.2vw, 0.75rem);
      border: 2px solid rgba(255,255,255,0.5);
      transition: transform 0.3s ease;
    }
    .player-icon--captain { border-color: #fbbf24; box-shadow: 0 0 4px #fbbf24; }
    .player-icon--libero { border-style: dashed; opacity: 0.85; }
    .player-icon__number { line-height: 1; transform: rotate(-90deg); }

    /* Right side: benches aligned to their court halves */
    .court-right-side {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 0.125rem;
    }

    /* Bench columns */
    .court-bench {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.2rem;
      padding: 0.125rem;
    }

    .bench-player {
      width: clamp(18px, 3vw, 24px);
      height: clamp(18px, 3vw, 24px);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 600;
      border: 1px solid rgba(255,255,255,0.4);
    }
    .bench-player__num {
      font-size: clamp(0.45rem, 1vw, 0.6rem);
      line-height: 1;
      transform: rotate(-90deg);
    }

    /* Serve indicator */
    .serve-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.2rem;
    }
    .serve-dot { width: 8px; height: 8px; border-radius: 50%; background: #4b5563; transition: background 0.3s; }
    .serve-dot--active { background: #10b981; box-shadow: 0 0 5px #10b981; }
    .serve-icon { font-size: 0.7rem; transform: rotate(-90deg); }

    @media (max-width: 480px) {
      .player-icon { width: 20px; height: 20px; font-size: 0.55rem; }
      .court-zones { gap: 0.15rem; }
      .court-half { padding: 0.25rem; }
      .bench-player { width: 16px; height: 16px; }
      .bench-player__num { font-size: 0.4rem; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VolleyballCourt {
  readonly state = input.required<CourtState>();
  readonly homeLabel = input<string>('Local');
  readonly awayLabel = input<string>('Visitante');
  readonly homeSubs = input<CourtPlayer[]>([]);
  readonly awaySubs = input<CourtPlayer[]>([]);

  getPlayer(side: 'home' | 'away', zone: number): CourtPlayer | undefined {
    const players = side === 'home' ? this.state().homePlayers : this.state().awayPlayers;
    return players.find((p) => p.position === zone);
  }

  /** Returns team color with fallback defaults. */
  getColor(side: 'home' | 'away'): string {
    if (side === 'home') return this.state().homeColor || '#1e40af';
    return this.state().awayColor || '#dc2626';
  }
}
