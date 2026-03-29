import {
  useState,
  useCallback,
  useEffect,
  useMemo,
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
  type OrganizationFinance,
} from "../../../shared/api/endpoints";
import { useAuth } from "../../../app/providers/AuthContext";

const endpoints = createApi(api);

export type TeamWithPlayers = Team & {
  players: (Player & { user: User; is_goalkeeper?: boolean })[];
};

export function usePeladaDetail(peladaId: number) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [pelada, setPelada] = useState<Pelada | null>(null);
  const [teams, setTeams] = useState<TeamWithPlayers[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<
    Record<number, (Player & { user: User; is_goalkeeper?: boolean })[]>
  >({});
  const [availablePlayers, setAvailablePlayers] = useState<
    (Player & { user: User })[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [live, setLive] = useState("");
  const [votingInfo, setVotingInfo] = useState<VotingInfo | null>(null);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [peladaTransactions, setPeladaTransactions] = useState<Transaction[]>(
    [],
  );
  const [organizationFinance, setOrganizationFinance] =
    useState<OrganizationFinance | null>(null);

  // Dialog State
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [matchesPerTeam, setMatchesPerTeam] = useState("2");

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
      setTeams(data.teams);
      setAvailablePlayers(data.available_players);
      setVotingInfo(data.voting_info);
      setPeladaTransactions(data.pelada_transactions || []);
      if (data.scores) setScores(data.scores);

      try {
        const finance = await endpoints.getOrganizationFinance(
          data.pelada.organization_id,
        );
        setOrganizationFinance(finance);
      } catch (e) {
        console.error("Failed to load finance settings", e);
      }

      const playersByTeam: Record<
        number,
        (Player & { user: User; is_goalkeeper?: boolean })[]
      > = {};
      for (const t of data.teams) {
        playersByTeam[t.id] = t.players;
      }
      setTeamPlayers(playersByTeam);
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
      ].filter(Boolean) as number[],
    );
  }, [pelada]);

  const benchPlayers = useMemo(
    () =>
      availablePlayers.filter(
        (p) => !assignedIds.has(p.id) && !globalGkIds.has(p.id),
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

  const stats = useMemo(() => {
    const allPlayers = [...benchPlayers, ...Object.values(teamPlayers).flat()];
    const totalPlayers = allPlayers.length + globalGkIds.size;

    const validScores = allPlayers
      .map((p) => scores[p.id] ?? p.grade)
      .filter((s): s is number => typeof s === "number");

    const averagePelada =
      validScores.length > 0
        ? validScores.reduce((a, b) => a + b, 0) / validScores.length
        : 0;

    let balance = 0;
    const teamIds = Object.keys(teamPlayers).map(Number);
    if (teamIds.length > 1) {
      const teamAvgs = teamIds.map((tid) => {
        const tps = teamPlayers[tid];
        const tScores = tps
          .map((p) => scores[p.id] ?? p.grade)
          .filter((s): s is number => typeof s === "number");
        return tScores.length > 0
          ? tScores.reduce((a, b) => a + b, 0) / tScores.length
          : 0;
      });

      const max = Math.max(...teamAvgs);
      const min = Math.min(...teamAvgs);
      if (max === 0) {
        balance = 100;
      } else {
        balance = Math.round((min / max) * 100);
      }
    } else if (teamIds.length <= 1) {
      balance = 100;
    }

    return { totalPlayers, averagePelada, balance };
  }, [benchPlayers, teamPlayers, scores, globalGkIds]);

  function onDragStartPlayer(
    e: DragEvent<HTMLElement>,
    playerId: number,
    sourceTeamId: number | null,
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
  ): { playerId: number; sourceTeamId: number | null } | null {
    try {
      const data = e.dataTransfer.getData("application/json");
      if (!data) return null;
      const obj = JSON.parse(data);
      return {
        playerId: Number(obj.playerId),
        sourceTeamId:
          obj.sourceTeamId == null ? null : Number(obj.sourceTeamId),
      };
    } catch {
      return null;
    }
  }

  const dropToBench = async (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    if (processing) return;
    const data = parseDrag(e);
    if (!data) return;
    const { playerId, sourceTeamId } = data;

    setProcessing(true);
    try {
      if (sourceTeamId != null) {
        await endpoints.removePlayerFromTeam(sourceTeamId, playerId);
      } else {
        // Might be a global GK being removed
        if (playerId === pelada?.home_fixed_goalkeeper_id) {
          await api.put(`/api/peladas/${peladaId}`, {
            home_fixed_goalkeeper_id: null,
          });
        } else if (playerId === pelada?.away_fixed_goalkeeper_id) {
          await api.put(`/api/peladas/${peladaId}`, {
            away_fixed_goalkeeper_id: null,
          });
        }
      }
      await fetchPeladaData();
      setLive(t("peladas.detail.live.moved_to_bench", { playerId }));
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("peladas.detail.error.move_to_bench_failed");
      setError(message);
    } finally {
      setProcessing(false);
    }
  };

  const dropToTeam = async (
    e: DragEvent<HTMLElement>,
    targetTeamId: number,
  ) => {
    e.preventDefault();
    if (processing) return;
    const data = parseDrag(e);
    if (!data) return;
    const { playerId, sourceTeamId } = data;
    if (sourceTeamId === targetTeamId) return;

    setProcessing(true);
    try {
      if (sourceTeamId != null) {
        await endpoints.removePlayerFromTeam(sourceTeamId, playerId);
      } else {
        // If it was a global GK, unset it
        if (playerId === pelada?.home_fixed_goalkeeper_id) {
          await api.put(`/api/peladas/${peladaId}`, {
            home_fixed_goalkeeper_id: null,
          });
        } else if (playerId === pelada?.away_fixed_goalkeeper_id) {
          await api.put(`/api/peladas/${peladaId}`, {
            away_fixed_goalkeeper_id: null,
          });
        }
      }
      await endpoints.addPlayerToTeam(targetTeamId, playerId, false);
      await fetchPeladaData();
      const tName =
        teams.find((t) => t.id === targetTeamId)?.name || String(targetTeamId);
      setLive(
        t("peladas.detail.live.moved_to_team", { playerId, teamName: tName }),
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("peladas.detail.error.move_player_failed");
      setError(message);
    } finally {
      setProcessing(false);
    }
  };

  const dropToFixedGk = async (
    e: DragEvent<HTMLElement>,
    side: "home" | "away",
  ) => {
    e.preventDefault();
    if (processing) return;
    const data = parseDrag(e);
    if (!data) return;
    const { playerId, sourceTeamId } = data;

    setProcessing(true);
    try {
      if (sourceTeamId != null) {
        await endpoints.removePlayerFromTeam(sourceTeamId, playerId);
      }

      const update =
        side === "home"
          ? { home_fixed_goalkeeper_id: playerId }
          : { away_fixed_goalkeeper_id: playerId };

      await api.put(`/api/peladas/${peladaId}`, update);
      await fetchPeladaData();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("peladas.detail.error.set_goalkeeper_failed");
      setError(message);
    } finally {
      setProcessing(false);
    }
  };

  const removeFixedGk = async (side: "home" | "away") => {
    if (processing) return;
    setProcessing(true);
    try {
      const update =
        side === "home"
          ? { home_fixed_goalkeeper_id: null }
          : { away_fixed_goalkeeper_id: null };

      await api.put(`/api/peladas/${peladaId}`, update);
      await fetchPeladaData();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("peladas.detail.error.remove_player_failed");
      setError(message);
    } finally {
      setProcessing(false);
    }
  };

  const handleSetGoalkeeper = async (teamId: number, playerId: number) => {
    if (processing) return;
    setProcessing(true);
    try {
      await endpoints.removePlayerFromTeam(teamId, playerId);
      await endpoints.addPlayerToTeam(teamId, playerId, true);
      await fetchPeladaData();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("peladas.detail.error.set_goalkeeper_failed");
      setError(message);
    } finally {
      setProcessing(false);
    }
  };

  const handleRemovePlayer = async (teamId: number, playerId: number) => {
    if (processing) return;
    setProcessing(true);
    try {
      await endpoints.removePlayerFromTeam(teamId, playerId);
      await fetchPeladaData();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("peladas.detail.error.remove_player_failed");
      setError(message);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdatePlayersPerTeam = async (count: number) => {
    if (processing || !peladaId) return;
    setProcessing(true);
    try {
      await api.put(`/api/peladas/${peladaId}`, {
        players_per_team: count,
      });
      await fetchPeladaData();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("peladas.detail.error.update_failed");
      setError(message);
    } finally {
      setProcessing(false);
    }
  };

  const handleRandomizeTeams = async () => {
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

      await api.post(`/api/peladas/${peladaId}/teams/randomize`, {
        player_ids: allPlayerIds,
        players_per_team: playersPerTeam,
        num_teams: numTeams,
      });
      await fetchPeladaData();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("peladas.detail.error.randomize_failed");
      setError(message);
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
    setProcessing(true);
    try {
      await endpoints.createTeam({ pelada_id: peladaId, name });
      await fetchPeladaData();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("peladas.detail.error.create_team_failed");
      setError(message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteTeam = async (teamId: number) => {
    setProcessing(true);
    try {
      await endpoints.deleteTeam(teamId);
      await fetchPeladaData();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("peladas.detail.error.delete_team_failed");
      setError(message);
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleFixedGoalkeepers = async (enabled: boolean) => {
    if (processing) return;
    setProcessing(true);
    try {
      const payload: Partial<Pelada> = {
        fixed_goalkeepers: enabled,
      };

      if (!enabled) {
        payload.home_fixed_goalkeeper_id = null;
        payload.away_fixed_goalkeeper_id = null;
      }

      await api.put(`/api/peladas/${peladaId}`, payload);
      await fetchPeladaData();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("peladas.detail.error.update_failed");
      setError(message);
    } finally {
      setProcessing(false);
    }
  };

  const handleAddPlayersFromOrg = async (playerIds: number[]) => {
    if (processing) return;
    setProcessing(true);
    try {
      await endpoints.batchUpdateAttendance(peladaId, playerIds, "confirmed");
      await fetchPeladaData();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("peladas.detail.error.update_failed");
      setError(message);
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkPaid = async (playerId: number, amount: number) => {
    if (!pelada) return;
    try {
      setProcessing(true);
      await endpoints.addTransaction(pelada.organization_id, {
        player_id: playerId,
        pelada_id: peladaId,
        amount,
        type: "income",
        category: "diarista_fee",
        description: `Pagamento Pelada ${peladaId}`,
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

  const handleReversePayment = async (playerId: number) => {
    if (!pelada) return;
    try {
      setProcessing(true);
      const existingTx = peladaTransactions.find(
        (t) =>
          t.player_id === playerId &&
          t.type === "income" &&
          t.category === "diarista_fee" &&
          t.status === "paid",
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

  const allPlayerIdsInPelada = useMemo(() => {
    const ids = new Set<number>();
    Object.values(teamPlayers)
      .flat()
      .forEach((p) => ids.add(p.id));
    availablePlayers.forEach((p) => ids.add(p.id));
    if (pelada?.home_fixed_goalkeeper_id)
      ids.add(pelada.home_fixed_goalkeeper_id);
    if (pelada?.away_fixed_goalkeeper_id)
      ids.add(pelada.away_fixed_goalkeeper_id);
    return Array.from(ids);
  }, [teamPlayers, availablePlayers, pelada]);

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
    organizationFinance,
    error,
    processing,
    changingStatus,
    live,
    stats,
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
    handleBeginPelada,
    handleCreateTeam,
    handleDeleteTeam,
    handleToggleFixedGoalkeepers,
    handleUpdatePlayersPerTeam,
    handleAddPlayersFromOrg,
    handleMarkPaid,
    handleReversePayment,
    allPlayerIdsInPelada,
  };
}
