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
