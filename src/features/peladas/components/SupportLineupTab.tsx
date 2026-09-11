import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  useTheme,
  alpha,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import VideocamIcon from "@mui/icons-material/Videocam";
import AssignmentIcon from "@mui/icons-material/Assignment";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import CasinoIcon from "@mui/icons-material/Casino";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import GroupIcon from "@mui/icons-material/Group";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import type {
  Match,
  Team,
  TeamPlayer,
  Player,
  Attendance,
} from "../../../shared/api/endpoints";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";
import PrettyConfirmDialog from "../../../shared/components/PrettyConfirmDialog";
import { resolvePlayerName, getAttendancePlayerId } from "../utils/playerUtils";

interface Props {
  matches: Match[];
  teams: Team[];
  teamPlayers: Record<string, TeamPlayer[]>;
  orgPlayerIdToUserId: Record<string, string>;
  userIdToName: Record<string, string>;
  orgPlayerIdToPlayer: Record<string, Player>;
  attendance: Attendance[];
  isAdmin: boolean;
  onGenerateAll: () => Promise<void>;
  onUpdateMatch: (
    matchId: string,
    data: {
      support_camera_player_id?: string | null;
      support_stats_player_id?: string | null;
    },
  ) => Promise<void>;
  onRerollMatch: (matchId: string) => Promise<void>;
  onNotifyWhatsApp?: () => Promise<void>;
}

