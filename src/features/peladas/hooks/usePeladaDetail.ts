import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  type DragEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../../shared/api/client";
import {
  createApi,
  type Pelada,
  type Team,
  type Player,
  type VotingInfo,
  type User,
} from "../../../shared/api/endpoints";
import { useAuth } from "../../../app/providers/AuthContext";

const endpoints = createApi(api);

export type TeamWithPlayers = Team & { players: (Player & { user: User })[] };

export function usePeladaDetail(peladaId: number) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [pelada, setPelada] = useState<Pelada | null>(null);
  const [teams, setTeams] = useState<TeamWithPlayers[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<
    Record<number, (Player & { user: User })[]>
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

  // Dialog State
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [matchesPerTeam, setMatchesPerTeam] = useState("2");

  const fetchPeladaData = useCallback(async () => {
    if (!peladaId) return;
    try {
      const data = await endpoints.getPeladaFullDetails(peladaId);

      if (data.pelada.status === "attendance") {
        navigate(`/peladas/${peladaId}/attendance`);
        return;
      }

      setPelada(data.pelada);
      setTeams(data.teams);
      setAvailablePlayers(data.available_players);
      setVotingInfo(data.voting_info);
      if (data.scores) setScores(data.scores);

      const playersByTeam: Record<number, (Player & { user: User })[]> = {};
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
  }, [peladaId, navigate, t]);

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

  const benchPlayers = useMemo(
    () => availablePlayers.filter((p) => !assignedIds.has(p.id)),
    [availablePlayers, assignedIds],
  );

  const stats = useMemo(() => {
    const allPlayers = [...benchPlayers, ...Object.values(teamPlayers).flat()];
    const totalPlayers = allPlayers.length;

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
  }, [benchPlayers, teamPlayers, scores]);

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
    if (sourceTeamId == null) return; // already bench
    setProcessing(true);
    try {
      await endpoints.removePlayerFromTeam(sourceTeamId, playerId);
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
      }
      await endpoints.addPlayerToTeam(targetTeamId, playerId);
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

  const handleRandomizeTeams = async () => {
    if (!peladaId || !pelada?.players_per_team || processing) return;
    setProcessing(true);
    try {
      const teamPlayerIds = Object.values(teamPlayers)
        .flat()
        .map((p) => p.id);
      const benchPlayerIds = benchPlayers.map((p) => p.id);
      const allPlayerIds = [...benchPlayerIds, ...teamPlayerIds];

      await api.post(`/api/peladas/${peladaId}/teams/randomize`, {
        player_ids: allPlayerIds,
        players_per_team: pelada.players_per_team,
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
      if (matches > 0) {
        await endpoints.beginPelada(peladaId, matches);
        navigate(`/peladas/${peladaId}/matches`);
      }
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

  return {
    pelada,
    teams,
    teamPlayers,
    availablePlayers,
    benchPlayers,
    votingInfo,
    scores,
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
    handleRandomizeTeams,
    handleBeginPelada,
    handleCreateTeam,
    handleDeleteTeam,
  };
}
