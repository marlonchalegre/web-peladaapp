import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../../shared/api/client";
import {
  createApi,
  type Match,
  type MatchEvent,
  type Pelada,
  type TeamPlayer,
  type MatchEventType,
} from "../../../shared/api/endpoints";
import {
  enqueueAction,
  isNetworkError,
  type OfflineActionType,
} from "../utils/offlineQueue";
import { findMatchingAssistForGoal } from "../utils/playerUtils";
import { calculateElapsedMs } from "./usePeladaTimer";

const endpoints = createApi(api);

type TimerBearer = {
  timer_status?: Pelada["timer_status"];
  timer_started_at?: string | null;
  timer_accumulated_ms?: number | null;
};

function computePausedTimer<T extends TimerBearer>(entity: T): T {
  const newAccumulated = calculateElapsedMs(
    entity.timer_started_at,
    entity.timer_accumulated_ms,
    entity.timer_status,
  );
  return {
    ...entity,
    timer_status: "paused" as T["timer_status"],
    timer_started_at: null,
    timer_accumulated_ms: newAccumulated,
  };
}

function computeResetTimer<T extends TimerBearer>(entity: T): T {
  return {
    ...entity,
    timer_status: "paused" as T["timer_status"],
    timer_started_at: null,
    timer_accumulated_ms: 0,
  };
}

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

  const updateMatchInState = useCallback(
    (matchId: string, updater: (m: Match) => Match, syncRef = true) => {
      let cachedUpdated: Match | undefined;
      const getUpdated = (m: Match) => {
        if (!cachedUpdated) cachedUpdated = updater(m);
        return cachedUpdated;
      };
      setMatches((prev: Match[]) =>
        prev.map((m) => (m.id === matchId ? getUpdated(m) : m)),
      );
      if (syncRef) {
        matchesRef.current = matchesRef.current.map((m: Match) =>
          m.id === matchId ? getUpdated(m) : m,
        );
      }
    },
    [setMatches, matchesRef],
  );

  const handleNetworkError = useCallback(
    (
      error: unknown,
      actionType: OfflineActionType,
      payload: Record<string, unknown>,
    ) => {
      if (isNetworkError(error)) {
        enqueueAction(peladaId, actionType, payload);
        return true;
      }
      return false;
    },
    [peladaId],
  );

  const runOfflineAction = useCallback(
    async ({
      actionType,
      payload,
      execute,
      matchId,
      fallbackError,
      rethrow = false,
      onFinally,
    }: {
      actionType: OfflineActionType;
      payload: Record<string, unknown>;
      execute: () => Promise<void>;
      matchId?: string;
      fallbackError?: string;
      rethrow?: boolean;
      onFinally?: () => void;
    }) => {
      if (matchId) {
        setUpdatingScore((prev) => ({ ...prev, [matchId]: true }));
      }

      if (!navigator.onLine) {
        enqueueAction(peladaId, actionType, payload);
        if (matchId) {
          setUpdatingScore((prev) => ({ ...prev, [matchId]: false }));
        }
        onFinally?.();
        return;
      }

      try {
        await execute();
      } catch (error: unknown) {
        if (!handleNetworkError(error, actionType, payload)) {
          if (fallbackError !== undefined) {
            setError(error instanceof Error ? error.message : fallbackError);
          }
          if (rethrow) {
            throw error;
          }
        }
      } finally {
        if (matchId) {
          setUpdatingScore((prev) => ({ ...prev, [matchId]: false }));
        }
        onFinally?.();
      }
    },
    [peladaId, handleNetworkError, setError],
  );

  const adjustScore = useCallback(
    async (matchId: string, team: "home" | "away", delta: 1 | -1 = 1) => {
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

      const isRunning =
        match.status === "running" ||
        match.timer_status === "running" ||
        (match.timer_accumulated_ms ?? 0) > 0 ||
        newHome + newAway > 0;

      const status =
        match.status === "finished"
          ? "finished"
          : isRunning
            ? "running"
            : "scheduled";

      updateMatchInState(matchId, (m) => ({
        ...m,
        home_score: newHome,
        away_score: newAway,
        status: status === "scheduled" ? m.status : status,
      }));

      await runOfflineAction({
        actionType: "ADJUST_SCORE",
        payload: { matchId, newHome, newAway, status },
        matchId,
        execute: async () => {
          await endpoints.updateMatchScore(matchId, newHome, newAway, status);
        },
        fallbackError: t("peladas.matches.error.update_score_failed"),
        rethrow: true,
      });
    },
    [t, matchesRef, setError, updateMatchInState, runOfflineAction],
  );

  const deleteEventAndRefresh = useCallback(
    async (
      matchId: string,
      playerId: string,
      type: MatchEventType,
      eventId?: string,
    ) => {
      setMatchEvents((prev: MatchEvent[]) => {
        let targetGoal: MatchEvent | undefined;
        if (eventId) {
          targetGoal = prev.find((e) => e.id === eventId);
        } else {
          for (let i = prev.length - 1; i >= 0; i--) {
            const e = prev[i];
            if (
              e.match_id === matchId &&
              e.player_id === playerId &&
              e.event_type === type
            ) {
              targetGoal = e;
              break;
            }
          }
        }

        if (!targetGoal) {
          return eventId ? prev.filter((e) => e.id !== eventId) : prev;
        }

        if (targetGoal.event_type === "goal") {
          const matchingAssist = findMatchingAssistForGoal(targetGoal, prev);
          return prev.filter(
            (e) =>
              e.id !== targetGoal.id &&
              (!matchingAssist || e.id !== matchingAssist.id),
          );
        }

        return prev.filter((e) => e.id !== targetGoal.id);
      });

      await runOfflineAction({
        actionType: "DELETE_EVENT",
        payload: { matchId, playerId, type, eventId },
        matchId,
        execute: async () => {
          await endpoints.deleteMatchEvent(matchId, playerId, type, eventId);
          await refreshData();
        },
        fallbackError: t("peladas.matches.error.record_event_failed"),
        rethrow: true,
      });
    },
    [setMatchEvents, runOfflineAction, refreshData, t],
  );

  const recordEvent = useCallback(
    async (
      matchId: string,
      playerId: string,
      type: MatchEventType,
      sessionTimeMs?: number,
      matchTimeMs?: number,
      assistantId?: string,
      teamId?: string,
    ) => {
      const nowIso = new Date().toISOString();
      const newEvent = {
        id: String(Date.now()),
        match_id: matchId,
        player_id: playerId,
        event_type: type,
        session_time_ms: sessionTimeMs,
        match_time_ms: matchTimeMs,
        created_at: nowIso,
        team_id: teamId,
      } as MatchEvent;
      const optimisticEvents = [newEvent];
      if (type === "goal" && assistantId) {
        optimisticEvents.push({
          id: String(Date.now() + 1),
          match_id: matchId,
          player_id: assistantId,
          event_type: "assist",
          session_time_ms: sessionTimeMs,
          match_time_ms: matchTimeMs,
          created_at: nowIso,
          team_id: teamId,
        } as MatchEvent);
      }
      setMatchEvents((prev: MatchEvent[]) => [...prev, ...optimisticEvents]);

      if (type === "goal" || type === "own_goal") {
        const match = matchesRef.current.find((m) => m.id === matchId);
        if (match) {
          const isHome = teamId ? teamId === match.home_team_id : true;
          const isHomeGoal = type === "goal" ? isHome : !isHome;
          const newHome = isHomeGoal
            ? (match.home_score ?? 0) + 1
            : (match.home_score ?? 0);
          const newAway = !isHomeGoal
            ? (match.away_score ?? 0) + 1
            : (match.away_score ?? 0);
          updateMatchInState(matchId, (m) => ({
            ...m,
            home_score: newHome,
            away_score: newAway,
            status: m.status === "scheduled" ? "running" : m.status,
          }));
        }
      }

      await runOfflineAction({
        actionType: "RECORD_EVENT",
        payload: {
          matchId,
          playerId,
          type,
          sessionTimeMs,
          matchTimeMs,
          assistantId,
          teamId,
        },
        matchId,
        execute: async () => {
          await endpoints.createMatchEvent(
            matchId,
            playerId,
            type,
            sessionTimeMs,
            matchTimeMs,
            assistantId,
            teamId,
          );
          await refreshData();
        },
        fallbackError: t("peladas.matches.error.record_event_failed"),
        rethrow: true,
      });
    },
    [
      setMatchEvents,
      matchesRef,
      updateMatchInState,
      runOfflineAction,
      refreshData,
      t,
    ],
  );

  const updateEvent = useCallback(
    async (
      matchId: string,
      eventId: string,
      playerId: string,
      assistantId?: string | null,
    ) => {
      await runOfflineAction({
        actionType: "UPDATE_EVENT",
        payload: { matchId, eventId, playerId, assistantId },
        matchId,
        execute: async () => {
          await endpoints.updateMatchEvent(
            matchId,
            eventId,
            playerId,
            assistantId,
          );
          await refreshData();
        },
        fallbackError: t("peladas.matches.error.record_event_failed"),
        rethrow: true,
      });
    },
    [runOfflineAction, refreshData, t],
  );

  const addPlayerToTeam = useCallback(
    async (matchId: string, teamId: string, playerId: string) => {
      setLineupsByMatch(
        (prev: Record<string, Record<string, TeamPlayer[]>>) => {
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
        },
      );

      await runOfflineAction({
        actionType: "ADD_PLAYER_TO_TEAM",
        payload: { matchId, teamId, playerId },
        execute: async () => {
          await endpoints.addMatchLineupPlayer(matchId, teamId, playerId);
          await refreshData();
        },
        fallbackError: t("peladas.matches.error.add_player_failed"),
        onFinally: () => setSelectMenu(null),
      });
    },
    [setLineupsByMatch, runOfflineAction, refreshData, t],
  );

  const replacePlayerOnMatchTeam = useCallback(
    async (
      matchId: string,
      teamId: string,
      outPlayerId: string,
      inPlayerId: string,
    ) => {
      setLineupsByMatch(
        (prev: Record<string, Record<string, TeamPlayer[]>>) => {
          const matchLineup = prev[matchId] || {};
          const teamLineup = matchLineup[teamId] || [];
          return {
            ...prev,
            [matchId]: {
              ...matchLineup,
              [teamId]: teamLineup.map((p: TeamPlayer) =>
                p.player_id === outPlayerId
                  ? { ...p, player_id: inPlayerId }
                  : p,
              ),
            },
          };
        },
      );

      await runOfflineAction({
        actionType: "REPLACE_PLAYER",
        payload: { matchId, teamId, outPlayerId, inPlayerId },
        execute: async () => {
          await endpoints.replaceMatchLineupPlayer(
            matchId,
            teamId,
            outPlayerId,
            inPlayerId,
          );
          await refreshData();
        },
        fallbackError: t("peladas.matches.error.replace_player_failed"),
        onFinally: () => setSelectMenu(null),
      });
    },
    [setLineupsByMatch, runOfflineAction, refreshData, t],
  );

  const executeClosePelada = useCallback(async () => {
    if (!peladaId) return;
    setClosing(true);
    setPelada((prev: Pelada | null) =>
      prev ? { ...prev, status: "closed" as Pelada["status"] } : prev,
    );

    await runOfflineAction({
      actionType: "CLOSE_PELADA",
      payload: { peladaId },
      execute: async () => {
        await endpoints.closePelada(peladaId);
        await refreshData();
      },
      fallbackError: t("peladas.matches.error.close_failed"),
      onFinally: () => setClosing(false),
    });
  }, [peladaId, setPelada, runOfflineAction, refreshData, t]);

  const executeEndMatch = useCallback(
    async (matchId: string) => {
      const match = matchesRef.current.find((m: Match) => m.id === matchId);
      if (!match) return;

      updateMatchInState(
        matchId,
        (m) => ({ ...m, status: "finished" as Match["status"] }),
        false,
      );

      await runOfflineAction({
        actionType: "END_MATCH",
        payload: {
          matchId,
          homeScore: match.home_score,
          awayScore: match.away_score,
        },
        matchId,
        execute: async () => {
          await Promise.all([
            ...(match.timer_status === "running"
              ? [endpoints.pauseMatchTimer(matchId)]
              : []),
            endpoints.updateMatchScore(
              matchId,
              match.home_score ?? 0,
              match.away_score ?? 0,
              "finished",
            ),
          ]);
          await refreshData();
        },
        fallbackError: t("peladas.matches.error.end_match_failed"),
      });
    },
    [matchesRef, updateMatchInState, runOfflineAction, refreshData, t],
  );

  // Timer Actions
  const startPeladaTimer = useCallback(async () => {
    setPelada((prev: Pelada | null) =>
      prev
        ? {
            ...prev,
            timer_status: "running" as Pelada["timer_status"],
            timer_started_at: new Date().toISOString(),
          }
        : prev,
    );

    await runOfflineAction({
      actionType: "START_PELADA_TIMER",
      payload: { peladaId },
      execute: async () => {
        await endpoints.startPeladaTimer(peladaId);
        await refreshData();
      },
    });
  }, [peladaId, refreshData, setPelada, runOfflineAction]);

  const pausePeladaTimer = useCallback(async () => {
    setPelada((prev: Pelada | null) =>
      prev ? computePausedTimer(prev) : null,
    );

    await runOfflineAction({
      actionType: "PAUSE_PELADA_TIMER",
      payload: { peladaId },
      execute: async () => {
        await endpoints.pausePeladaTimer(peladaId);
        await refreshData();
      },
    });
  }, [peladaId, refreshData, setPelada, runOfflineAction]);

  const resetPeladaTimer = useCallback(async () => {
    setPelada((prev: Pelada | null) => (prev ? computeResetTimer(prev) : prev));

    await runOfflineAction({
      actionType: "RESET_PELADA_TIMER",
      payload: { peladaId },
      execute: async () => {
        await endpoints.resetPeladaTimer(peladaId);
        await refreshData();
      },
    });
  }, [peladaId, refreshData, setPelada, runOfflineAction]);

  const startMatchTimer = useCallback(
    async (matchId: string) => {
      const nowIso = new Date().toISOString();
      updateMatchInState(matchId, (m) => ({
        ...m,
        status:
          m.status === "scheduled" ? ("running" as Match["status"]) : m.status,
        timer_status: "running" as Match["timer_status"],
        timer_started_at: nowIso,
      }));

      await runOfflineAction({
        actionType: "START_MATCH_TIMER",
        payload: { matchId },
        execute: async () => {
          await endpoints.startMatchTimer(matchId);
          await refreshData();
        },
      });
    },
    [refreshData, updateMatchInState, runOfflineAction],
  );

  const pauseMatchTimer = useCallback(
    async (matchId: string) => {
      updateMatchInState(matchId, computePausedTimer, false);

      await runOfflineAction({
        actionType: "PAUSE_MATCH_TIMER",
        payload: { matchId },
        execute: async () => {
          await endpoints.pauseMatchTimer(matchId);
          await refreshData();
        },
      });
    },
    [refreshData, updateMatchInState, runOfflineAction],
  );

  const resetMatchTimer = useCallback(
    async (matchId: string) => {
      updateMatchInState(matchId, computeResetTimer, false);

      await runOfflineAction({
        actionType: "RESET_MATCH_TIMER",
        payload: { matchId },
        execute: async () => {
          await endpoints.resetMatchTimer(matchId);
          await refreshData();
        },
      });
    },
    [refreshData, updateMatchInState, runOfflineAction],
  );

  const generateSupportLineup = useCallback(async () => {
    try {
      const updatedMatches =
        await endpoints.generatePeladaSupportLineup(peladaId);
      matchesRef.current = updatedMatches;
      setMatches(updatedMatches);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao sortear escalação de suporte",
      );
      throw err;
    }
  }, [peladaId, setMatches, matchesRef, setError]);

  const updateSupportLineup = useCallback(
    async (
      matchId: string,
      payload: {
        support_camera_player_id?: string | null;
        support_stats_player_id?: string | null;
      },
    ) => {
      try {
        const updated = await endpoints.updateMatchSupportLineup(
          matchId,
          payload,
        );
        updateMatchInState(matchId, (m) => ({ ...m, ...updated }));
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao atualizar escalação de suporte",
        );
        throw err;
      }
    },
    [updateMatchInState, setError],
  );

  const rerollSupportLineup = useCallback(
    async (matchId: string) => {
      try {
        const updated = await endpoints.rerollMatchSupportLineup(matchId);
        updateMatchInState(matchId, (m) => ({ ...m, ...updated }));
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao re-sortear escalação de suporte",
        );
        throw err;
      }
    },
    [updateMatchInState, setError],
  );

  const notifySupportLineup = useCallback(
    async (organizationId: string) => {
      try {
        await endpoints.sendNotification(organizationId, {
          action: "resend",
          notification_type: "support-lineup",
          pelada_id: peladaId,
        });
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao enviar notificação da escala de suporte",
        );
        throw err;
      }
    },
    [peladaId, setError],
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
    generateSupportLineup,
    updateSupportLineup,
    rerollSupportLineup,
    notifySupportLineup,
  };
}
