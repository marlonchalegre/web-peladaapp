import type { MatchEvent } from "../../../shared/api/endpoints";
import { getInitials as getSharedInitials } from "../../../shared/utils/initials";

export const POSITION_ORDER: Record<string, number> = {
  goalkeeper: 0,
  goleiro: 0,
  goleira: 0,
  gk: 0,
  g: 0,
  defender: 1,
  zagueiro: 1,
  zagueira: 1,
  df: 1,
  zag: 1,
  z: 1,
  midfielder: 2,
  meia: 2,
  "meio-campo": 2,
  mf: 2,
  mei: 2,
  m: 2,
  striker: 3,
  atacante: 3,
  st: 3,
  ata: 3,
  a: 3,
};

export const POSITION_CODE_MAP: Record<string, string> = {
  goalkeeper: "G",
  goleiro: "G",
  goleira: "G",
  gk: "G",
  g: "G",
  defender: "Z",
  zagueiro: "Z",
  zagueira: "Z",
  df: "Z",
  zag: "Z",
  z: "Z",
  midfielder: "M",
  meia: "M",
  "meio-campo": "M",
  mf: "M",
  mei: "M",
  m: "M",
  striker: "A",
  atacante: "A",
  st: "A",
  ata: "A",
  a: "A",
};

export function getPlayerPositionCode(player?: SortablePlayer | null): string {
  if (!player) return "?";
  if (player.isGoalkeeper ?? player.is_goalkeeper) return "G";
  const pos = getPlayerPosition(player).trim().toLowerCase();
  return POSITION_CODE_MAP[pos] ?? "?";
}

export interface SortablePlayer {
  id?: string;
  position?: string | null;
  user_position?: string | null;
  is_goalkeeper?: boolean;
  isGoalkeeper?: boolean;
  name?: string;
  user?: { name?: string; position?: string | null };
}

/**
 * Resolves a player's position from player model, user profile, or snake_case payload.
 */
export function getPlayerPosition(player?: SortablePlayer | null): string {
  if (!player) return "";
  return player.position || player.user_position || player.user?.position || "";
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

  const rawPosA = getPlayerPosition(a);
  const rawPosB = getPlayerPosition(b);
  const posA = POSITION_ORDER[rawPosA.trim().toLowerCase()] ?? 4;
  const posB = POSITION_ORDER[rawPosB.trim().toLowerCase()] ?? 4;
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

/**
 * Returns 1-2 uppercase initials for a given player name.
 */
export function getPlayerInitials(name?: string | null): string {
  if (!name) return "";
  const trimmed = name.trim();
  if (!trimmed) return "";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export const AVATAR_BG_COLORS = [
  "#dcd3bd",
  "#c9d9cd",
  "#d8d2c4",
  "#cfd8cd",
  "#cdd6e0",
  "#d3cfc4",
  "#e2cfc7",
];

/**
 * Returns first two initials for a given name.
 */
export function getInitials(name?: string | null, fallback = "JG"): string {
  return getSharedInitials(name, fallback);
}

/**
 * Formats a football position code to a localized pt-BR label.
 */
const CANONICAL_POSITIONS = [
  "goleiro",
  "zagueiro",
  "meia",
  "atacante",
] as const;

export function formatPosition(pos?: string | null, fallback = "meia"): string {
  if (!pos) return fallback;
  const rank = POSITION_ORDER[pos.trim().toLowerCase()];
  if (rank !== undefined && rank in CANONICAL_POSITIONS) {
    return CANONICAL_POSITIONS[rank];
  }
  return pos.toLowerCase();
}

/**
 * Returns the localized position label directly from a player object.
 */
export function formatPlayerPosition(
  player?: SortablePlayer | null,
  fallback = "meia",
): string {
  return formatPosition(getPlayerPosition(player), fallback);
}

/**
 * Deduplicates an array of items with an `id` property, preserving order.
 */
export function distinctById<T extends { id: string }>(
  items?: T[] | null,
): T[] {
  if (!items) return [];
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

/**
 * Checks whether a player member type is considered a monthly member (mensalista or mensalista_temporario).
 */
export function isMensalista(memberType?: string | null): boolean {
  return memberType === "mensalista" || memberType === "mensalista_temporario";
}

/**
 * Formats a player's member type to an uppercase display label.
 */
export function formatMemberType(
  memberType?: string | null,
  t?: (key: string, defaultVal?: string) => string,
): string {
  if (isMensalista(memberType)) {
    return t
      ? t("common.member_types.mensalista", "MENSALISTA").toUpperCase()
      : "MENSALISTA";
  }
  switch (memberType) {
    case "convidado":
      return t
        ? t("common.member_types.convidado", "CONVIDADO").toUpperCase()
        : "CONVIDADO";
    case "diarista":
    case "diarista_temporario":
    default:
      return t
        ? t("common.member_types.diarista", "DIARISTA").toUpperCase()
        : "DIARISTA";
  }
}

/**
 * Computes a Set of player IDs who have paid their diarista fee in a single pass.
 */
export function getPaidPlayerIds(
  transactions?: Array<{
    type?: string | null;
    category?: string | null;
    status?: string | null;
    player_id?: string | null;
  }> | null,
): Set<string> {
  const ids = new Set<string>();
  if (!transactions) return ids;
  for (const tx of transactions) {
    if (
      tx.type === "income" &&
      tx.category === "diarista_fee" &&
      tx.status === "paid" &&
      tx.player_id
    ) {
      ids.add(tx.player_id);
    }
  }
  return ids;
}
