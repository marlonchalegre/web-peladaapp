import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type DragEvent,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../../shared/api/client";
import {
  createApi,
  type Pelada,
  type Team,
  type Player,
  type VotingInfo,
  type User,
  type Transaction,
  type DrawAlgorithm,
  type DrawJustification,
  type RandomizeTeamsResponse,
} from "../../../shared/api/endpoints";
import { useAuth } from "../../../app/providers/AuthContext";
import { distinctById, sortPlayersByPosition } from "../utils/playerUtils";

const endpoints = createApi(api);

export type TeamWithPlayers = Team & {
  players: (Player & { user: User; is_goalkeeper?: boolean })[];
};

const drawJustificationStorageKey = (peladaId: string) =>
  `pelada_draw_justification_${peladaId}`;

function readDrawJustification(peladaId: string): DrawJustification | null {
  if (typeof window === "undefined" || !peladaId) return null;
  try {
    const saved = sessionStorage.getItem(drawJustificationStorageKey(peladaId));
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function writeDrawJustification(
  peladaId: string,
  value: DrawJustification | null,
) {
  if (typeof window === "undefined" || !peladaId) return;
  try {
    const key = drawJustificationStorageKey(peladaId);
    if (value) {
      sessionStorage.setItem(key, JSON.stringify(value));
    } else {
      sessionStorage.removeItem(key);
    }
  } catch {
    // ignore storage errors
  }
}

export function usePeladaDetail(peladaId: string) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isProcessingRef = useRef(false);

  const [pelada, setPelada] = useState<Pelada | null>(null);
  const [teams, setTeams] = useState<TeamWithPlayers[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<
    (Player & { user: User })[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [drawJustification, setDrawJustification] =
    useState<DrawJustification | null>(() => readDrawJustification(peladaId));

  const updateDrawJustification = useCallback(
    (value: DrawJustification | null) => {
      setDrawJustification(value);
      writeDrawJustification(peladaId, value);
    },
    [peladaId],
  );

  const dismissDrawJustification = useCallback(() => {
    updateDrawJustification(null);
  }, [updateDrawJustification]);

  const [changingStatus, setChangingStatus] = useState(false);
  const [live, setLive] = useState("");
  const [votingInfo, setVotingInfo] = useState<VotingInfo | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [peladaTransactions, setPeladaTransactions] = useState<Transaction[]>(
    [],
  );

  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [matchesPerTeam, setMatchesPerTeam] = useState("2");

  const teamPlayers = useMemo(() => {
    const playersByTeam: Record<
      string,
      (Player & { user: User; is_goalkeeper?: boolean })[]
    > = {};
    for (const team of teams) {
      playersByTeam[team.id] = team.players || [];
    }
    return playersByTeam;
  }, [teams]);

  const fetchPeladaData = useCallback(async () => {
    if (!peladaId) return;
    try {
      const data = await endpoints.getPeladaFullDetails(peladaId);
      const isMatchesPage = location.pathname.endsWith("/matches");

      if (data.pelada.status === "attendance") {
        navigate(`/peladas/${peladaId}/attendance`);
        return;
      }

      const status = data.pelada.status || "";
      if (status === "running" && !isMatchesPage) {
        navigate(`/peladas/${peladaId}/matches`);
        return;
      }

      if (status === "voting" && !isMatchesPage) {
        navigate(`/peladas/${peladaId}/voting`);
        return;
      }

      if (status === "closed" && !isMatchesPage) {
        navigate(`/peladas/${peladaId}/results`);
        return;
      }

      setPelada(data.pelada);
      const dedupedTeams = (data.teams || []).map((team) => ({
        ...team,
        players: sortPlayersByPosition(distinctById(team.players)),
      }));
      setTeams(dedupedTeams);
      setAvailablePlayers(distinctById(data.available_players));
      setVotingInfo(data.voting_info);
      setPeladaTransactions(data.pelada_transactions || []);
      if (data.scores) setScores(data.scores);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("peladas.detail.error.load_failed");
      setError(message);
    }
  }, [peladaId, navigate, t, location.pathname]);

  useEffect(() => {
    fetchPeladaData();
  }, [fetchPeladaData, user]);

  const assignedIds = useMemo(
    () =>
      new Set(
        Object.values(teamPlayers)
          .flat()
          .map((tp) => tp.id),
      ),
    [teamPlayers],
  );

  const globalGkIds = useMemo(() => {
    return new Set(
      [
        pelada?.home_fixed_goalkeeper_id,
        pelada?.away_fixed_goalkeeper_id,
      ].filter(Boolean) as string[],
    );
  }, [pelada?.home_fixed_goalkeeper_id, pelada?.away_fixed_goalkeeper_id]);

  const benchPlayers = useMemo(
    () =>
      sortPlayersByPosition(
        availablePlayers.filter(
          (p) => !assignedIds.has(p.id) && !globalGkIds.has(p.id),
        ),
      ),
    [availablePlayers, assignedIds, globalGkIds],
  );

  const homeGk = useMemo(() => {
    if (!pelada?.home_fixed_goalkeeper_id) return null;
    return (
      availablePlayers.find((p) => p.id === pelada.home_fixed_goalkeeper_id) ||
      null
    );
  }, [pelada?.home_fixed_goalkeeper_id, availablePlayers]);

  const awayGk = useMemo(() => {
    if (!pelada?.away_fixed_goalkeeper_id) return null;
    return (
      availablePlayers.find((p) => p.id === pelada.away_fixed_goalkeeper_id) ||
      null
    );
  }, [pelada?.away_fixed_goalkeeper_id, availablePlayers]);

  function onDragStartPlayer(
    e: DragEvent<HTMLElement>,
    playerId: string,
    sourceTeamId: string | null,
  ) {
    if (processing) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ playerId, sourceTeamId }),
    );
    e.dataTransfer.effectAllowed = "move";
  }

  function parseDrag(
    e: DragEvent<HTMLElement>,
  ): { playerId: string; sourceTeamId: string | null } | null {
    try {
      const data = e.dataTransfer.getData("application/json");
      if (!data) return null;
      const obj = JSON.parse(data);
      return {
        playerId: String(obj.playerId),
        sourceTeamId:
          obj.sourceTeamId == null ? null : String(obj.sourceTeamId),
      };
    } catch {
      return null;
    }
  }

  const withProcessingLock = useCallback(
    async (action: () => Promise<void>, defaultErrorMessage?: string) => {
      if (isProcessingRef.current || processing) return;
      isProcessingRef.current = true;
      setProcessing(true);
      try {
        await action();
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : defaultErrorMessage ||
              t("peladas.detail.error.action_failed", "Ação falhou");
        setError(message);
      } finally {
        isProcessingRef.current = false;
        setProcessing(false);
      }
    },
    [processing, t],
  );

  const detachPlayerFromSource = (
    playerId: string,
    sourceTeamId: string | null,
  ): Promise<unknown> | null => {
    if (sourceTeamId != null) {
      return endpoints.removePlayerFromTeam(sourceTeamId, playerId);
    }
    if (playerId === pelada?.home_fixed_goalkeeper_id) {
      return api.put(`/api/peladas/${peladaId}`, {
        home_fixed_goalkeeper_id: null,
      });
    }
    if (playerId === pelada?.away_fixed_goalkeeper_id) {
      return api.put(`/api/peladas/${peladaId}`, {
        away_fixed_goalkeeper_id: null,
      });
    }
    return null;
  };

  const dropToBench = async (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation?.();
    return withProcessingLock(async () => {
      const data = parseDrag(e);
      if (!data) return;
      const { playerId, sourceTeamId } = data;

      const detachPromise = detachPlayerFromSource(playerId, sourceTeamId);
      if (detachPromise) await detachPromise;
      await fetchPeladaData();
      setLive(t("peladas.detail.live.moved_to_bench", { playerId }));
    }, t("peladas.detail.error.move_to_bench_failed"));
  };

  const dropToTeam = async (
    e: DragEvent<HTMLElement>,
    targetTeamId: string,
  ) => {
    e.preventDefault();
    e.stopPropagation?.();
    return withProcessingLock(async () => {
      const data = parseDrag(e);
      if (!data || data.sourceTeamId === targetTeamId) return;
      const { playerId, sourceTeamId } = data;

      const detachPromise = detachPlayerFromSource(playerId, sourceTeamId);
      if (detachPromise) await detachPromise;
      await endpoints.addPlayerToTeam(targetTeamId, playerId, false);
      await fetchPeladaData();
      const tName =
        teams.find((team) => team.id === targetTeamId)?.name ||
        String(targetTeamId);
      setLive(
        t("peladas.detail.live.moved_to_team", { playerId, teamName: tName }),
      );
    }, t("peladas.detail.error.move_player_failed"));
  };

  const dropToFixedGk = async (
    e: DragEvent<HTMLElement>,
    side: "home" | "away",
  ) => {
    e.preventDefault();
    e.stopPropagation?.();
    return withProcessingLock(async () => {
      const data = parseDrag(e);
      if (!data) return;
      const { playerId, sourceTeamId } = data;

      if (sourceTeamId != null) {
        await endpoints.removePlayerFromTeam(sourceTeamId, playerId);
      }

      const update =
        side === "home"
          ? { home_fixed_goalkeeper_id: playerId }
          : { away_fixed_goalkeeper_id: playerId };

      await api.put(`/api/peladas/${peladaId}`, update);
      await fetchPeladaData();
    }, t("peladas.detail.error.set_goalkeeper_failed"));
  };

  const removeFixedGk = async (side: "home" | "away") => {
    return withProcessingLock(async () => {
      const update =
        side === "home"
          ? { home_fixed_goalkeeper_id: null }
          : { away_fixed_goalkeeper_id: null };

      await api.put(`/api/peladas/${peladaId}`, update);
      await fetchPeladaData();
    }, t("peladas.detail.error.remove_player_failed"));
  };

  const handleSetGoalkeeper = async (teamId: string, playerId: string) => {
    return withProcessingLock(async () => {
      await endpoints.removePlayerFromTeam(teamId, playerId);
      await endpoints.addPlayerToTeam(teamId, playerId, true);
      await fetchPeladaData();
    }, t("peladas.detail.error.set_goalkeeper_failed"));
  };

  const handleRemovePlayer = async (teamId: string, playerId: string) => {
    return withProcessingLock(async () => {
      await endpoints.removePlayerFromTeam(teamId, playerId);
      await fetchPeladaData();
    }, t("peladas.detail.error.remove_player_failed"));
  };

  const handleUpdatePlayersPerTeam = async (count: number) => {
    if (!peladaId) return;
    return withProcessingLock(async () => {
      await api.put(`/api/peladas/${peladaId}`, {
        players_per_team: count,
      });
      await fetchPeladaData();
    }, t("peladas.detail.error.update_failed"));
  };

  const handleUpdateNumTeams = async (count: number) => {
    if (!peladaId) return;
    return withProcessingLock(async () => {
      await api.put(`/api/peladas/${peladaId}`, {
        num_teams: count,
      });
      await fetchPeladaData();
    }, t("peladas.detail.error.update_failed"));
  };

  const handleRandomizeTeams = async (options: {
    algorithm: DrawAlgorithm;
    useHistory: boolean;
  }) => {
    if (!peladaId || processing) return;
    const playersPerTeam = pelada?.players_per_team || 5;
    const numTeams = pelada?.num_teams || teams.length || 2;
    setProcessing(true);
    try {
      const teamPlayerIds = Object.values(teamPlayers)
        .flat()
        .map((p) => p.id);
      const benchPlayerIds = benchPlayers.map((p) => p.id);
      const allPlayerIds = [...benchPlayerIds, ...teamPlayerIds];

      // Only used for peladas assembled by hand: the draw prefers the
      // confirmed attendance it reads server-side.
      const response = await api.post<RandomizeTeamsResponse>(
        `/api/peladas/${peladaId}/teams/randomize`,
        {
          player_ids: allPlayerIds,
          players_per_team: playersPerTeam,
          num_teams: numTeams,
          algorithm: options.algorithm,
          use_history: options.useHistory,
        },
      );
      updateDrawJustification(response?.justification ?? null);
      await fetchPeladaData();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("peladas.detail.error.randomize_failed");
      setError(message);
      updateDrawJustification(null);
    } finally {
      setProcessing(false);
    }
  };

  const handleBeginPelada = async () => {
    if (!peladaId || processing) return;
    setChangingStatus(true);
    try {
      const matches = parseInt(matchesPerTeam, 10);
      await endpoints.beginPelada(peladaId, isNaN(matches) ? 0 : matches);
      navigate(`/peladas/${peladaId}/matches`);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("peladas.detail.error.start_failed");
      setError(message);
    } finally {
      setChangingStatus(false);
      setStartDialogOpen(false);
    }
  };

  const handleCreateTeam = async (name: string) => {
    return withProcessingLock(async () => {
      await endpoints.createTeam({ pelada_id: peladaId, name });
      await fetchPeladaData();
    }, t("peladas.detail.error.create_team_failed"));
  };

  const handleDeleteTeam = async (teamId: string) => {
    return withProcessingLock(async () => {
      await endpoints.deleteTeam(teamId);
      await fetchPeladaData();
    }, t("peladas.detail.error.delete_team_failed"));
  };

  const handleToggleFixedGoalkeepers = async (enabled: boolean) => {
    return withProcessingLock(async () => {
      const payload: Partial<Pelada> = {
        fixed_goalkeepers: enabled,
      };

      if (!enabled) {
        payload.home_fixed_goalkeeper_id = null;
        payload.away_fixed_goalkeeper_id = null;
      }

      await api.put(`/api/peladas/${peladaId}`, payload);
      await fetchPeladaData();
    }, t("peladas.detail.error.update_failed"));
  };

  const handleAddPlayersFromOrg = useCallback(
    async (playerIds: string[]) => {
      return withProcessingLock(async () => {
        await endpoints.batchUpdateAttendance(peladaId, playerIds, "confirmed");
        await fetchPeladaData();
      }, t("peladas.detail.error.update_failed"));
    },
    [withProcessingLock, peladaId, fetchPeladaData, t],
  );

  const handleRemovePlayerFromPelada = useCallback(
    async (playerId: string) => {
      return withProcessingLock(
        async () => {
          await endpoints.updateAttendance(peladaId, "declined", playerId);
          await fetchPeladaData();
        },
        t(
          "peladas.detail.error.remove_player_failed",
          "Falha ao remover jogador da pelada",
        ),
      );
    },
    [withProcessingLock, peladaId, fetchPeladaData, t],
  );

  const handleMarkPaid = async (playerId: string, amount: number) => {
    if (!pelada) return;
    try {
      setProcessing(true);
      const peladaDate = pelada.scheduled_at
        ? new Date(pelada.scheduled_at).toLocaleDateString(
            i18n?.language || "pt-BR",
          )
        : peladaId;

      await endpoints.addTransaction(pelada.organization_id, {
        player_id: playerId,
        pelada_id: peladaId,
        amount,
        type: "income",
        category: "diarista_fee",
        description: `Pagamento Pelada ${peladaDate}`,
        payment_date: new Date().toISOString().split("T")[0],
      });
      await fetchPeladaData();
    } catch (error: unknown) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : t("organizations.management.finance.transactions.error.add_failed");
      setError(message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReversePayment = async (playerId: string) => {
    if (!pelada) return;
    try {
      setProcessing(true);
      const existingTx = peladaTransactions.find(
        (tx) =>
          tx.player_id === playerId &&
          tx.type === "income" &&
          tx.category === "diarista_fee" &&
          tx.status === "paid",
      );

      if (existingTx) {
        await endpoints.reverseTransaction(
          pelada.organization_id,
          existingTx.id,
        );
        await fetchPeladaData();
      }
    } catch (error: unknown) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : t(
              "organizations.management.finance.transactions.error.reverse_failed",
            );
      setError(message);
    } finally {
      setProcessing(false);
    }
  };

  const handlePerformSwap = async (
    incomingPlayerId: string,
    targetTeamId: string,
    sourceTeamId: string | null,
    playerToReplaceId: string,
  ) => {
    return withProcessingLock(async () => {
      const removePromises: Promise<unknown>[] = [
        endpoints.removePlayerFromTeam(targetTeamId, playerToReplaceId),
      ];
      const detachPromise = detachPlayerFromSource(
        incomingPlayerId,
        sourceTeamId,
      );
      if (detachPromise) {
        removePromises.push(detachPromise);
      }
      await Promise.all(removePromises);

      const addPromises: Promise<unknown>[] = [
        endpoints.addPlayerToTeam(targetTeamId, incomingPlayerId, false),
      ];
      if (sourceTeamId != null) {
        addPromises.push(
          endpoints.addPlayerToTeam(sourceTeamId, playerToReplaceId, false),
        );
      }
      await Promise.all(addPromises);

      await fetchPeladaData();
    }, "Swap failed");
  };

  const allPlayerIdsInPelada = useMemo(() => {
    const ids = new Set<string>();
    Object.values(teamPlayers)
      .flat()
      .forEach((p) => ids.add(p.id));
    availablePlayers.forEach((p) => ids.add(p.id));
    if (pelada?.home_fixed_goalkeeper_id)
      ids.add(pelada.home_fixed_goalkeeper_id);
    if (pelada?.away_fixed_goalkeeper_id)
      ids.add(pelada.away_fixed_goalkeeper_id);
    return Array.from(ids);
  }, [
    teamPlayers,
    availablePlayers,
    pelada?.home_fixed_goalkeeper_id,
    pelada?.away_fixed_goalkeeper_id,
  ]);

  return {
    pelada,
    teams,
    teamPlayers,
    availablePlayers,
    benchPlayers,
    homeGk,
    awayGk,
    votingInfo,
    scores,
    peladaTransactions,
    error,
    processing,
    changingStatus,
    live,
    startDialogOpen,
    setStartDialogOpen,
    matchesPerTeam,
    setMatchesPerTeam,
    onDragStartPlayer,
    dropToBench,
    dropToTeam,
    dropToFixedGk,
    removeFixedGk,
    handleSetGoalkeeper,
    handleRemovePlayer,
    handleRandomizeTeams,
    drawJustification,
    dismissDrawJustification,
    handleBeginPelada,
    handleCreateTeam,
    handleDeleteTeam,
    handlePerformSwap,
    handleToggleFixedGoalkeepers,
    handleUpdatePlayersPerTeam,
    handleUpdateNumTeams,
    handleAddPlayersFromOrg,
    handleRemovePlayerFromPelada,
    handleMarkPaid,
    handleReversePayment,
    allPlayerIdsInPelada,
    fetchPeladaData,
  };
}
