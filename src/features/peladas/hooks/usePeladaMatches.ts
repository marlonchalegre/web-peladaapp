import { useState, useMemo } from "react";
import { usePeladaData } from "./usePeladaData";
import { usePeladaStandings } from "./usePeladaStandings";
import { useMatchActions } from "./useMatchActions";

export function usePeladaMatches(peladaId: number) {
  const data = usePeladaData(peladaId);
  const {
    loading,
    error,
    matches,
    matchesRef,
    teams,
    pelada,
    teamPlayers,
    lineupsByMatch,
    orgPlayerIdToUserId,
    userIdToName,
    orgPlayerIdToPlayer,
    matchEvents,
    playerStatsFromApi,
    attendance,
    peladaTransactions,
    organizationFinance,
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

  const actions = useMatchActions(peladaId, data);

  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [justFinishedMatchId, setJustFinishedMatchId] = useState<number | null>(
    null,
  );

  const handleEndMatch = async (matchId: number) => {
    await actions.executeEndMatch(matchId);
    setJustFinishedMatchId(matchId);

    // If no more matches are scheduled or running, stop all timers
    const hasMoreMatches = matchesRef.current.some(
      (m) =>
        m.id !== matchId &&
        (m.status === "scheduled" || m.status === "running"),
    );

    if (!hasMoreMatches) {
      try {
        await actions.pauseMatchTimer(matchId);
        if (pelada?.timer_status === "running") {
          await actions.pausePeladaTimer();
        }
      } catch (err) {
        console.error("Failed to stop timers after last match:", err);
      }
    }
  };

  const proceedToNextMatch = async () => {
    const nextMatch = matchesRef.current.find((m) => m.status === "scheduled");
    if (nextMatch) {
      setSelectedMatchId(nextMatch.id);

      // Auto-start timers
      try {
        // Start match timer
        await actions.startMatchTimer(nextMatch.id);

        // Start pelada timer if it's not running
        if (pelada?.timer_status !== "running") {
          await actions.startPeladaTimer();
        }
      } catch (err) {
        console.error("Failed to auto-start timers:", err);
      }
    }
    setJustFinishedMatchId(null);
  };

  // Auto-select match if nothing is selected:
  // Priority: Running > Scheduled > First Available
  if (!selectedMatchId && matches.length > 0) {
    const running = matches.find((m) => m.status === "running");
    if (running) {
      setSelectedMatchId(running.id);
    } else {
      const firstScheduled = matches.find((m) => m.status === "scheduled");
      setSelectedMatchId(firstScheduled ? firstScheduled.id : matches[0].id);
    }
  }

  const selectedMatch = useMemo(
    () => matches.find((m) => m.id === selectedMatchId),
    [matches, selectedMatchId],
  );

  const justFinishedMatch = useMemo(
    () => matches.find((m) => m.id === justFinishedMatchId),
    [matches, justFinishedMatchId],
  );

  const nextScheduledMatch = useMemo(
    () => matches.find((m) => m.status === "scheduled"),
    [matches],
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

    const confirmedPlayerIds = new Set(
      attendance
        .filter((a) => {
          const s = String(a.status || a.Status || "")
            .trim()
            .toLowerCase();
          return s === "confirmed";
        })
        .map((a) => {
          const pid = a.player_id ?? a["player-id"] ?? a.playerId ?? a.id;
          return pid ? Number(pid) : null;
        })
        .filter((id): id is number => id !== null),
    );

    // If attendance is completely missing/empty, we might want a fallback to avoid a broken UI,
    // but the user says there are confirmed players, so let's stick to the confirmed list first.
    const benchPlayers = Object.values(orgPlayerIdToPlayer).filter((p) => {
      const pid = Number(p.id);
      const isConfirmed =
        confirmedPlayerIds.size === 0 || confirmedPlayerIds.has(pid);
      const isInLineup = lineupIds.has(pid);
      return isConfirmed && !isInLineup;
    });
    const finished = (selectedMatch.status || "").toLowerCase() === "finished";

    return { homePlayers, awayPlayers, benchPlayers, finished };
  }, [
    selectedMatch,
    lineupsByMatch,
    teamPlayers,
    orgPlayerIdToPlayer,
    attendance,
  ]);

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
    orgPlayerIdToTeamId: useMemo(() => {
      const m: Record<number, number> = {};
      for (const [teamId, players] of Object.entries(teamPlayers)) {
        for (const p of players) {
          m[p.player_id] = Number(teamId);
        }
      }
      for (const [, lineups] of Object.entries(lineupsByMatch)) {
        for (const [teamId, players] of Object.entries(lineups)) {
          for (const p of players) {
            m[p.player_id] = Number(teamId);
          }
        }
      }
      return m;
    }, [lineupsByMatch, teamPlayers]),
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
    teams,
    currentMatchStats,
    allOrgPlayers: useMemo(
      () => Object.values(orgPlayerIdToPlayer),
      [orgPlayerIdToPlayer],
    ),
    selectedMatch,
    justFinishedMatch,
    nextScheduledMatch,
    activeMatchData,
    isPeladaClosed,
    closing: actions.closing,
    executeClosePelada: actions.executeClosePelada,
    refreshStats: refreshData,
    replacePlayerOnMatchTeam: actions.replacePlayerOnMatchTeam,
    adjustScore: actions.adjustScore,
    recordEvent: actions.recordEvent,
    deleteEventAndRefresh: actions.deleteEventAndRefresh,
    addPlayerToTeam: actions.addPlayerToTeam,
    endMatch: handleEndMatch,
    setJustFinishedMatchId,
    proceedToNextMatch,
    togglePlayerSort: standingsData.togglePlayerSort,
    // Timer actions
    startPeladaTimer: actions.startPeladaTimer,
    pausePeladaTimer: actions.pausePeladaTimer,
    resetPeladaTimer: actions.resetPeladaTimer,
    startMatchTimer: actions.startMatchTimer,
    pauseMatchTimer: actions.pauseMatchTimer,
    resetMatchTimer: actions.resetMatchTimer,
    peladaTransactions,
    organizationFinance,
  };
}
