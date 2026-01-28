import { useCallback, useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";
import { useParams, Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Alert,
  Button,
  Stack,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import HistoryIcon from "@mui/icons-material/History";
import { api } from "../../../shared/api/client";
import {
  createApi,
  type Pelada,
  type Team,
  type Player,
  type VotingInfo,
  type User,
  type NormalizedScoresResponse,
} from "../../../shared/api/endpoints";
import { useAuth } from "../../../app/providers/AuthContext";
import TeamsSection from "../components/TeamsSection";
import AvailablePlayersPanel from "../components/AvailablePlayersPanel";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../shared/components/Loading";

const endpoints = createApi(api);

type TeamWithPlayers = Team & { players: (Player & { user: User })[] };

export default function PeladaDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const peladaId = Number(id);
  const [pelada, setPelada] = useState<Pelada | null>(null);
  const [teams, setTeams] = useState<TeamWithPlayers[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<
    Record<number, (Player & { user: User })[]>
  >({});
  const [availablePlayers, setAvailablePlayers] = useState<
    (Player & { user: User })[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [live, setLive] = useState("");
  const [votingInfo, setVotingInfo] = useState<VotingInfo | null>(null);

  // Scores state
  const [scores, setScores] = useState<Record<number, number>>({});

  // Start Pelada Dialog State
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [matchesPerTeam, setMatchesPerTeam] = useState("2");

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

  // Fetch normalized scores whenever players change
  useEffect(() => {
    const allPlayers = [...benchPlayers, ...Object.values(teamPlayers).flat()];
    if (allPlayers.length === 0) return;

    const ids = allPlayers.map((p) => p.id);
    api
      .post<NormalizedScoresResponse>("/api/scores/normalized", {
        player_ids: ids,
      })
      .then((res) => {
        if (res.scores) setScores(res.scores);
      })
      .catch((err) => console.error("Error fetching scores:", err));
  }, [benchPlayers, teamPlayers]);

  useEffect(() => {
    fetchPeladaData();
  }, [fetchPeladaData, user]);

  // Stats Calculation
  const { totalPlayers, averagePelada, balance } = useMemo(() => {
    const allPlayers = [...benchPlayers, ...Object.values(teamPlayers).flat()];
    const totalPlayers = allPlayers.length;

    // Average Pelada
    const validScores = allPlayers
      .map((p) => scores[p.id] ?? p.grade)
      .filter((s): s is number => typeof s === "number");

    const averagePelada =
      validScores.length > 0
        ? validScores.reduce((a, b) => a + b, 0) / validScores.length
        : 0;

    // Balance Calculation (Heuristic based on team averages variance)
    // If no teams or 1 team, balance is 100% or 0? Let's say 100% if empty, 0 if 1 team?
    // Usually balance compares teams.
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

      // Simple variance or range based balance
      const max = Math.max(...teamAvgs);
      const min = Math.min(...teamAvgs);
      // If max is 0 (all 0), balance 100
      if (max === 0) {
        balance = 100;
      } else {
        // Difference percentage relative to max?
        // Or specific formula: 100 - (diff * factor)
        // Let's use (min / max) * 100 for now as a simple ratio
        balance = Math.round((min / max) * 100);
      }
    } else if (teamIds.length <= 1) {
      balance = 100; // Or 0? "N/A"
    }

    return { totalPlayers, averagePelada, balance };
  }, [benchPlayers, teamPlayers, scores]);

  function onDragStartPlayer(
    e: DragEvent<HTMLElement>,
    playerId: number,
    sourceTeamId: number | null,
  ) {
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

  async function dropToBench(e: DragEvent<HTMLElement>) {
    e.preventDefault();
    const data = parseDrag(e);
    if (!data) return;
    const { playerId, sourceTeamId } = data;
    if (sourceTeamId == null) return; // already bench
    try {
      await endpoints.removePlayerFromTeam(sourceTeamId, playerId);
      await fetchPeladaData(); // Refresh all data
      setLive(t("peladas.detail.live.moved_to_bench", { playerId }));
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("peladas.detail.error.move_to_bench_failed");
      setError(message);
    }
  }

  async function dropToTeam(e: DragEvent<HTMLElement>, targetTeamId: number) {
    e.preventDefault();
    const data = parseDrag(e);
    if (!data) return;
    const { playerId, sourceTeamId } = data;
    if (sourceTeamId === targetTeamId) return;
    try {
      if (sourceTeamId != null) {
        await endpoints.removePlayerFromTeam(sourceTeamId, playerId);
      }
      await endpoints.addPlayerToTeam(targetTeamId, playerId);
      await fetchPeladaData(); // Refresh all data
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
    }
  }

  async function handleRandomizeTeams() {
    if (!peladaId || !pelada?.players_per_team) return;
    try {
      const playerIds = benchPlayers.map((p) => p.id);
      await api.post(`/api/peladas/${peladaId}/teams/randomize`, {
        player_ids: playerIds,
        players_per_team: pelada.players_per_team,
      });
      await fetchPeladaData(); // Refresh all data after randomization
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("peladas.detail.error.randomize_failed");
      setError(message);
    }
  }

  async function handleBeginPelada() {
    if (!peladaId) return;
    setChangingStatus(true);
    try {
      const matches = parseInt(matchesPerTeam, 10);
      if (matches > 0) {
        await endpoints.beginPelada(peladaId, matches);
        await fetchPeladaData();
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
  }

  if (error)
    return (
      <Container>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  if (!pelada) return <Loading message={t("common.loading")} />;

  return (
    <Container maxWidth="xl" sx={{ pb: 4 }}>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          pt: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton
            component={RouterLink}
            to={`/organizations/${pelada.organization_id}`}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography
              variant="overline"
              display="block"
              color="text.secondary"
              sx={{ lineHeight: 1 }}
            >
              {t("common.organization")}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: "bold" }}>
              {t("peladas.detail.title", { id: pelada.id })}
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            component={RouterLink}
            to={`/peladas/${peladaId}/matches`}
            variant="outlined"
            startIcon={<HistoryIcon />}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            {t("peladas.detail.button.view_matches")}
          </Button>

          {pelada.status === "open" && (
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={() => setStartDialogOpen(true)}
              disabled={changingStatus}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                bgcolor: "primary.dark", // Deep blue
                fontWeight: "bold",
              }}
            >
              {t("peladas.detail.button.start_pelada")}
            </Button>
          )}

          {votingInfo?.can_vote && (
            <Button
              component={RouterLink}
              to={`/peladas/${peladaId}/voting`}
              variant="contained"
              color={votingInfo.has_voted ? "success" : "secondary"}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              {votingInfo.has_voted
                ? t("peladas.detail.button.change_votes")
                : t("peladas.detail.button.vote")}
            </Button>
          )}
        </Stack>
      </Box>

      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {live}
      </div>

      {pelada.status === "closed" &&
        votingInfo &&
        !votingInfo.can_vote &&
        votingInfo.message && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {votingInfo.message}
          </Alert>
        )}

      {/* Main Layout */}
      <Grid container spacing={4}>
        {/* Left Column: Teams */}
        <Grid size={{ xs: 12, lg: 9 }}>
          <TeamsSection
            teams={teams}
            teamPlayers={teamPlayers}
            playersPerTeam={pelada.players_per_team ?? undefined}
            creatingTeam={creatingTeam}
            locked={pelada.status !== "open"}
            onCreateTeam={async (name) => {
              setCreatingTeam(true);
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
                setCreatingTeam(false);
              }
            }}
            onDeleteTeam={async (teamId) => {
              try {
                await endpoints.deleteTeam(teamId);
                await fetchPeladaData();
              } catch (error: unknown) {
                const message =
                  error instanceof Error
                    ? error.message
                    : t("peladas.detail.error.delete_team_failed");
                setError(message);
              }
            }}
            onDragStartPlayer={onDragStartPlayer}
            dropToTeam={dropToTeam}
            onRandomizeTeams={handleRandomizeTeams}
            scores={scores}
          />
        </Grid>

        {/* Right Column: Sidebar */}
        <Grid size={{ xs: 12, lg: 3 }}>
          <AvailablePlayersPanel
            players={benchPlayers}
            scores={scores}
            onDropToBench={dropToBench}
            onDragStartPlayer={(e, pid) => onDragStartPlayer(e, pid, null)}
            locked={pelada.status !== "open"}
            totalPlayersInPelada={totalPlayers}
            averagePelada={averagePelada}
            balance={balance}
          />
        </Grid>
      </Grid>

      {/* Start Pelada Dialog */}
      <Dialog open={startDialogOpen} onClose={() => setStartDialogOpen(false)}>
        <DialogTitle>{t("peladas.dialog.start.title")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t("peladas.dialog.start.matches_per_team")}
            type="number"
            fullWidth
            variant="outlined"
            value={matchesPerTeam}
            onChange={(e) => setMatchesPerTeam(e.target.value)}
            inputProps={{ min: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStartDialogOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            disabled={!matchesPerTeam || parseInt(matchesPerTeam) <= 0}
            onClick={handleBeginPelada}
          >
            {t("common.start")}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