export default function SupportLineupTab({
  matches,
  teams,
  teamPlayers,
  orgPlayerIdToUserId,
  userIdToName,
  orgPlayerIdToPlayer,
  attendance,
  isAdmin,
  onGenerateAll,
  onUpdateMatch,
  onRerollMatch,
  onNotifyWhatsApp,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  const [confirmRerollAllOpen, setConfirmRerollAllOpen] = useState(false);
  const [confirmNotifyOpen, setConfirmNotifyOpen] = useState(false);
  const [matchToReroll, setMatchToReroll] = useState<{
    id: string;
    sequence: number;
  } | null>(null);
  const [loadingMatchId, setLoadingMatchId] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const notifyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (notifyTimeoutRef.current) {
        clearTimeout(notifyTimeoutRef.current);
      }
    };
  }, []);

  const teamNameById = useMemo(() => {
    const m: Record<string, string> = {};
    for (const team of teams) {
      m[team.id] = team.name;
    }
    return m;
  }, [teams]);

  const playerTeamMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const [teamId, players] of Object.entries(teamPlayers)) {
      for (const p of players) {
        m[p.player_id] = teamId;
      }
    }
    return m;
  }, [teamPlayers]);

  const confirmedPlayerIds = useMemo(() => {
    const set = new Set<string>();
    for (const a of attendance) {
      const s = String(a.status || a.Status || "")
        .trim()
        .toLowerCase();
      if (s === "confirmed") {
        const pid = getAttendancePlayerId(a);
        if (pid) set.add(pid);
      }
    }
    return set;
  }, [attendance]);

  const dutyStats = useMemo(() => {
    const counts: Record<
      string,
      { camera: number; stats: number; total: number }
    > = {};

    for (const m of matches) {
      if (m.support_camera_player_id) {
        const c = counts[m.support_camera_player_id] || {
          camera: 0,
          stats: 0,
          total: 0,
        };
        c.camera += 1;
        c.total += 1;
        counts[m.support_camera_player_id] = c;
      }
      if (m.support_stats_player_id) {
        const s = counts[m.support_stats_player_id] || {
          camera: 0,
          stats: 0,
          total: 0,
        };
        s.stats += 1;
        s.total += 1;
        counts[m.support_stats_player_id] = s;
      }
    }
    return counts;
  }, [matches]);

  const getPlayerName = useCallback(
    (playerId: string) =>
      resolvePlayerName(
        playerId,
        orgPlayerIdToPlayer,
        orgPlayerIdToUserId,
        userIdToName,
        `Player #${playerId.slice(0, 6)}`,
      ),
    [orgPlayerIdToPlayer, orgPlayerIdToUserId, userIdToName],
  );

  // Helper to get eligible resting players for a specific match
  const getEligibleRestingPlayers = (match: Match) => {
    const playingTeamIds = new Set([match.home_team_id, match.away_team_id]);
    const restingTeams = teams.filter((t) => !playingTeamIds.has(t.id));
    const restingTeamIds = new Set(restingTeams.map((t) => t.id));

    const players: Array<{
      id: string;
      name: string;
      teamName: string;
      dutyCount: number;
    }> = [];

    for (const [teamId, tPlayers] of Object.entries(teamPlayers)) {
      if (restingTeamIds.has(teamId)) {
        for (const p of tPlayers) {
          if (
            confirmedPlayerIds.size === 0 ||
            confirmedPlayerIds.has(p.player_id)
          ) {
            players.push({
              id: p.player_id,
              name: getPlayerName(p.player_id),
              teamName: teamNameById[teamId] || "",
              dutyCount: dutyStats[p.player_id]?.total || 0,
            });
          }
        }
      }
    }

    return players.sort((a, b) => {
      if (a.dutyCount !== b.dutyCount) return a.dutyCount - b.dutyCount;
      return a.name.localeCompare(b.name);
    });
  };

  const handleRerollAll = async () => {
    try {
      setGeneratingAll(true);
      setActionError(null);
      await onGenerateAll();
      setConfirmRerollAllOpen(false);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Erro ao sortear");
    } finally {
      setGeneratingAll(false);
    }
  };

  const handleSwapRoles = async (match: Match) => {
    if (!match.support_camera_player_id && !match.support_stats_player_id)
      return;
    try {
      setLoadingMatchId(match.id);
      setActionError(null);
      await onUpdateMatch(match.id, {
        support_camera_player_id: match.support_stats_player_id,
        support_stats_player_id: match.support_camera_player_id,
      });
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : "Erro ao inverter funções",
      );
    } finally {
      setLoadingMatchId(null);
    }
  };

  const handleRerollMatch = async (matchId: string) => {
    try {
      setLoadingMatchId(matchId);
      setActionError(null);
      await onRerollMatch(matchId);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Erro ao re-sortear");
    } finally {
      setLoadingMatchId(null);
    }
  };

  const handleChangeCamera = async (match: Match, newPlayerId: string) => {
    try {
      setLoadingMatchId(match.id);
      setActionError(null);
      await onUpdateMatch(match.id, {
        support_camera_player_id: newPlayerId || null,
      });
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : "Erro ao alterar câmera",
      );
    } finally {
      setLoadingMatchId(null);
    }
  };

  const handleChangeStats = async (match: Match, newPlayerId: string) => {
    try {
      setLoadingMatchId(match.id);
      setActionError(null);
      await onUpdateMatch(match.id, {
        support_stats_player_id: newPlayerId || null,
      });
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : "Erro ao alterar súmula",
      );
    } finally {
      setLoadingMatchId(null);
    }
  };

  const hasSupportAssignments = matches.some((m) =>
    Boolean(m.support_camera_player_id || m.support_stats_player_id),
  );

  const handleNotifyWhatsApp = useCallback(async () => {
    if (!onNotifyWhatsApp) return;
    setNotifying(true);
    setActionError(null);
    try {
      await onNotifyWhatsApp();
      setConfirmNotifyOpen(false);
      if (notifyTimeoutRef.current) {
        clearTimeout(notifyTimeoutRef.current);
      }
      setNotifySuccess(true);
      notifyTimeoutRef.current = setTimeout(
        () => setNotifySuccess(false),
        5000,
      );
    } catch (err: unknown) {
      setActionError(
        err instanceof Error
          ? err.message
          : t(
              "peladas.support_lineup.notify_error",
              "Erro ao enviar notificação da escalação de suporte",
            ),
      );
    } finally {
      setNotifying(false);
    }
  }, [onNotifyWhatsApp, t]);

  // Players list for the duty summary bar
  const allTeamPlayersList = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      teamName: string;
      stats: { camera: number; stats: number; total: number };
    }> = [];
    const seen = new Set<string>();

    for (const [teamId, players] of Object.entries(teamPlayers)) {
      for (const p of players) {
        if (!seen.has(p.player_id)) {
          seen.add(p.player_id);
          list.push({
            id: p.player_id,
            name: getPlayerName(p.player_id),
            teamName: teamNameById[teamId] || "",
            stats: dutyStats[p.player_id] || { camera: 0, stats: 0, total: 0 },
          });
        }
      }
    }

    return list.sort((a, b) => {
      if (b.stats.total !== a.stats.total) return b.stats.total - a.stats.total;
      return a.name.localeCompare(b.name);
    });
  }, [teamPlayers, dutyStats, teamNameById, getPlayerName]);

  const [transparencyDialogOpen, setTransparencyDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<number | "all">("all");

  const distributionBuckets = useMemo(() => {
    const map: Record<number, number> = {};
    for (const p of allTeamPlayersList) {
      const count = p.stats.total;
      map[count] = (map[count] || 0) + 1;
    }
    return Object.entries(map)
      .map(([countStr, playerCount]) => ({
        dutyCount: Number(countStr),
        playerCount,
      }))
      .sort((a, b) => b.dutyCount - a.dutyCount);
  }, [allTeamPlayersList]);

  const filteredPlayers = useMemo(() => {
    return allTeamPlayersList.filter((p) => {
      if (selectedFilter !== "all" && p.stats.total !== selectedFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesTeam = p.teamName.toLowerCase().includes(q);
        return matchesName || matchesTeam;
      }
      return true;
    });
  }, [allTeamPlayersList, selectedFilter, searchQuery]);

  return (
    <Box sx={{ pb: 6 }}>
      {actionError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setActionError(null)}
        >
          {actionError}
        </Alert>
      )}

      {notifySuccess && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setNotifySuccess(false)}
          data-testid="notify-support-success-alert"
        >
          {t(
            "peladas.support_lineup.notify_success",
            "Notificação enviada com sucesso para o grupo do WhatsApp!",
          )}
        </Alert>
      )}

      {/* Header Card */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 2.5,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: "bold", mb: 0.5 }}>
              {t("peladas.support_lineup.title", "Escalação de Suporte")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t(
                "peladas.support_lineup.subtitle",
                "Dois jogadores que estão descansando gravam a partida e anotam as estatísticas.",
              )}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<GroupIcon />}
              onClick={() => {
                setSelectedFilter("all");
                setSearchQuery("");
                setTransparencyDialogOpen(true);
              }}
              data-testid="view-participation-button"
              sx={{
                textTransform: "none",
                borderRadius: 2,
                fontWeight: "bold",
                borderColor: "divider",
              }}
            >
              {t("peladas.support_lineup.view_participation_button", {
                count: allTeamPlayersList.length,
                defaultValue: `Participação (${allTeamPlayersList.length})`,
              })}
            </Button>

            {isAdmin && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={
                  generatingAll ? (
                    <CircularProgress size={16} />
                  ) : (
                    <AutorenewIcon />
                  )
                }
                disabled={generatingAll || matches.length === 0}
                onClick={() => setConfirmRerollAllOpen(true)}
                data-testid="reroll-all-support-button"
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  fontWeight: "bold",
                }}
              >
                {t(
                  "peladas.support_lineup.reroll_all_button",
                  "Re-sortear Escala Completa",
                )}
              </Button>
            )}

            {isAdmin && onNotifyWhatsApp && (
              <Button
                variant="outlined"
                color="success"
                startIcon={
                  notifying ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <WhatsAppIcon />
                  )
                }
                disabled={notifying || !hasSupportAssignments}
                onClick={() => setConfirmNotifyOpen(true)}
                data-testid="notify-whatsapp-support-button"
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  fontWeight: "bold",
                }}
              >
                {t(
                  "peladas.support_lineup.notify_whatsapp_button",
                  "Notificar no WhatsApp",
                )}
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* Sleek Participation Overview Strip */}
      <Paper
        elevation={0}
        sx={{
          px: 2.5,
          py: 1.5,
          mb: 3,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 1.5,
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: "center", flexWrap: "wrap" }}
        >
          <GroupIcon color="primary" fontSize="small" />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {t(
              "peladas.support_lineup.duty_summary_title",
              "Transparência de Participação",
            )}
            :
          </Typography>

          {distributionBuckets.map((bucket) => (
            <Chip
              key={bucket.dutyCount}
              size="small"
              label={`${bucket.dutyCount}x: ${bucket.playerCount} ${
                bucket.playerCount === 1 ? "jogador" : "jogadores"
              }`}
              variant={bucket.dutyCount > 0 ? "filled" : "outlined"}
              color={bucket.dutyCount > 0 ? "primary" : "default"}
              onClick={() => {
                setSelectedFilter(bucket.dutyCount);
                setSearchQuery("");
                setTransparencyDialogOpen(true);
              }}
              sx={{
                fontWeight: 600,
                fontSize: "0.75rem",
                bgcolor:
                  bucket.dutyCount > 0
                    ? alpha(theme.palette.primary.main, 0.1)
                    : "transparent",
                color: bucket.dutyCount > 0 ? "primary.main" : "text.secondary",
                borderColor: "divider",
                cursor: "pointer",
                "&:hover": {
                  bgcolor: alpha(theme.palette.primary.main, 0.18),
                },
              }}
            />
          ))}
        </Stack>

        <Button
          size="small"
          onClick={() => {
            setSelectedFilter("all");
            setSearchQuery("");
            setTransparencyDialogOpen(true);
          }}
          sx={{
            textTransform: "none",
            fontWeight: "bold",
            fontSize: "0.8rem",
            whiteSpace: "nowrap",
          }}
        >
          {t("peladas.support_lineup.view_details", "Ver lista detalhada")} →
        </Button>
      </Paper>

      {/* Matches Schedule Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <Table>
          <TableHead sx={{ bgcolor: "action.hover" }}>
            <TableRow>
              <TableCell
                sx={{ fontWeight: "bold", width: { xs: "80px", sm: "100px" } }}
              >
                Partida
              </TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Confronto</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center" }}
                >
                  <VideocamIcon fontSize="small" color="primary" />
                  <span>
                    {t("peladas.support_lineup.camera", "Câmera / Vídeo")}
                  </span>
                </Stack>
              </TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center" }}
                >
                  <AssignmentIcon fontSize="small" color="secondary" />
                  <span>
                    {t("peladas.support_lineup.stats", "Súmula / Estatísticas")}
                  </span>
                </Stack>
              </TableCell>
              {isAdmin && (
                <TableCell
                  align="right"
                  sx={{ fontWeight: "bold", width: "120px" }}
                >
                  Ações
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {matches.map((m) => {
              const homeName = teamNameById[m.home_team_id] || "Home";
              const awayName = teamNameById[m.away_team_id] || "Away";
              const eligibleResting = isAdmin
                ? getEligibleRestingPlayers(m)
                : [];
              const isLoading = loadingMatchId === m.id;

              const camUid = m.support_camera_player_id
                ? orgPlayerIdToUserId[m.support_camera_player_id]
                : undefined;
              const camPlayer = m.support_camera_player_id
                ? orgPlayerIdToPlayer[m.support_camera_player_id]
                : undefined;
              const camName = m.support_camera_player_id
                ? getPlayerName(m.support_camera_player_id)
                : t("peladas.support_lineup.unassigned", "Não definido");
              const camTeamId = m.support_camera_player_id
                ? playerTeamMap[m.support_camera_player_id]
                : undefined;

              const statsUid = m.support_stats_player_id
                ? orgPlayerIdToUserId[m.support_stats_player_id]
                : undefined;
              const statsPlayer = m.support_stats_player_id
                ? orgPlayerIdToPlayer[m.support_stats_player_id]
                : undefined;
              const statsName = m.support_stats_player_id
                ? getPlayerName(m.support_stats_player_id)
                : t("peladas.support_lineup.unassigned", "Não definido");
              const statsTeamId = m.support_stats_player_id
                ? playerTeamMap[m.support_stats_player_id]
                : undefined;

              const statusColor =
                m.status === "finished"
                  ? "success"
                  : m.status === "running"
                    ? "primary"
                    : "default";

              return (
                <TableRow
                  key={m.id}
                  hover
                  data-testid={`support-lineup-row-${m.sequence}`}
                  sx={{
                    bgcolor:
                      m.status === "running"
                        ? alpha(theme.palette.primary.main, 0.04)
                        : "inherit",
                  }}
                >
                  {/* Sequence & Status */}
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        #{m.sequence}
                      </Typography>
                      <Chip
                        label={
                          m.status === "running"
                            ? "Ao Vivo"
                            : m.status === "finished"
                              ? "Finalizado"
                              : "Agendado"
                        }
                        size="small"
                        color={statusColor}
                        sx={{ fontSize: "0.65rem", height: 20 }}
                      />
                    </Stack>
                  </TableCell>

                  {/* Teams */}
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      <Box component="span" sx={{ color: "home.main" }}>
                        {homeName}
                      </Box>
                      <Box
                        component="span"
                        sx={{
                          mx: 0.8,
                          color: "text.disabled",
                          fontWeight: "normal",
                        }}
                      >
                        vs
                      </Box>
                      <Box component="span" sx={{ color: "away.main" }}>
                        {awayName}
                      </Box>
                    </Typography>
                  </TableCell>

                  {/* Camera Column */}
                  <TableCell>
                    {isAdmin ? (
                      <Select
                        size="small"
                        value={m.support_camera_player_id || ""}
                        onChange={(e) => handleChangeCamera(m, e.target.value)}
                        disabled={isLoading}
                        displayEmpty
                        data-testid={`camera-select-${m.sequence}`}
                        sx={{
                          minWidth: { xs: 150, sm: 200 },
                          borderRadius: 2,
                          fontSize: "0.85rem",
                        }}
                      >
                        <MenuItem value="">
                          <em>
                            {t(
                              "peladas.support_lineup.unassigned",
                              "Não definido",
                            )}
                          </em>
                        </MenuItem>
                        {eligibleResting.map((p) => (
                          <MenuItem key={p.id} value={p.id}>
                            {p.name} ({p.teamName}) • {p.dutyCount}x
                          </MenuItem>
                        ))}
                      </Select>
                    ) : (
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: "center" }}
                      >
                        {m.support_camera_player_id && (
                          <SecureAvatar
                            userId={camUid}
                            filename={camPlayer?.user_avatar_filename}
                            fallbackText={camName}
                            sx={{ width: 28, height: 28 }}
                          />
                        )}
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: "medium" }}
                          >
                            {camName}
                          </Typography>
                          {camTeamId && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {teamNameById[camTeamId]}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    )}
                  </TableCell>

                  {/* Stats Column */}
                  <TableCell>
                    {isAdmin ? (
                      <Select
                        size="small"
                        value={m.support_stats_player_id || ""}
                        onChange={(e) => handleChangeStats(m, e.target.value)}
                        disabled={isLoading}
                        displayEmpty
                        data-testid={`stats-select-${m.sequence}`}
                        sx={{
                          minWidth: { xs: 150, sm: 200 },
                          borderRadius: 2,
                          fontSize: "0.85rem",
                        }}
                      >
                        <MenuItem value="">
                          <em>
                            {t(
                              "peladas.support_lineup.unassigned",
                              "Não definido",
                            )}
                          </em>
                        </MenuItem>
                        {eligibleResting.map((p) => (
                          <MenuItem key={p.id} value={p.id}>
                            {p.name} ({p.teamName}) • {p.dutyCount}x
                          </MenuItem>
                        ))}
                      </Select>
                    ) : (
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: "center" }}
                      >
                        {m.support_stats_player_id && (
                          <SecureAvatar
                            userId={statsUid}
                            filename={statsPlayer?.user_avatar_filename}
                            fallbackText={statsName}
                            sx={{ width: 28, height: 28 }}
                          />
                        )}
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: "medium" }}
                          >
                            {statsName}
                          </Typography>
                          {statsTeamId && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {teamNameById[statsTeamId]}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    )}
                  </TableCell>

                  {/* Actions Column */}
                  {isAdmin && (
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{ justifyContent: "flex-end" }}
                      >
                        <Tooltip
                          title={t(
                            "peladas.support_lineup.swap_roles_button",
                            "Inverter funções (Câmera ⇄ Súmula)",
                          )}
                        >
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleSwapRoles(m)}
                              disabled={isLoading}
                              data-testid={`swap-support-roles-${m.sequence}`}
                            >
                              <SwapHorizIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Tooltip
                          title={t(
                            "peladas.support_lineup.reroll_match_button",
                            "Re-sortear partida",
                          )}
                        >
                          <span>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() =>
                                setMatchToReroll({
                                  id: m.id,
                                  sequence: m.sequence,
                                })
                              }
                              disabled={isLoading}
                              data-testid={`reroll-support-match-${m.sequence}`}
                            >
                              {isLoading ? (
                                <CircularProgress size={16} />
                              ) : (
                                <CasinoIcon fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Confirmation Dialog for Re-roll All */}
      <PrettyConfirmDialog
        open={confirmRerollAllOpen}
        title={t(
          "peladas.support_lineup.reroll_all_button",
          "Re-sortear Escala Completa",
        )}
        description={t(
          "peladas.support_lineup.reroll_all_confirm",
          "Tem certeza que deseja re-sortear o suporte de todas as partidas?",
        )}
        onClose={() => setConfirmRerollAllOpen(false)}
        onConfirm={handleRerollAll}
      />

      {/* Confirmation Dialog for WhatsApp Notification */}
      <PrettyConfirmDialog
        open={confirmNotifyOpen}
        title={t(
          "peladas.support_lineup.confirm_notify_title",
          "Notificar Escalação de Suporte?",
        )}
        description={t(
          "peladas.support_lineup.confirm_notify_desc",
          "Deseja enviar a escala completa de apoio para o grupo do WhatsApp mencionando os jogadores escalados para cada partida?",
        )}
        confirmLabel={t(
          "peladas.support_lineup.confirm_notify_action",
          "Enviar Notificação",
        )}
        cancelLabel={t("common.cancel", "Cancelar")}
        onClose={() => setConfirmNotifyOpen(false)}
        onConfirm={handleNotifyWhatsApp}
      />

      {/* Confirmation Dialog for Re-roll Single Match */}
      <PrettyConfirmDialog
        open={Boolean(matchToReroll)}
        title={t(
          "peladas.support_lineup.confirm_match_reroll_title",
          "Re-sortear suporte da partida {{sequence}}?",
          { sequence: matchToReroll?.sequence },
        )}
        description={t(
          "peladas.support_lineup.confirm_match_reroll_desc",
          "Deseja re-sortear a dupla de suporte desta partida? Os jogadores atuais serão substituídos por outros jogadores em descanso.",
        )}
        confirmLabel={t(
          "peladas.support_lineup.reroll_match_button",
          "Re-sortear",
        )}
        onClose={() => setMatchToReroll(null)}
        onConfirm={async () => {
          if (matchToReroll) {
            const id = matchToReroll.id;
            setMatchToReroll(null);
            await handleRerollMatch(id);
          }
        }}
      />

      {/* Participation Transparency Dialog */}
      <Dialog
        open={transparencyDialogOpen}
        onClose={() => setTransparencyDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: { sx: { borderRadius: 3 } },
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2.5, pb: 1.5 }}>
          <Stack
            direction="row"
            sx={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <GroupIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                {t(
                  "peladas.support_lineup.duty_summary_title",
                  "Transparência de Participação",
                )}
              </Typography>
            </Stack>
            <IconButton
              aria-label="close"
              onClick={() => setTransparencyDialogOpen(false)}
              size="small"
              sx={{ color: "text.secondary" }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {t(
              "peladas.support_lineup.duty_summary_subtitle",
              "Histórico de vezes que cada jogador atuou no suporte",
            )}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 2.5, pt: 1 }}>
          <Stack spacing={2}>
            {/* Search Input */}
            <TextField
              fullWidth
              size="small"
              placeholder={t(
                "peladas.support_lineup.search_player_placeholder",
                "Buscar jogador...",
              )}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2 },
                },
              }}
            />

            {/* Filter Chips */}
            <Stack
              direction="row"
              spacing={1}
              sx={{ overflowX: "auto", pb: 0.5 }}
            >
              <Chip
                label={t("peladas.support_lineup.filter_all", "Todos")}
                size="small"
                clickable
                color={selectedFilter === "all" ? "primary" : "default"}
                variant={selectedFilter === "all" ? "filled" : "outlined"}
                onClick={() => setSelectedFilter("all")}
                sx={{ fontWeight: "bold" }}
              />
              {distributionBuckets.map((bucket) => (
                <Chip
                  key={bucket.dutyCount}
                  label={`${bucket.dutyCount}x (${bucket.playerCount})`}
                  size="small"
                  clickable
                  color={
                    selectedFilter === bucket.dutyCount ? "primary" : "default"
                  }
                  variant={
                    selectedFilter === bucket.dutyCount ? "filled" : "outlined"
                  }
                  onClick={() => setSelectedFilter(bucket.dutyCount)}
                  sx={{ fontWeight: "bold" }}
                />
              ))}
            </Stack>

            {/* Players Table */}
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                maxHeight: 360,
              }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      {t("peladas.support_lineup.player_col", "Jogador")}
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      {t("peladas.support_lineup.team_col", "Time")}
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: "bold" }}>
                      <Tooltip
                        title={t("peladas.support_lineup.camera", "Câmera")}
                      >
                        <span>📹</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: "bold" }}>
                      <Tooltip
                        title={t("peladas.support_lineup.stats", "Súmula")}
                      >
                        <span>📝</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      {t("peladas.support_lineup.total_col", "Total")}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPlayers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        align="center"
                        sx={{ py: 3, color: "text.secondary" }}
                      >
                        {t(
                          "peladas.support_lineup.no_players_found",
                          "Nenhum jogador encontrado",
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPlayers.map((player) => {
                      const uid = orgPlayerIdToUserId[player.id];
                      const pObj = orgPlayerIdToPlayer[player.id];
                      return (
                        <TableRow key={player.id} hover>
                          <TableCell>
                            <Stack
                              direction="row"
                              spacing={1}
                              sx={{ alignItems: "center" }}
                            >
                              <SecureAvatar
                                userId={uid}
                                filename={pObj?.user_avatar_filename}
                                fallbackText={player.name}
                                sx={{
                                  width: 26,
                                  height: 26,
                                  fontSize: "0.75rem",
                                }}
                              />
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600 }}
                              >
                                {player.name}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontWeight: 500 }}
                            >
                              {player.teamName}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {player.stats.camera}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {player.stats.stats}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              size="small"
                              label={`${player.stats.total}x`}
                              color={
                                player.stats.total > 0 ? "primary" : "default"
                              }
                              variant={
                                player.stats.total > 0 ? "filled" : "outlined"
                              }
                              sx={{
                                fontWeight: "bold",
                                height: 22,
                                fontSize: "0.7rem",
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5 }}>
          <Button
            onClick={() => setTransparencyDialogOpen(false)}
            variant="contained"
            size="small"
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            {t("common.close", "Fechar")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
