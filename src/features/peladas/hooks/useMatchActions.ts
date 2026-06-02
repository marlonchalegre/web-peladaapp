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

export interface MatchStateDelegates {
  matchesRef: React.MutableRefObject<Match[]>;
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
  refreshData: () => Promise<void>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setMatchEvents: React.Dispatch<React.SetStateAction<MatchEvent[]>>;
  setLineupsByMatch: React.Dispatch<
    React.SetStateAction<Record<string, Record<string, TeamPlayer[]>>>
  >;
  setPelada: React.Dispatch<React.SetStateAction<Pelada | null>>;
}

export function useMatchActions(peladaId: string, data: MatchStateDelegates) {
  const { t } = useTranslation();
  const [updatingScore, setUpdatingScore] = useState<Record<string, boolean>>(
    {},
  );
  const [closing, setClosing] = useState(false);
  const [selectMenu, setSelectMenu] = useState<{
    teamId: string;
    forPlayerId?: string;
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
  } = data;

  const handleNetworkError = useCallback(
    (error: unknown, actionType: string, payload: Record<string, unknown>) => {
      if (
        error instanceof Error &&
        (error.message.includes("Failed to fetch") ||
          error.message.includes("Network Error") ||
          error.message.includes("Network timeout"))
      ) {
        enqueueAction(peladaId, actionType as OfflineActionType, payload);
        return true; // handled
      }
      return false; // not a network error
    },
    [peladaId],
  );

  const adjustScore = useCallback(
    async (matchId: string, team: "home" | "away", delta: 1 | -1 = 1) => {
      // Use latest available match data from ref
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

      // Update ref immediately to allow rapid clicks to use updated data
      matchesRef.current = matchesRef.current.map((m: Match) =>
        m.id === matchId
          ? {
              ...m,
              home_score: newHome,
              away_score: newAway,
              status: status === "scheduled" ? m.status : status,
            }
          : m,
      );

      setUpdatingScore((prev) => ({ ...prev, [matchId]: true }));

      if (!navigator.onLine) {
        enqueueAction(peladaId, "ADJUST_SCORE", {
          matchId,
          newHome,
          newAway,
          status,
        });
        setUpdatingScore((prev) => ({ ...prev, [matchId]: false }));
        return;
      }

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
          throw error;
        }
      } finally {
        setUpdatingScore((prev) => ({ ...prev, [matchId]: false }));
      }
    },
    [peladaId, t, matchesRef, setMatches, setError, handleNetworkError],
  );

  const deleteEventAndRefresh = async (
    matchId: string,
    playerId: string,
    type: "assist" | "goal" | "own_goal",
    eventId?: string,
  ) => {
    // Optimistic Update
    setMatchEvents((prev: MatchEvent[]) => {
      if (eventId) {
        const eventToDelete = prev.find((e) => e.id === eventId);
        if (eventToDelete && eventToDelete.event_type === "goal") {
          const matchingAssist = prev.find(
            (e) =>
              e.match_id === matchId &&
              e.event_type === "assist" &&
              ((e.parent_event_id && e.parent_event_id === eventToDelete.id) ||
                (!e.parent_event_id &&
                  e.session_time_ms === eventToDelete.session_time_ms &&
                  e.match_time_ms === eventToDelete.match_time_ms)),
          );
          return prev.filter(
            (e) =>
              e.id !== eventId &&
              (!matchingAssist || e.id !== matchingAssist.id),
          );
        }
        return prev.filter((e) => e.id !== eventId);
      } else {
        const goalToDelete = [...prev]
          .reverse()
          .find(
            (e) =>
              e.match_id === matchId &&
              e.player_id === playerId &&
              e.event_type === type,
          );
        if (goalToDelete) {
          const matchingAssist = prev.find(
            (e) =>
              e.match_id === matchId &&
              e.event_type === "assist" &&
              ((e.parent_event_id && e.parent_event_id === goalToDelete.id) ||
                (!e.parent_event_id &&
                  e.session_time_ms === goalToDelete.session_time_ms &&
                  e.match_time_ms === goalToDelete.match_time_ms)),
          );
          return prev.filter(
            (e) =>
              e.id !== goalToDelete.id &&
              (!matchingAssist || e.id !== matchingAssist.id),
          );
        }
      }
      return prev;
    });

    setUpdatingScore((prev) => ({ ...prev, [matchId]: true }));

    if (!navigator.onLine) {
      enqueueAction(peladaId, "DELETE_EVENT", {
        matchId,
        playerId,
        type,
        eventId,
      });
      setUpdatingScore((prev) => ({ ...prev, [matchId]: false }));
      return;
    }

    try {
      await endpoints.deleteMatchEvent(matchId, playerId, type, eventId);
      await refreshData();
    } catch (error: unknown) {
      if (
        !handleNetworkError(error, "DELETE_EVENT", {
          matchId,
          playerId,
          type,
          eventId,
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

  const recordEvent = async (
    matchId: string,
    playerId: string,
    type: "assist" | "goal" | "own_goal",
    sessionTimeMs?: number,
    matchTimeMs?: number,
    assistantId?: string,
  ) => {
    // Optimistic Update
    const newEvent = {
      id: String(Date.now()), // temporary id
      match_id: matchId,
      player_id: playerId,
      event_type: type,
      session_time_ms: sessionTimeMs,
      match_time_ms: matchTimeMs,
      created_at: new Date().toISOString(),
    } as MatchEvent;
    const optimisticEvents = [newEvent];
    if (type === "goal" && assistantId) {
      optimisticEvents.push({
        id: String(Date.now() + 1), // temporary id
        match_id: matchId,
        player_id: assistantId,
        event_type: "assist",
        session_time_ms: sessionTimeMs,
        match_time_ms: matchTimeMs,
        created_at: new Date().toISOString(),
      } as MatchEvent);
    }
    setMatchEvents((prev: MatchEvent[]) => [...prev, ...optimisticEvents]);

    setUpdatingScore((prev) => ({ ...prev, [matchId]: true }));

    if (!navigator.onLine) {
      enqueueAction(peladaId, "RECORD_EVENT", {
        matchId,
        playerId,
        type,
        sessionTimeMs,
        matchTimeMs,
        assistantId,
      });
      setUpdatingScore((prev) => ({ ...prev, [matchId]: false }));
      return;
    }

    try {
      await endpoints.createMatchEvent(
        matchId,
        playerId,
        type,
        sessionTimeMs,
        matchTimeMs,
        assistantId,
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
          assistantId,
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

  const updateEvent = useCallback(
    async (
      matchId: string,
      eventId: string,
      playerId: string,
      assistantId?: string | null,
    ) => {
      setUpdatingScore((prev) => ({ ...prev, [matchId]: true }));

      if (!navigator.onLine) {
        enqueueAction(peladaId, "UPDATE_EVENT", {
          matchId,
          eventId,
          playerId,
          assistantId,
        });
        setUpdatingScore((prev) => ({ ...prev, [matchId]: false }));
        return;
      }

      try {
        await endpoints.updateMatchEvent(
          matchId,
          eventId,
          playerId,
          assistantId,
        );
        await refreshData();
      } catch (error: unknown) {
        if (
          !handleNetworkError(error, "UPDATE_EVENT", {
            matchId,
            eventId,
            playerId,
            assistantId,
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
    },
    [peladaId, t, setError, handleNetworkError, refreshData],
  );

  const addPlayerToTeam = async (
    matchId: string,
    teamId: string,
    playerId: string,
  ) => {
    // Optimistic Update
    setLineupsByMatch((prev: Record<string, Record<string, TeamPlayer[]>>) => {
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

    const payload = { matchId, teamId, playerId };
    if (!navigator.onLine) {
      enqueueAction(peladaId, "ADD_PLAYER_TO_TEAM", payload);
      setSelectMenu(null);
      return;
    }

    try {
      await endpoints.addMatchLineupPlayer(matchId, teamId, playerId);
      await refreshData();
    } catch (error: unknown) {
      if (!handleNetworkError(error, "ADD_PLAYER_TO_TEAM", payload)) {
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
    matchId: string,
    teamId: string,
    outPlayerId: string,
    inPlayerId: string,
  ) => {
    // Optimistic Update
    setLineupsByMatch((prev: Record<string, Record<string, TeamPlayer[]>>) => {
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

    const payload = { matchId, teamId, outPlayerId, inPlayerId };
    if (!navigator.onLine) {
      enqueueAction(peladaId, "REPLACE_PLAYER", payload);
      setSelectMenu(null);
      return;
    }

    try {
      await endpoints.replaceMatchLineupPlayer(
        matchId,
        teamId,
        outPlayerId,
        inPlayerId,
      );
      await refreshData();
    } catch (error: unknown) {
      if (!handleNetworkError(error, "REPLACE_PLAYER", payload)) {
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

    if (!navigator.onLine) {
      enqueueAction(peladaId, "CLOSE_PELADA", { peladaId });
      setClosing(false);
      return;
    }

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

  const executeEndMatch = async (matchId: string) => {
    const match = matchesRef.current.find((m: Match) => m.id === matchId);
    if (!match) return;

    // Optimistic
    setMatches((prev: Match[]) =>
      prev.map((m) =>
        m.id === matchId ? { ...m, status: "finished" as Match["status"] } : m,
      ),
    );

    setUpdatingScore((prev) => ({ ...prev, [matchId]: true }));

    const payload = {
      matchId,
      homeScore: match.home_score,
      awayScore: match.away_score,
    };
    if (!navigator.onLine) {
      enqueueAction(peladaId, "END_MATCH", payload);
      setUpdatingScore((prev) => ({ ...prev, [matchId]: false }));
      return;
    }

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
      if (!handleNetworkError(error, "END_MATCH", payload)) {
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

    if (!navigator.onLine) {
      enqueueAction(peladaId, "START_PELADA_TIMER", { peladaId });
      return;
    }

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

    if (!navigator.onLine) {
      enqueueAction(peladaId, "PAUSE_PELADA_TIMER", { peladaId });
      return;
    }

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

    if (!navigator.onLine) {
      enqueueAction(peladaId, "RESET_PELADA_TIMER", { peladaId });
      return;
    }

    try {
      await endpoints.resetPeladaTimer(peladaId);
      await refreshData();
    } catch (err) {
      handleNetworkError(err, "RESET_PELADA_TIMER", { peladaId });
    }
  }, [peladaId, refreshData, setPelada, handleNetworkError]);

  const startMatchTimer = useCallback(
    async (matchId: string) => {
      setMatches((prev: Match[]) =>
        prev.map((m) =>
          m.id === matchId
            ? { ...m, timer_status: "running" as Match["timer_status"] }
            : m,
        ),
      );

      if (!navigator.onLine) {
        enqueueAction(peladaId, "START_MATCH_TIMER", { matchId });
        return;
      }

      try {
        await endpoints.startMatchTimer(matchId);
        await refreshData();
      } catch (err) {
        handleNetworkError(err, "START_MATCH_TIMER", { matchId });
      }
    },
    [peladaId, refreshData, setMatches, handleNetworkError],
  );

  const pauseMatchTimer = useCallback(
    async (matchId: string) => {
      setMatches((prev: Match[]) =>
        prev.map((m) =>
          m.id === matchId
            ? { ...m, timer_status: "paused" as Match["timer_status"] }
            : m,
        ),
      );

      if (!navigator.onLine) {
        enqueueAction(peladaId, "PAUSE_MATCH_TIMER", { matchId });
        return;
      }

      try {
        await endpoints.pauseMatchTimer(matchId);
        await refreshData();
      } catch (err) {
        handleNetworkError(err, "PAUSE_MATCH_TIMER", { matchId });
      }
    },
    [peladaId, refreshData, setMatches, handleNetworkError],
  );

  const resetMatchTimer = useCallback(
    async (matchId: string) => {
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

      if (!navigator.onLine) {
        enqueueAction(peladaId, "RESET_MATCH_TIMER", { matchId });
        return;
      }

      try {
        await endpoints.resetMatchTimer(matchId);
        await refreshData();
      } catch (err) {
        handleNetworkError(err, "RESET_MATCH_TIMER", { matchId });
      }
    },
    [peladaId, refreshData, setMatches, handleNetworkError],
  );

  return {
    updatingScore,
    closing,
    selectMenu,
    setSelectMenu,
    adjustScore,
    deleteEventAndRefresh,
    recordEvent,
    updateEvent,
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
