import type { MatchEvent } from "../../../shared/api/endpoints";

export const POSITION_ORDER: Record<string, number> = {
  goalkeeper: 0,
  defender: 1,
  midfielder: 2,
  striker: 3,
};

export interface SortablePlayer {
  position?: string | null;
  user_position?: string | null;
  is_goalkeeper?: boolean;
  isGoalkeeper?: boolean;
  name?: string;
  user?: { name?: string; position?: string };
}

/**
 * Compares two players by football position (GK -> DF -> MF -> ST),
 * with manual goalkeeper overrides taking precedence, and name as tie-breaker.
 */
export function comparePlayersByPosition(
  a: SortablePlayer,
  b: SortablePlayer,
): number {
  const isGkA = a.isGoalkeeper ?? a.is_goalkeeper ?? false;
  const isGkB = b.isGoalkeeper ?? b.is_goalkeeper ?? false;
  if (isGkA && !isGkB) return -1;
  if (!isGkA && isGkB) return 1;

  const rawPosA = a.position || a.user_position || a.user?.position || "";
  const rawPosB = b.position || b.user_position || b.user?.position || "";
  const posA = POSITION_ORDER[rawPosA.toLowerCase()] ?? 4;
  const posB = POSITION_ORDER[rawPosB.toLowerCase()] ?? 4;
  if (posA !== posB) return posA - posB;

  const nameA = a.name || a.user?.name || "";
  const nameB = b.name || b.user?.name || "";
  return nameA.localeCompare(nameB);
}

/**
 * Sorts players by their football position (GK -> DF -> MF -> ST).
 * Manual goalkeeper overrides (is_goalkeeper property) take absolute precedence.
 * If positions are identical, players are sorted alphabetically by name.
 */
export function sortPlayersByPosition<T extends SortablePlayer>(
  players: T[],
): T[] {
  return [...players].sort(comparePlayersByPosition);
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

/**
 * Checks whether an event is the assist associated with a given goal.
 * Matches by parent_event_id or identical session and match timestamps.
 */
export function isAssistForGoal(
  assist: Pick<
    MatchEvent,
    "parent_event_id" | "session_time_ms" | "match_time_ms"
  >,
  goal: Pick<MatchEvent, "id" | "session_time_ms" | "match_time_ms">,
): boolean {
  if (assist.parent_event_id) {
    return assist.parent_event_id === goal.id;
  }
  return (
    assist.session_time_ms === goal.session_time_ms &&
    assist.match_time_ms === goal.match_time_ms
  );
}

/**
 * Resolves a player's display name from available lookup dictionaries.
 */
export function resolvePlayerName(
  playerId: string,
  orgPlayerIdToPlayer?: Record<string, { user_name?: string }>,
  orgPlayerIdToUserId?: Record<string, string>,
  userIdToName?: Record<string, string>,
  fallback = `Player #${playerId}`,
): string {
  const orgPlayer = orgPlayerIdToPlayer?.[playerId];
  if (orgPlayer?.user_name) return orgPlayer.user_name;
  const userId = orgPlayerIdToUserId?.[playerId];
  if (userId && userIdToName?.[userId]) return userIdToName[userId];
  return fallback;
}

/**
 * Extracts a player ID from an attendance record supporting various property casing.
 */
export function getAttendancePlayerId(att: {
  player_id?: string;
  "player-id"?: string;
  playerId?: string;
  id?: string;
}): string | undefined {
  return att.player_id ?? att["player-id"] ?? att.playerId ?? att.id;
}

/**
 * Resolves the matching assist event for a given goal event in a single pass.
 * Priority:
 * 1. Direct parent_event_id match (immediate return)
 * 2. Simultaneous assist events (prefers same-team candidate if goalTeamId is provided)
 */
export function findMatchingAssistForGoal(
  goal:
    | Pick<
        MatchEvent,
        "id" | "match_id" | "event_type" | "session_time_ms" | "match_time_ms"
      >
    | null
    | undefined,
  events: MatchEvent[],
  goalTeamId?: string | null,
  orgPlayerIdToTeamId?: Record<string, string>,
): MatchEvent | null {
  if (!goal || goal.event_type !== "goal") return null;

  let fallbackCandidate: MatchEvent | null = null;
  let sameTeamCandidate: MatchEvent | null = null;

  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (e.match_id !== goal.match_id || e.event_type !== "assist") continue;

    if (e.parent_event_id === goal.id) return e;

    if (
      !e.parent_event_id &&
      e.session_time_ms === goal.session_time_ms &&
      e.match_time_ms === goal.match_time_ms
    ) {
      if (!fallbackCandidate) fallbackCandidate = e;
      if (
        goalTeamId &&
        orgPlayerIdToTeamId &&
        orgPlayerIdToTeamId[e.player_id] === goalTeamId
      ) {
        sameTeamCandidate = e;
      }
    }
  }

  return sameTeamCandidate || fallbackCandidate;
}
