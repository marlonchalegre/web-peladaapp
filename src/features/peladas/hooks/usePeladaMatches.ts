import { useState, useMemo } from "react";
import { usePeladaData } from "./usePeladaData";
import { usePeladaStandings } from "./usePeladaStandings";
import { useMatchActions } from "./useMatchActions";

export function usePeladaMatches(peladaId: number) {
  const data = usePeladaData(peladaId);
  const {
    loading,
    error,
    setError,
    matches,
    setMatches,
    matchesRef,
    teams,
    pelada,
    setPelada,
    teamPlayers,
    lineupsByMatch,
    orgPlayerIdToUserId,
    userIdToName,
    orgPlayerIdToPlayer,
    matchEvents,
    playerStatsFromApi,
    refreshData,
  } = data;

  const standingsData = usePeladaStandings(
    matches,
    teams,
    matchEvents,
    playerStatsFromApi,
    teamPlayers,
    lineupsByMatch,
    orgPlayerIdToUserId,
    userIdToName,
  );

  const actions = useMatchActions(
    peladaId,
    matchesRef,
    setMatches,
    setPelada,
    refreshData,
    setError,
  );

  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);

  const handleEndMatch = async (matchId: number) => {
    await actions.endMatch(matchId);
    // Find next scheduled match using matchesRef (which has the latest data after refresh)
    const nextMatch = matchesRef.current.find((m) => m.status === "scheduled");
    if (nextMatch) {
      setSelectedMatchId(nextMatch.id);
    }
  };

  // Auto-select first match or the first scheduled match if nothing is selected
  if (!selectedMatchId && matches.length > 0) {
    const firstScheduled = matches.find((m) => m.status === "scheduled");
    setSelectedMatchId(firstScheduled ? firstScheduled.id : matches[0].id);
  }

  const selectedMatch = useMemo(
    () => matches.find((m) => m.id === selectedMatchId),
    [matches, selectedMatchId],
  );

  const currentMatchStats = useMemo(() => {
    if (!selectedMatchId) return {};
    const filteredEvents = matchEvents.filter(
      (e) => e.match_id === selectedMatchId,
    );

    // Using simple internal calculation for current match stats UI
    const counts: Record<
      number,
      { goals: number; assists: number; ownGoals: number }
    > = {};
    for (const evt of filteredEvents) {
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
  }, [matchEvents, selectedMatchId]);

  const activeMatchData = useMemo(() => {
    if (!selectedMatch) return null;
    const lu = lineupsByMatch[selectedMatch.id] || {};
    const homePlayers =
      lu[selectedMatch.home_team_id] ||
      teamPlayers[selectedMatch.home_team_id] ||
      [];
    const awayPlayers =
      lu[selectedMatch.away_team_id] ||
      teamPlayers[selectedMatch.away_team_id] ||
      [];
    const lineupIds = new Set(
      [...homePlayers, ...awayPlayers].map((p) => p.player_id),
    );
    const benchPlayers = Object.values(orgPlayerIdToPlayer).filter(
      (p) => !lineupIds.has(p.id),
    );
    const finished = (selectedMatch.status || "").toLowerCase() === "finished";

    return { homePlayers, awayPlayers, benchPlayers, finished };
  }, [selectedMatch, lineupsByMatch, teamPlayers, orgPlayerIdToPlayer]);

  const isPeladaClosed = ["closed", "voting"].includes(
    (pelada?.status || "").toLowerCase(),
  );

  return {
    loading,
    error,
    matches,
    selectedMatchId,
    setSelectedMatchId,
    pelada,
    teamPlayers,
    lineupsByMatch,
    orgPlayerIdToUserId,
    userIdToName,
    orgPlayerIdToPlayer,
    matchEvents,
    updatingScore: actions.updatingScore,
    selectMenu: actions.selectMenu,
    setSelectMenu: actions.setSelectMenu,
    playerSort: standingsData.playerSort,
    standings: standingsData.standings,
    playerStats: standingsData.playerStats,
    teamNameById: useMemo(() => {
      const m: Record<number, string> = {};
      for (const t of teams) m[t.id] = t.name;
      return m;
    }, [teams]),
    currentMatchStats,
    allOrgPlayers: useMemo(
      () => Object.values(orgPlayerIdToPlayer),
      [orgPlayerIdToPlayer],
    ),
    selectedMatch,
    activeMatchData,
    isPeladaClosed,
    closing: actions.closing,
    handleClosePelada: () => actions.handleClosePelada(isPeladaClosed),
    refreshStats: refreshData,
    replacePlayerOnMatchTeam: actions.replacePlayerOnMatchTeam,
    adjustScore: actions.adjustScore,
    recordEvent: actions.recordEvent,
    deleteEventAndRefresh: actions.deleteEventAndRefresh,
    addPlayerToTeam: actions.addPlayerToTeam,
    endMatch: handleEndMatch,
    togglePlayerSort: standingsData.togglePlayerSort,
  };
}
