import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import UndoIcon from "@mui/icons-material/Undo";
import { useTranslation } from "react-i18next";
import type { Team } from "../../../shared/api/types";
import type { PlayerWithUser } from "./TeamsSection";
import {
  comparePlayersByArrival,
  formatPlayerPosition,
} from "../utils/playerUtils";

function getSnakeDraftTeamIndex(pickIdx: number, teamCount: number): number {
  if (teamCount <= 0) return 0;
  const round = Math.floor(pickIdx / teamCount);
  const offset = pickIdx % teamCount;
  return round % 2 === 0 ? offset : teamCount - 1 - offset;
}

export interface CaptainDraftDialogProps {
  open: boolean;
  onClose: () => void;
  teams: Team[];
  players: PlayerWithUser[];
  playersPerTeam: number;
  processing?: boolean;
  onConfirmDraft: (
    draftedTeams: Record<string, string[]>,
  ) => Promise<void> | void;
}

export default function CaptainDraftDialog({
  open,
  onClose,
  teams,
  players,
  playersPerTeam,
  processing = false,
  onConfirmDraft,
}: CaptainDraftDialogProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<"captains" | "draft">("captains");
  const [captains, setCaptains] = useState<(string | null)[]>([]);
  const [teamRosters, setTeamRosters] = useState<Record<string, string[]>>({});
  const [pickHistory, setPickHistory] = useState<
    { teamId: string; playerId: string }[]
  >([]);
  const prevOpenRef = useRef(false);

  useEffect(() => {
    const wasOpen = prevOpenRef.current;
    prevOpenRef.current = open;
    if (open && !wasOpen) {
      setStep("captains");
      setCaptains(teams.map(() => null));
      setTeamRosters({});
      setPickHistory([]);
    }
  }, [open, teams]);

  const playerMap = useMemo(() => {
    const map = new Map<string, PlayerWithUser>();
    players.forEach((p) => map.set(p.id, p));
    return map;
  }, [players]);

  const selectedCaptainIds = useMemo(
    () => new Set(captains.filter((id): id is string => Boolean(id))),
    [captains],
  );

  const allCaptainsSelected =
    teams.length >= 2 && captains.every((id) => Boolean(id));

  const handleToggleCaptain = (playerId: string) => {
    const existingIdx = captains.indexOf(playerId);
    if (existingIdx >= 0) {
      const next = [...captains];
      next[existingIdx] = null;
      setCaptains(next);
      return;
    }
    const emptyIdx = captains.findIndex((id) => id === null);
    if (emptyIdx >= 0) {
      const next = [...captains];
      next[emptyIdx] = playerId;
      setCaptains(next);
    }
  };

  const handleAutoPickCaptains = (mode: "grade" | "arrival") => {
    const sorted = [...players].sort((a, b) =>
      mode === "grade"
        ? (b.grade ?? 0) - (a.grade ?? 0)
        : comparePlayersByArrival(a, b),
    );
    setCaptains(teams.map((_, idx) => sorted[idx]?.id ?? null));
  };

  const handleStartDraft = () => {
    const initial: Record<string, string[]> = {};
    teams.forEach((team, idx) => {
      const capId = captains[idx];
      initial[team.id] = capId ? [capId] : [];
    });
    setTeamRosters(initial);
    setPickHistory([]);
    setStep("draft");
  };

  const draftedSet = useMemo(() => {
    const s = new Set<string>();
    Object.values(teamRosters).forEach((ids) => ids.forEach((id) => s.add(id)));
    return s;
  }, [teamRosters]);

  const availablePool = useMemo(
    () =>
      players
        .filter((p) => !draftedSet.has(p.id))
        .sort((a, b) => (b.grade ?? 0) - (a.grade ?? 0)),
    [players, draftedSet],
  );

  const currentTurnTeamIdx = useMemo(
    () => getSnakeDraftTeamIndex(pickHistory.length, teams.length),
    [pickHistory.length, teams.length],
  );

  const currentTeam = teams[currentTurnTeamIdx];
  const currentCaptainId = currentTeam
    ? teamRosters[currentTeam.id]?.[0]
    : undefined;
  const currentCaptain = currentCaptainId
    ? playerMap.get(currentCaptainId)
    : undefined;

  const handleDraftPlayer = (playerId: string) => {
    if (!currentTeam) return;
    setTeamRosters((prev) => ({
      ...prev,
      [currentTeam.id]: [...(prev[currentTeam.id] || []), playerId],
    }));
    setPickHistory((prev) => [...prev, { teamId: currentTeam.id, playerId }]);
  };

  const handleUndo = () => {
    if (pickHistory.length === 0) return;
    const last = pickHistory[pickHistory.length - 1];
    setPickHistory((prev) => prev.slice(0, -1));
    setTeamRosters((prev) => ({
      ...prev,
      [last.teamId]: (prev[last.teamId] || []).filter(
        (id) => id !== last.playerId,
      ),
    }));
  };

  const handleAutoFillRemaining = () => {
    const k = teams.length;
    if (k === 0) return;
    const nextRosters: Record<string, string[]> = Object.fromEntries(
      teams.map((t) => [t.id, [...(teamRosters[t.id] || [])]]),
    );
    const nextHistory = [...pickHistory];
    const maxTotal = k * playersPerTeam;
    let totalDrafted = draftedSet.size;
    let poolIdx = 0;

    while (poolIdx < availablePool.length && totalDrafted < maxTotal) {
      const teamIdx = getSnakeDraftTeamIndex(nextHistory.length, k);
      const team = teams[teamIdx];
      const nextPlayer = availablePool[poolIdx++];
      if (!team || !nextPlayer) break;
      nextRosters[team.id].push(nextPlayer.id);
      nextHistory.push({ teamId: team.id, playerId: nextPlayer.id });
      totalDrafted += 1;
    }

    setTeamRosters(nextRosters);
    setPickHistory(nextHistory);
  };

  return (
    <Dialog
      open={open}
      onClose={processing ? undefined : onClose}
      maxWidth="md"
      fullWidth
      data-testid="captain-draft-dialog"
    >
      <DialogTitle sx={{ fontWeight: 800 }}>
        {step === "captains"
          ? t(
              "peladas.teams.captain_draft_step1",
              "Tira-Time: Escolher Capitães",
            )
          : t("peladas.teams.captain_draft_step2", "Tira-Time: Snake Draft")}
      </DialogTitle>

      <DialogContent dividers>
        {step === "captains" ? (
          <Stack spacing={2}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ flexWrap: "wrap", alignItems: "center" }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ flex: 1 }}
              >
                {t(
                  "peladas.teams.captain_pick_hint",
                  "Selecione {{count}} capitães (um para cada time).",
                  { count: teams.length },
                )}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AutoFixHighIcon />}
                onClick={() => handleAutoPickCaptains("grade")}
                data-testid="auto-pick-captains-grade"
              >
                {t("peladas.teams.best_grades", "Melhores Notas")}
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleAutoPickCaptains("arrival")}
                data-testid="auto-pick-captains-arrival"
              >
                {t("peladas.teams.first_arrived", "Ordem de Chegada")}
              </Button>
            </Stack>

            <Grid container spacing={1.5}>
              {teams.map((team, idx) => {
                const capId = captains[idx];
                const cap = capId ? playerMap.get(capId) : undefined;
                return (
                  <Grid key={team.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.25,
                        borderColor: cap ? "primary.main" : "divider",
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {team.name}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {cap
                          ? cap.user?.name
                          : t("peladas.teams.select_captain", "Selecione...")}
                      </Typography>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                pt: 1,
              }}
            >
              {players.map((p) => {
                const isCap = selectedCaptainIds.has(p.id);
                return (
                  <Chip
                    key={p.id}
                    label={`${p.user?.name || "-"} (${(p.grade ?? 5).toFixed(1)})`}
                    color={isCap ? "primary" : "default"}
                    variant={isCap ? "filled" : "outlined"}
                    onClick={() => handleToggleCaptain(p.id)}
                    data-testid={`captain-candidate-${p.id}`}
                    sx={{ fontWeight: isCap ? 800 : 600 }}
                  />
                );
              })}
            </Box>
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                borderColor: "primary.main",
                bgcolor: "action.selected",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t("peladas.teams.current_pick", "VEZ DE ESCOLHER")}
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  {currentTeam?.name} —{" "}
                  {currentCaptain?.user?.name ||
                    t("peladas.teams.captain", "Capitão")}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<UndoIcon />}
                  disabled={pickHistory.length === 0}
                  onClick={handleUndo}
                >
                  {t("common.undo", "Desfazer")}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={availablePool.length === 0}
                  onClick={handleAutoFillRemaining}
                >
                  {t("peladas.teams.auto_complete", "Completar")}
                </Button>
              </Stack>
            </Paper>

            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 800 }}
              >
                {t("peladas.teams.available_to_draft", "JOGADORES DISPONÍVEIS")}{" "}
                ({availablePool.length})
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1 }}>
                {availablePool.map((p) => {
                  const pos = formatPlayerPosition(p);
                  return (
                    <Chip
                      key={p.id}
                      label={`${p.user?.name || "-"} · ${pos || "-"} (${(p.grade ?? 5).toFixed(1)})`}
                      onClick={() => handleDraftPlayer(p.id)}
                      clickable
                      data-testid={`draft-player-${p.id}`}
                    />
                  );
                })}
              </Box>
            </Box>

            <Grid container spacing={1.5}>
              {teams.map((team) => {
                const roster = teamRosters[team.id] || [];
                return (
                  <Grid key={team.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Paper variant="outlined" sx={{ p: 1.25 }}>
                      <Typography
                        variant="subtitle2"
                        gutterBottom
                        sx={{ fontWeight: 800 }}
                      >
                        {team.name} ({roster.length}/{playersPerTeam})
                      </Typography>
                      <Stack spacing={0.5}>
                        {roster.map((pid, i) => {
                          const p = playerMap.get(pid);
                          return (
                            <Typography key={pid} variant="body2">
                              {i === 0 ? "★ " : `${i + 1}. `}
                              {p?.user?.name || "-"}
                            </Typography>
                          );
                        })}
                      </Stack>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={processing}>
          {t("common.cancel", "Cancelar")}
        </Button>
        {step === "captains" ? (
          <Button
            variant="contained"
            disabled={!allCaptainsSelected}
            onClick={handleStartDraft}
            data-testid="start-snake-draft-button"
          >
            {t("peladas.teams.start_draft", "Iniciar Escolha")}
          </Button>
        ) : (
          <>
            <Button onClick={() => setStep("captains")} disabled={processing}>
              {t("common.back", "Voltar")}
            </Button>
            <Button
              variant="contained"
              disabled={processing}
              onClick={() => onConfirmDraft(teamRosters)}
              data-testid="confirm-captain-draft-button"
            >
              {t("peladas.teams.confirm_teams", "Confirmar Times")}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
