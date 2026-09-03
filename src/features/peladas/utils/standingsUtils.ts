import type { Match } from "../../../shared/api/endpoints";

export type StandingRow = {
  teamId: string;
  name: string;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points?: number;
};

export function getStandingPoints(
  row: Pick<StandingRow, "wins" | "draws" | "points">,
): number {
  return row.points ?? row.wins * 3 + row.draws;
}

export function isAbsoluteTie(a: StandingRow, b: StandingRow): boolean {
  return (
    getStandingPoints(a) === getStandingPoints(b) &&
    a.goalDifference === b.goalDifference &&
    a.goalsFor === b.goalsFor
  );
}

/**
 * Calculates whether a team has mathematically secured 1st place (champion).
 *
 * During an in-progress pelada (matches remaining):
 * A team is the mathematical champion if in EVERY possible future scenario
 * of the remaining matches, no other team can finish with >= candidate's points.
 *
 * When all matches are finished:
 * The winner is determined by points, then Goal Difference (GD), then Goals For (GF).
 */
export function getMathematicalChampion(
  standings: StandingRow[],
  matches?: Match[],
): StandingRow | null {
  if (!standings || standings.length === 0) return null;
  const first = standings[0];

  if (first.wins === 0 && first.draws === 0) return null;
  if (standings.length === 1) return first;

  if (!matches || matches.length === 0) {
    return isAbsoluteTie(first, standings[1]) ? null : first;
  }

  // Single-pass partition into finished and unfinished matches
  const finishedMatches: Match[] = [];
  const unfinishedMatches: Match[] = [];
  for (const m of matches) {
    if ((m.status || "").toLowerCase() === "finished") {
      finishedMatches.push(m);
    } else {
      unfinishedMatches.push(m);
    }
  }

  if (unfinishedMatches.length === 0) {
    return isAbsoluteTie(first, standings[1]) ? null : first;
  }

  // Map team IDs to 0-based indices for zero-allocation primitive array lookups
  const teamCount = standings.length;
  const teamIdToIndex = new Map<string, number>();
  for (let i = 0; i < teamCount; i++) {
    teamIdToIndex.set(standings[i].teamId, i);
  }

  const initialPoints = new Int16Array(teamCount);
  for (const m of finishedMatches) {
    const homeIdx = teamIdToIndex.get(m.home_team_id);
    const awayIdx = teamIdToIndex.get(m.away_team_id);
    if (homeIdx === undefined || awayIdx === undefined) continue;

    const hs = m.home_score ?? 0;
    const as = m.away_score ?? 0;
    if (hs > as) {
      initialPoints[homeIdx] += 3;
    } else if (as > hs) {
      initialPoints[awayIdx] += 3;
    } else {
      initialPoints[homeIdx] += 1;
      initialPoints[awayIdx] += 1;
    }
  }

  const candidateIdx = teamIdToIndex.get(first.teamId) ?? 0;
  if (
    initialPoints[candidateIdx] === 0 &&
    first.wins === 0 &&
    first.draws === 0
  ) {
    return null;
  }

  // Permutation simulation for up to 7 remaining matches (3^7 = 2,187 combinations)
  if (unfinishedMatches.length <= 7) {
    const matchPairs: [number, number][] = [];
    for (const m of unfinishedMatches) {
      const h = teamIdToIndex.get(m.home_team_id);
      const a = teamIdToIndex.get(m.away_team_id);
      if (h !== undefined && a !== undefined) {
        matchPairs.push([h, a]);
      }
    }

    const pairCount = matchPairs.length;
    const numOutcomes = Math.pow(3, pairCount);
    const simPoints = new Int16Array(teamCount);

    for (let i = 0; i < numOutcomes; i++) {
      let code = i;
      simPoints.set(initialPoints);

      for (let j = 0; j < pairCount; j++) {
        const outcome = code % 3;
        code = Math.floor(code / 3);
        const [h, a] = matchPairs[j];

        if (outcome === 0) {
          simPoints[h] += 3;
        } else if (outcome === 1) {
          simPoints[h] += 1;
          simPoints[a] += 1;
        } else {
          simPoints[a] += 3;
        }
      }

      const candidateScore = simPoints[candidateIdx];
      for (let t = 0; t < teamCount; t++) {
        if (t !== candidateIdx && simPoints[t] >= candidateScore) {
          return null;
        }
      }
    }

    return first;
  }

  // Fallback O(M + T) upper-bound check when > 7 unfinished matches
  const remainingCount = new Int16Array(teamCount);
  for (const m of unfinishedMatches) {
    const h = teamIdToIndex.get(m.home_team_id);
    const a = teamIdToIndex.get(m.away_team_id);
    if (h !== undefined) remainingCount[h]++;
    if (a !== undefined) remainingCount[a]++;
  }

  const candidateLocked = initialPoints[candidateIdx];
  for (let t = 0; t < teamCount; t++) {
    if (t === candidateIdx) continue;
    if (initialPoints[t] + remainingCount[t] * 3 >= candidateLocked) {
      return null;
    }
  }

  return first;
}
