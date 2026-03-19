import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../../shared/api/client";
import {
  createApi,
  type Match,
  type MatchEvent,
  type Pelada,
  type TeamPlayer,
} from "../../../shared/api/endpoints";
import { enqueueAction, type OfflineActionType } from "../utils/offlineQueue";

const endpoints = createApi(api);

export function useMatchActions(
  peladaId: number,
  data: Record<string, unknown>,
) {
  const { t } = useTranslation();
  const [updatingScore, setUpdatingScore] = useState<Record<number, boolean>>(
    {},
  );
  const [closing, setClosing] = useState(false);
  const [selectMenu, setSelectMenu] = useState<{
    teamId: number;
    forPlayerId?: number;
    type: "replace" | "add";
  } | null>(null);

  const {
    matchesRef,
    setMatches,
    refreshData,
    setError,
    setMatchEvents,
    setLineupsByMatch,
    setPelada,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = data as any;

  const handleNetworkError = useCallback(
    (error: unknown, actionType: string, payload: Record<string, unknown>) => {
      if (
        error instanceof Error &&
        (error.message.includes("Failed to fetch") ||
          error.message.includes("Network Error"))
      ) {
        enqueueAction(peladaId, actionType as OfflineActionType, payload);
        return true; // handled
      }
      return false; // not a network error
    },
    [peladaId],
  );

  const adjustScore = useCallback(
    async (matchId: number, team: "home" | "away", delta: 1 | -1 = 1) => {
      const match = matchesRef.current.find((m: Match) => m.id === matchId);
      if (!match) return;

      const currentHome = match.home_score ?? 0;
      const currentAway = match.away_score ?? 0;
      const newHome = team === "home" ? currentHome + delta : currentHome;
      const newAway = team === "away" ? currentAway + delta : currentAway;

      if (newHome < 0 || newAway < 0) {
        setError(t("peladas.matches.error.negative_score"));
        throw new Error("NEGATIVE_SCORE");
      }

      const status =
        match.status === "finished"
          ? "finished"
          : newHome + newAway > 0
            ? "running"
            : "scheduled";

      // Optimistic Update
      setMatches((prev: Match[]) =>
        prev.map((m) =>
          m.id === matchId
            ? {
                ...m,
                home_score: newHome,
                away_score: newAway,
                status: status === "scheduled" ? m.status : status,
              }
            : m,
        ),
      );

      setUpdatingScore((prev) => ({ ...prev, [matchId]: true }));
      try {
        await endpoints.updateMatchScore(matchId, newHome, newAway, status);
      } catch (error: unknown) {
        if (
          !handleNetworkError(error, "ADJUST_SCORE", {
            matchId,
            newHome,
            newAway,
            status,
          })
        ) {
          setError(
            error instanceof Error
              ? error.message
              : t("peladas.matches.error.update_score_failed"),
          );
          // Optionally revert state here if needed
          throw error;
        }
      } finally {
        setUpdatingScore((prev) => ({ ...prev, [matchId]: false }));
      }
    },
    [t, matchesRef, setMatches, setError, handleNetworkError],
  );

  const deleteEventAndRefresh = async (
    matchId: number,
    playerId: number,
    type: "assist" | "goal" | "own_goal",
  ) => {
    // Optimistic
    setMatchEvents((prev: MatchEvent[]) =>
      prev.filter(
        (e) =>
          !(
            e.match_id === matchId &&
            e.player_id === playerId &&
            e.event_type === type
          ),
      ),
    );

    setUpdatingScore((prev) => ({ ...prev, [matchId]: true }));
    try {
      await endpoints.deleteMatchEvent(matchId, playerId, type);
      await refreshData();
    } catch (error: unknown) {
      if (
        !handleNetworkError(error, "DELETE_EVENT", { matchId, playerId, type })
      ) {
        setError(
          (error instanceof Error
            ? error.message
            : t("peladas.matches.error.record_event_failed")) as string,
        );
        throw error;
      }
    } finally {
      setUpdatingScore((prev) => ({ ...prev, [matchId]: false }));
    }
  };

  const recordEvent = async (
    matchId: number,
    playerId: number,
    type: "assist" | "goal" | "own_goal",
    sessionTimeMs?: number,
    matchTimeMs?: number,
  ) => {
    // Optimistic Update
    const newEvent = {
      id: Date.now(), // temporary id
      match_id: matchId,
      player_id: playerId,
      event_type: type,
      session_time_ms: sessionTimeMs,
      match_time_ms: matchTimeMs,
      created_at: new Date().toISOString(),
    } as MatchEvent;
    setMatchEvents((prev: MatchEvent[]) => [...prev, newEvent]);

    setUpdatingScore((prev) => ({ ...prev, [matchId]: true }));
    try {
      await endpoints.createMatchEvent(
        matchId,
        playerId,
        type,
        sessionTimeMs,
        matchTimeMs,
      );
      await refreshData();
    } catch (error: unknown) {
      if (
        !handleNetworkError(error, "RECORD_EVENT", {
          matchId,
          playerId,
          type,
          sessionTimeMs,
          matchTimeMs,
        })
      ) {
        setError(
          (error instanceof Error
            ? error.message
            : t("peladas.matches.error.record_event_failed")) as string,
        );
        throw error;
      }
    } finally {
      setUpdatingScore((prev) => ({ ...prev, [matchId]: false }));
    }
  };

  const addPlayerToTeam = async (
    matchId: number,
    teamId: number,
    playerId: number,
  ) => {
    // Optimistic Update
    setLineupsByMatch((prev: Record<number, Record<number, TeamPlayer[]>>) => {
      const matchLineup = prev[matchId] || {};
      const teamLineup = matchLineup[teamId] || [];
      return {
        ...prev,
        [matchId]: {
          ...matchLineup,
          [teamId]: [
            ...teamLineup,
            {
              team_id: teamId,
              player_id: playerId,
              is_goalkeeper: false,
            } as TeamPlayer,
          ],
        },
      };
    });

    try {
      await endpoints.addMatchLineupPlayer(matchId, teamId, playerId);
      await refreshData();
    } catch (error: unknown) {
      if (
        !handleNetworkError(error, "ADD_PLAYER_TO_TEAM", {
          matchId,
          teamId,
          playerId,
        })
      ) {
        setError(
          error instanceof Error
            ? error.message
            : t("peladas.matches.error.add_player_failed"),
        );
      }
    } finally {
      setSelectMenu(null);
    }
  };

  const replacePlayerOnMatchTeam = async (
    matchId: number,
    teamId: number,
    outPlayerId: number,
    inPlayerId: number,
  ) => {
    // Optimistic Update
    setLineupsByMatch((prev: Record<number, Record<number, TeamPlayer[]>>) => {
      const matchLineup = prev[matchId] || {};
      const teamLineup = matchLineup[teamId] || [];
      return {
        ...prev,
        [matchId]: {
          ...matchLineup,
          [teamId]: teamLineup.map((p: TeamPlayer) =>
            p.player_id === outPlayerId ? { ...p, player_id: inPlayerId } : p,
          ),
        },
      };
    });

    try {
      await endpoints.replaceMatchLineupPlayer(
        matchId,
        teamId,
        outPlayerId,
        inPlayerId,
      );
      await refreshData();
    } catch (error: unknown) {
      if (
        !handleNetworkError(error, "REPLACE_PLAYER", {
          matchId,
          teamId,
          outPlayerId,
          inPlayerId,
        })
      ) {
        setError(
          error instanceof Error
            ? error.message
            : t("peladas.matches.error.replace_player_failed"),
        );
      }
    } finally {
      setSelectMenu(null);
    }
  };

  const executeClosePelada = async () => {
    if (!peladaId) return;
    setClosing(true);
    // Optimistic
    setPelada((prev: Pelada | null) =>
      prev ? { ...prev, status: "closed" as Pelada["status"] } : prev,
    );

    try {
      await endpoints.closePelada(peladaId);
      await refreshData();
    } catch (error: unknown) {
      if (!handleNetworkError(error, "CLOSE_PELADA", { peladaId })) {
        setError(
          error instanceof Error
            ? error.message
            : t("peladas.matches.error.close_failed"),
        );
      }
    } finally {
      setClosing(false);
    }
  };

  const executeEndMatch = async (matchId: number) => {
    const match = matchesRef.current.find((m: Match) => m.id === matchId);
    if (!match) return;

    // Optimistic
    setMatches((prev: Match[]) =>
      prev.map((m) =>
        m.id === matchId ? { ...m, status: "finished" as Match["status"] } : m,
      ),
    );

    setUpdatingScore((prev) => ({ ...prev, [matchId]: true }));
    try {
      if (match.timer_status === "running") {
        await endpoints.pauseMatchTimer(matchId);
      }
      await endpoints.updateMatchScore(
        matchId,
        match.home_score ?? 0,
        match.away_score ?? 0,
        "finished",
      );
      await refreshData();
    } catch (error: unknown) {
      if (
        !handleNetworkError(error, "END_MATCH", {
          matchId,
          homeScore: match.home_score,
          awayScore: match.away_score,
        })
      ) {
        setError(
          error instanceof Error
            ? error.message
            : t("peladas.matches.error.end_match_failed"),
        );
      }
    } finally {
      setUpdatingScore((prev) => ({ ...prev, [matchId]: false }));
    }
  };

  // Timer Actions
  const startPeladaTimer = useCallback(async () => {
    setPelada((prev: Pelada | null) =>
      prev
        ? { ...prev, timer_status: "running" as Pelada["timer_status"] }
        : prev,
    );
    try {
      await endpoints.startPeladaTimer(peladaId);
      await refreshData();
    } catch (err) {
      handleNetworkError(err, "START_PELADA_TIMER", { peladaId });
    }
  }, [peladaId, refreshData, setPelada, handleNetworkError]);

  const pausePeladaTimer = useCallback(async () => {
    setPelada((prev: Pelada | null) =>
      prev
        ? { ...prev, timer_status: "paused" as Pelada["timer_status"] }
        : prev,
    );
    try {
      await endpoints.pausePeladaTimer(peladaId);
      await refreshData();
    } catch (err) {
      handleNetworkError(err, "PAUSE_PELADA_TIMER", { peladaId });
    }
  }, [peladaId, refreshData, setPelada, handleNetworkError]);

  const resetPeladaTimer = useCallback(async () => {
    setPelada((prev: Pelada | null) =>
      prev
        ? {
            ...prev,
            timer_status: "paused" as Pelada["timer_status"],
            timer_accumulated_ms: 0,
          }
        : prev,
    );
    try {
      await endpoints.resetPeladaTimer(peladaId);
      await refreshData();
    } catch (err) {
      handleNetworkError(err, "RESET_PELADA_TIMER", { peladaId });
    }
  }, [peladaId, refreshData, setPelada, handleNetworkError]);

  const startMatchTimer = useCallback(
    async (matchId: number) => {
      setMatches((prev: Match[]) =>
        prev.map((m) =>
          m.id === matchId
            ? { ...m, timer_status: "running" as Match["timer_status"] }
            : m,
        ),
      );
      try {
        await endpoints.startMatchTimer(matchId);
        await refreshData();
      } catch (err) {
        handleNetworkError(err, "START_MATCH_TIMER", { matchId });
      }
    },
    [refreshData, setMatches, handleNetworkError],
  );

  const pauseMatchTimer = useCallback(
    async (matchId: number) => {
      setMatches((prev: Match[]) =>
        prev.map((m) =>
          m.id === matchId
            ? { ...m, timer_status: "paused" as Match["timer_status"] }
            : m,
        ),
      );
      try {
        await endpoints.pauseMatchTimer(matchId);
        await refreshData();
      } catch (err) {
        handleNetworkError(err, "PAUSE_MATCH_TIMER", { matchId });
      }
    },
    [refreshData, setMatches, handleNetworkError],
  );

  const resetMatchTimer = useCallback(
    async (matchId: number) => {
      setMatches((prev: Match[]) =>
        prev.map((m) =>
          m.id === matchId
            ? {
                ...m,
                timer_status: "paused" as Match["timer_status"],
                timer_accumulated_ms: 0,
              }
            : m,
        ),
      );
      try {
        await endpoints.resetMatchTimer(matchId);
        await refreshData();
      } catch (err) {
        handleNetworkError(err, "RESET_MATCH_TIMER", { matchId });
      }
    },
    [refreshData, setMatches, handleNetworkError],
  );

  return {
    updatingScore,
    closing,
    selectMenu,
    setSelectMenu,
    adjustScore,
    deleteEventAndRefresh,
    recordEvent,
    addPlayerToTeam,
    replacePlayerOnMatchTeam,
    executeClosePelada,
    executeEndMatch,
    startPeladaTimer,
    pausePeladaTimer,
    resetPeladaTimer,
    startMatchTimer,
    pauseMatchTimer,
    resetMatchTimer,
  };
}
