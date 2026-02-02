import { useMemo, useState } from "react";
import {
  type Match,
  type Team,
  type MatchEvent,
  type PlayerStats,
  type TeamPlayer,
} from "../../../shared/api/endpoints";
import { type StandingRow } from "../components/StandingsPanel";
import { type PlayerStatRow } from "../components/PlayerStatsPanel";

type PlayerStatCounts = { goals: number; assists: number; ownGoals: number };

function aggregateStatsFromEvents(
  events: MatchEvent[],
): Record<number, PlayerStatCounts> {
  const counts: Record<number, PlayerStatCounts> = {};
  for (const evt of events) {
    const current = counts[evt.player_id] ?? {
      goals: 0,
      assists: 0,
      ownGoals: 0,
    };
    if (evt.event_type === "goal") current.goals += 1;
    else if (evt.event_type === "assist") current.assists += 1;
    else if (evt.event_type === "own_goal") current.ownGoals += 1;
    counts[evt.player_id] = current;
  }
  return counts;
}

function statsMapFromApi(
  stats: PlayerStats[] | null,
): Record<number, PlayerStatCounts> {
  const map: Record<number, PlayerStatCounts> = {};
  if (!stats) return map;
  for (const s of stats) {
    map[s.player_id] = {
      goals: s.goals,
      assists: s.assists,
      ownGoals: s.own_goals,
    };
  }
  return map;
}

export function usePeladaStandings(
  matches: Match[],
  teams: Team[],
  matchEvents: MatchEvent[],
  playerStatsFromApi: PlayerStats[] | null,
  teamPlayers: Record<number, TeamPlayer[]>,
  lineupsByMatch: Record<number, Record<number, TeamPlayer[]>>,
  orgPlayerIdToUserId: Record<number, number>,
  userIdToName: Record<number, string>,
) {
  const [playerSort, setPlayerSort] = useState<{
    by: "default" | "goals" | "assists";
    dir: "asc" | "desc";
  }>({ by: "default", dir: "desc" });

  const standings = useMemo(() => {
    const table: Record<number, StandingRow & { goalsFor: number }> = {};
    for (const t of teams)
      table[t.id] = {
        teamId: t.id,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        name: t.name,
      };
    for (const m of matches) {
      const hs = m.home_score ?? 0;
      const as = m.away_score ?? 0;
      if (!(m.home_team_id in table) || !(m.away_team_id in table)) continue;
      if ((m.status || "").toLowerCase() !== "finished") continue;

      table[m.home_team_id].goalsFor += hs;
      table[m.away_team_id].goalsFor += as;
      if (hs === as) {
        table[m.home_team_id].draws += 1;
        table[m.away_team_id].draws += 1;
      } else if (hs > as) {
        table[m.home_team_id].wins += 1;
        table[m.away_team_id].losses += 1;
      } else {
        table[m.home_team_id].losses += 1;
        table[m.away_team_id].wins += 1;
      }
    }
    return Object.values(table).sort(
      (a, b) => b.wins - a.wins || b.draws - a.draws || b.goalsFor - a.goalsFor,
    );
  }, [teams, matches]);

  const statsMap = useMemo(() => {
    let sm = statsMapFromApi(playerStatsFromApi);
    if (Object.keys(sm).length === 0 && matchEvents.length > 0) {
      sm = aggregateStatsFromEvents(matchEvents);
    }
    return sm;
  }, [playerStatsFromApi, matchEvents]);

  const playerStats = useMemo<PlayerStatRow[]>(() => {
    const participatingIds = new Set<number>();
    for (const list of Object.values(teamPlayers)) {
      for (const tp of list || []) participatingIds.add(tp.player_id);
    }
    for (const pidStr of Object.keys(statsMap))
      participatingIds.add(Number(pidStr));

    const matchesPlayedMap: Record<number, number> = {};
    for (const m of matches) {
      if ((m.status || "").toLowerCase() !== "finished") continue;
      const lu = lineupsByMatch[m.id];
      if (!lu) continue;
      const playersInMatch = new Set<number>();
      for (const list of Object.values(lu)) {
        for (const tp of list) playersInMatch.add(tp.player_id);
      }
      for (const pid of playersInMatch) {
        matchesPlayedMap[pid] = (matchesPlayedMap[pid] || 0) + 1;
      }
    }

    const stats: PlayerStatRow[] = [];
    for (const playerId of participatingIds) {
      const userId = orgPlayerIdToUserId[playerId];
      const name =
        userId !== undefined && userIdToName[userId]
          ? userIdToName[userId]
          : `Player #${playerId}`;
      const base = statsMap[playerId];
      stats.push({
        playerId,
        name,
        goals: base?.goals || 0,
        assists: base?.assists || 0,
        ownGoals: base?.ownGoals || 0,
        matchesPlayed: matchesPlayedMap[playerId] || 0,
      });
    }

    const dirMul = playerSort.dir === "desc" ? -1 : 1;
    if (playerSort.by === "goals") {
      stats.sort((a, b) => {
        if (a.goals !== b.goals) return (a.goals - b.goals) * dirMul;
        if (a.assists !== b.assists) return (a.assists - b.assists) * -1;
        return a.name.localeCompare(b.name);
      });
    } else if (playerSort.by === "assists") {
      stats.sort((a, b) => {
        if (a.assists !== b.assists) return (a.assists - b.assists) * dirMul;
        if (a.goals !== b.goals) return (a.goals - b.goals) * -1;
        return a.name.localeCompare(b.name);
      });
    } else {
      stats.sort(
        (a, b) =>
          b.goals + b.assists - b.ownGoals - (a.goals + a.assists - a.ownGoals),
      );
    }
    return stats;
  }, [
    statsMap,
    teamPlayers,
    matches,
    lineupsByMatch,
    orgPlayerIdToUserId,
    userIdToName,
    playerSort,
  ]);

  function togglePlayerSort(by: "goals" | "assists") {
    setPlayerSort((prev) =>
      prev.by === by
        ? { by, dir: prev.dir === "desc" ? "asc" : "desc" }
        : { by, dir: "desc" },
    );
  }

  return {
    standings,
    playerStats,
    playerSort,
    togglePlayerSort,
    statsMap,
  };
}
