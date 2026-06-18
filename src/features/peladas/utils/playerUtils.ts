import type { User } from "../../../shared/api/endpoints";

export const POSITION_ORDER: Record<string, number> = {
  goalkeeper: 0,
  defender: 1,
  midfielder: 2,
  striker: 3,
};

/**
 * Sorts players by their football position (GK -> DF -> MF -> ST).
 * Manual goalkeeper overrides (is_goalkeeper property) take absolute precedence.
 * If positions are identical, players are sorted alphabetically by name.
 */
export function sortPlayersByPosition<
  T extends { user: User; is_goalkeeper?: boolean },
>(players: T[]): T[] {
  return [...players].sort((a, b) => {
    // 1. Manual goalkeeper override (highest priority)
    if (a.is_goalkeeper && !b.is_goalkeeper) return -1;
    if (!a.is_goalkeeper && b.is_goalkeeper) return 1;

    // 2. Standard position order
    const posA = POSITION_ORDER[(a.user?.position || "").toLowerCase()] ?? 4;
    const posB = POSITION_ORDER[(b.user?.position || "").toLowerCase()] ?? 4;

    if (posA !== posB) {
      return posA - posB;
    }

    // 3. Alphabetical name sort (tie-breaker)
    const nameA = a.user?.name || "";
    const nameB = b.user?.name || "";
    return nameA.localeCompare(nameB);
  });
}

/**
 * Resolves which team a player belongs to in a specific match.
 * Priority:
 * 1. Current match lineup for the match
 * 2. Original drafted team (fallback)
 * 3. Global team mapping (fallback, if it matches one of the match teams)
 */
export function getPlayerTeamInMatch(
  playerId: string,
  matchId: string,
  match: { home_team_id: string; away_team_id: string },
  lineupsByMatch?: Record<string, Record<string, { player_id: string }[]>>,
  teamPlayers?: Record<string, { player_id: string }[]>,
  orgPlayerIdToTeamId?: Record<string, string>,
): string | null {
  if (!playerId) return null;

  // 1. Check match lineup first (check if player is in the lineupsByMatch for this match)
  if (lineupsByMatch && lineupsByMatch[matchId]) {
    const matchLineup = lineupsByMatch[matchId];
    if (
      matchLineup[match.home_team_id]?.some((p) => p.player_id === playerId)
    ) {
      return match.home_team_id;
    }
    if (
      matchLineup[match.away_team_id]?.some((p) => p.player_id === playerId)
    ) {
      return match.away_team_id;
    }
  }

  // 2. Fallback to TeamPlayers (original drafted teams) if player is listed under either team playing in this match
  if (teamPlayers) {
    if (
      teamPlayers[match.home_team_id]?.some((p) => p.player_id === playerId)
    ) {
      return match.home_team_id;
    }
    if (
      teamPlayers[match.away_team_id]?.some((p) => p.player_id === playerId)
    ) {
      return match.away_team_id;
    }
  }

  // 3. Fallback to global map if available, but only if it matches one of the teams playing
  if (orgPlayerIdToTeamId && orgPlayerIdToTeamId[playerId]) {
    const globalTeamId = orgPlayerIdToTeamId[playerId];
    if (
      globalTeamId === match.home_team_id ||
      globalTeamId === match.away_team_id
    ) {
      return globalTeamId;
    }
  }

  return null;
}
