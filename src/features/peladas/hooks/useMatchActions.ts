import { useState, useCallback, type Dispatch, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../../shared/api/client";
import {
  createApi,
  type Match,
  type MatchEvent,
  type Pelada,
} from "../../../shared/api/endpoints";

const endpoints = createApi(api);

export function useMatchActions(
  peladaId: number,
  matchesRef: React.MutableRefObject<Match[]>,
  setMatches: (matches: Match[] | ((prev: Match[]) => Match[])) => void,
  setMatchEvents: (events: MatchEvent[]) => void,
  setPelada: Dispatch<SetStateAction<Pelada | null>>,
  refreshData: () => Promise<void>,
  setError: (msg: string | null) => void,
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

  const adjustScore = useCallback(
    async (matchId: number, team: "home" | "away", delta: 1 | -1 = 1) => {
      const match = matchesRef.current.find((m) => m.id === matchId);
      if (!match) return;

      const currentHome = match.home_score ?? 0;
      const currentAway = match.away_score ?? 0;
      const newHome = team === "home" ? currentHome + delta : currentHome;
      const newAway = team === "away" ? currentAway + delta : currentAway;

      if (newHome < 0 || newAway < 0) {
        setError(t("peladas.matches.error.negative_score"));
        throw new Error("NEGATIVE_SCORE");
      }

      const status = newHome + newAway > 0 ? "running" : "scheduled";
      setUpdatingScore((prev) => ({ ...prev, [matchId]: true }));
      try {
        await endpoints.updateMatchScore(matchId, newHome, newAway, status);
        setMatches((prev) =>
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
      } catch (error: unknown) {
        setError(
          error instanceof Error
            ? error.message
            : t("peladas.matches.error.update_score_failed"),
        );
        throw error;
      } finally {
        setUpdatingScore((prev) => ({ ...prev, [matchId]: false }));
      }
    },
    [t, matchesRef, setMatches, setError],
  );

  const deleteEventAndRefresh = async (
    matchId: number,
    playerId: number,
    type: "assist" | "goal" | "own_goal",
  ) => {
    setUpdatingScore((prev) => ({ ...prev, [matchId]: true }));
    try {
      await endpoints.deleteMatchEvent(matchId, playerId, type);
      await refreshData();
    } catch (error: unknown) {
      setError(
        (error instanceof Error
          ? error.message
          : t("peladas.matches.error.record_event_failed")) as string,
      );
      throw error;
    } finally {
      setUpdatingScore((prev) => ({ ...prev, [matchId]: false }));
    }
  };

  const recordEvent = async (
    matchId: number,
    playerId: number,
    type: "assist" | "goal" | "own_goal",
  ) => {
    setUpdatingScore((prev) => ({ ...prev, [matchId]: true }));
    try {
      await endpoints.createMatchEvent(matchId, playerId, type);
      await refreshData();
    } catch (error: unknown) {
      setError(
        (error instanceof Error
          ? error.message
          : t("peladas.matches.error.record_event_failed")) as string,
      );
      throw error;
    } finally {
      setUpdatingScore((prev) => ({ ...prev, [matchId]: false }));
    }
  };

  const addPlayerToTeam = async (
    matchId: number,
    teamId: number,
    playerId: number,
  ) => {
    try {
      await endpoints.addMatchLineupPlayer(matchId, teamId, playerId);
      await refreshData();
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : t("peladas.matches.error.add_player_failed"),
      );
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
    try {
      await endpoints.replaceMatchLineupPlayer(
        matchId,
        teamId,
        outPlayerId,
        inPlayerId,
      );
      await refreshData();
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : t("peladas.matches.error.replace_player_failed"),
      );
    } finally {
      setSelectMenu(null);
    }
  };

  const handleClosePelada = async (isPeladaClosed: boolean) => {
    if (!peladaId || isPeladaClosed) return;
    if (!window.confirm(t("peladas.matches.confirm_close_pelada"))) return;
    setClosing(true);
    try {
      await endpoints.closePelada(peladaId);
      setPelada((prev: Pelada | null) =>
        prev ? { ...prev, status: "closed" } : null,
      );
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : t("peladas.matches.error.close_failed"),
      );
    } finally {
      setClosing(false);
    }
  };

  const endMatch = async (matchId: number) => {
    const match = matchesRef.current.find((m) => m.id === matchId);
    if (!match) return;
    if (!window.confirm(t("peladas.matches.confirm_end_match"))) return;
    setUpdatingScore((prev) => ({ ...prev, [matchId]: true }));
    try {
      await endpoints.updateMatchScore(
        matchId,
        match.home_score ?? 0,
        match.away_score ?? 0,
        "finished",
      );
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, status: "finished" } : m)),
      );
      await refreshData();
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : t("peladas.matches.error.end_match_failed"),
      );
    } finally {
      setUpdatingScore((prev) => ({ ...prev, [matchId]: false }));
    }
  };

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
    handleClosePelada,
    endMatch,
  };
}