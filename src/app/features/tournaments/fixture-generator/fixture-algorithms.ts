import type { FixtureTeam, FixtureSlot, FixtureConfig } from './fixture.model';

/**
 * Pure fixture generation algorithms.
 * No Angular dependencies — fully testable in isolation.
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function toDateTimeLocal(isoDate: string): string {
  return `${isoDate}T15:00:00`;
}

// ─── Round Robin ──────────────────────────────────────────────────────────────

/**
 * Generates a round-robin fixture using the "circle method".
 * Supports odd number of teams (adds a BYE placeholder).
 * Supports two-legged tournaments (home/away swap for second leg).
 */
export function generateRoundRobin(config: FixtureConfig): FixtureSlot[] {
  const slots: FixtureSlot[] = [];
  let teams = [...config.teams];

  // Pad to even number with a BYE
  const hasBye = teams.length % 2 !== 0;
  if (hasBye) {
    teams = [...teams, { id: 'BYE', name: 'BYE' }];
  }

  const n = teams.length;
  const rounds = n - 1;
  const matchesPerRound = n / 2;

  const generateLeg = (legLabel: string, legStartDate: string, swapHomeAway: boolean) => {
    let currentDate = legStartDate;
    const fixed = teams[0];
    const rotating = teams.slice(1);

    for (let r = 0; r < rounds; r++) {
      const roundTeams = [fixed, ...rotating];
      const roundLabel = `${legLabel} - Jornada ${r + 1}`;

      for (let m = 0; m < matchesPerRound; m++) {
        const home = roundTeams[m];
        const away = roundTeams[n - 1 - m];

        // Skip BYE matches
        if (home.id === 'BYE' || away.id === 'BYE') continue;

        const [homeTeam, awayTeam] = swapHomeAway ? [away, home] : [home, away];

        slots.push({
          round: roundLabel,
          homeTeamId:   homeTeam.id,
          homeTeamName: homeTeam.name,
          awayTeamId:   awayTeam.id,
          awayTeamName: awayTeam.name,
          scheduledAt:  toDateTimeLocal(currentDate),
          venue:        config.venue,
        });
      }

      // Rotate all except the fixed team
      rotating.unshift(rotating.pop()!);
      currentDate = addDays(currentDate, config.daysBetweenRounds);
    }
  };

  generateLeg('Vuelta 1', config.startDate, false);

  if (config.twoLegs) {
    const secondLegStart = addDays(
      config.startDate,
      rounds * config.daysBetweenRounds + config.daysBetweenRounds,
    );
    generateLeg('Vuelta 2', secondLegStart, true);
  }

  return slots;
}

// ─── Single Elimination ───────────────────────────────────────────────────────

/**
 * Generates a single elimination bracket.
 * Teams are seeded in order. Bracket size is the next power of 2 >= team count.
 * BYE slots are inserted for teams that advance without playing (when count is not a power of 2).
 */
export function generateSingleElimination(config: FixtureConfig): FixtureSlot[] {
  const slots: FixtureSlot[] = [];
  const teams = [...config.teams];

  // Next power of 2
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(teams.length)));

  // Pad with BYEs
  while (teams.length < bracketSize) {
    teams.push({ id: `BYE-${teams.length}`, name: 'BYE' });
  }

  const roundNames = getRoundNames(bracketSize);
  let currentRoundTeams = teams;
  let currentDate = config.startDate;
  let roundIndex = 0;

  while (currentRoundTeams.length > 1) {
    const nextRound: FixtureTeam[] = [];
    const roundLabel = roundNames[roundIndex] ?? `Ronda ${roundIndex + 1}`;

    for (let i = 0; i < currentRoundTeams.length; i += 2) {
      const home = currentRoundTeams[i];
      const away = currentRoundTeams[i + 1];

      if (home.id !== 'BYE' && away.id !== 'BYE') {
        slots.push({
          round: roundLabel,
          homeTeamId:   home.id,
          homeTeamName: home.name,
          awayTeamId:   away.id,
          awayTeamName: away.name,
          scheduledAt:  toDateTimeLocal(currentDate),
          venue:        config.venue,
        });
        // Winner TBD — placeholder for next round
        nextRound.push({ id: `TBD-${i}`, name: `Ganador ${roundLabel} P${i / 2 + 1}` });
      } else if (home.id !== 'BYE') {
        nextRound.push(home);
      } else if (away.id !== 'BYE') {
        nextRound.push(away);
      }
    }

    currentRoundTeams = nextRound;
    currentDate = addDays(currentDate, config.daysBetweenRounds);
    roundIndex++;
  }

  return slots;
}

// ─── Groups + Knockout ────────────────────────────────────────────────────────

/**
 * Generates a groups phase + knockout phase fixture.
 * Teams are distributed evenly into groups. Each group plays round-robin.
 * Knockout phase is generated with placeholder names (top 2 from each group).
 */
export function generateGroupsKnockout(config: FixtureConfig): FixtureSlot[] {
  const slots: FixtureSlot[] = [];
  const teams = [...config.teams];
  const numGroups = Math.max(2, Math.floor(teams.length / 4));
  const groups: FixtureTeam[][] = Array.from({ length: numGroups }, () => []);

  // Distribute teams snake-style for balance
  teams.forEach((team, i) => {
    const groupIdx = i % numGroups;
    groups[groupIdx].push(team);
  });

  // Group phase — round-robin per group
  let currentDate = config.startDate;
  groups.forEach((groupTeams, gi) => {
    const groupLabel = String.fromCharCode(65 + gi); // A, B, C...
    const groupSlots = generateRoundRobin({
      ...config,
      teams: groupTeams,
      startDate: currentDate,
      twoLegs: false,
    });

    groupSlots.forEach((slot) => {
      slots.push({ ...slot, round: `Grupo ${groupLabel} - ${slot.round}` });
    });

    // Advance knockout start date past group phase
    const groupRounds = groupTeams.length - 1 + (groupTeams.length % 2 !== 0 ? 0 : 0);
    currentDate = addDays(currentDate, groupRounds * config.daysBetweenRounds + config.daysBetweenRounds);
  });

  // Knockout phase — using placeholder teams (top 2 per group)
  const knockoutTeams: FixtureTeam[] = [];
  groups.forEach((_, gi) => {
    const label = String.fromCharCode(65 + gi);
    knockoutTeams.push({ id: `G${label}-1`, name: `1° Grupo ${label}` });
    knockoutTeams.push({ id: `G${label}-2`, name: `2° Grupo ${label}` });
  });

  const knockoutSlots = generateSingleElimination({
    ...config,
    teams: knockoutTeams,
    startDate: currentDate,
  });

  slots.push(...knockoutSlots);
  return slots;
}

// ─── Entry point ──────────────────────────────────────────────────────────────

/**
 * Main fixture generation function.
 * Dispatches to the correct algorithm based on tournament format.
 */
export function generateFixture(config: FixtureConfig): FixtureSlot[] {
  switch (config.format) {
    case 'round_robin':
      return generateRoundRobin(config);
    case 'single_elimination':
    case 'double_elimination':
      return generateSingleElimination(config);
    case 'groups_knockout':
      return generateGroupsKnockout(config);
    default:
      return generateRoundRobin(config);
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function getRoundNames(bracketSize: number): string[] {
  const names: string[] = [];
  let size = bracketSize;
  while (size > 1) {
    if (size === 2) names.push('Final');
    else if (size === 4) names.push('Semifinal');
    else if (size === 8) names.push('Cuartos de final');
    else if (size === 16) names.push('Octavos de final');
    else names.push(`Ronda de ${size}`);
    size /= 2;
  }
  return names.reverse();
}
