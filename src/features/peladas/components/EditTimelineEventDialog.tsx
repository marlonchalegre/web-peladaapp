import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListSubheader,
  Chip,
  Paper,
  CircularProgress,
} from "@mui/material";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";
import StarsIcon from "@mui/icons-material/Stars";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BlockIcon from "@mui/icons-material/Block";
import { useTranslation } from "react-i18next";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";
import { formatMs } from "../../../shared/utils/timeUtils";
import type {
  MatchEvent,
  Match,
  Player,
  TeamPlayer,
  Attendance,
  Pelada,
} from "../../../shared/api/endpoints";
import {
  comparePlayersByPosition,
  getPlayerTeamInMatch,
  findMatchingAssistForGoal,
  resolvePlayerName,
  getAttendancePlayerId,
} from "../utils/playerUtils";

export const NO_ASSISTANT = "none";

export interface EditTimelineEventDialogProps {
  open: boolean;
  event: MatchEvent | null;
  match: Match | null;
  pelada?: Pelada | null;
  onClose: () => void;
  onSave: (scorerId: string, assistantId: string | null) => Promise<void>;
  orgPlayerIdToPlayer: Record<string, Player>;
  orgPlayerIdToUserId: Record<string, string>;
  userIdToName: Record<string, string>;
  teamNameById: Record<string, string>;
  lineupsByMatch?: Record<string, Record<string, TeamPlayer[]>>;
  teamPlayers?: Record<string, TeamPlayer[]>;
  orgPlayerIdToTeamId?: Record<string, string>;
  matchEvents?: MatchEvent[];
  attendance?: Attendance[];
}

export interface FormattedPlayerOption {
  id: string;
  userId?: string;
  name: string;
  avatarFilename?: string | null;
  position?: string | null;
  positionLabel?: string;
  isGoalkeeper?: boolean;
  group: "team" | "bench";
}

export default function EditTimelineEventDialog({
  open,
  event,
  match,
  pelada,
  onClose,
  onSave,
  orgPlayerIdToPlayer,
  orgPlayerIdToUserId,
  userIdToName,
  teamNameById,
  lineupsByMatch = {},
  teamPlayers = {},
  orgPlayerIdToTeamId = {},
  matchEvents = [],
  attendance = [],
}: EditTimelineEventDialogProps) {
  const { t } = useTranslation();

  // Resolve the active team for this event
  const teamId = useMemo(() => {
    if (event?.team_id) return event.team_id;
    if (match && event?.player_id) {
      return (
        getPlayerTeamInMatch(
          event.player_id,
          match.id,
          match,
          lineupsByMatch,
          teamPlayers,
          orgPlayerIdToTeamId,
        ) || match.home_team_id
      );
    }
    return match?.home_team_id || "";
  }, [
    event?.team_id,
    event?.player_id,
    match,
    lineupsByMatch,
    teamPlayers,
    orgPlayerIdToTeamId,
  ]);

  const teamName =
    teamNameById[teamId] ||
    (match && teamId === match.home_team_id ? "Time 1" : "Time 2");

  const [selectedScorerId, setSelectedScorerId] = useState<string>(
    () => event?.player_id || "",
  );
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>(() => {
    if (event?.event_type === "goal") {
      const assistEvent = findMatchingAssistForGoal(
        event,
        matchEvents,
        teamId,
        orgPlayerIdToTeamId,
      );
      return assistEvent ? assistEvent.player_id : NO_ASSISTANT;
    }
    return NO_ASSISTANT;
  });
  const [saving, setSaving] = useState<boolean>(false);

  // Sync state only when switching events
  useEffect(() => {
    if (event && match) {
      setSelectedScorerId(event.player_id);
      if (event.event_type === "goal") {
        const assistEvent = findMatchingAssistForGoal(
          event,
          matchEvents,
          teamId,
          orgPlayerIdToTeamId,
        );
        setSelectedAssistantId(
          assistEvent ? assistEvent.player_id : NO_ASSISTANT,
        );
      } else {
        setSelectedAssistantId(NO_ASSISTANT);
      }
    } else {
      setSelectedScorerId("");
      setSelectedAssistantId(NO_ASSISTANT);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentionally keyed on event?.id only: background polling updates to match/matchEvents must not reset user selections while editing
  }, [event?.id]);

  // Build team members and bench players (excluding opponent team currently playing on pitch)
  const { teamMembers, benchPlayers } = useMemo(() => {
    if (!match) {
      return { teamMembers: [], benchPlayers: [] };
    }

    const opponentTeamId =
      teamId === match.home_team_id ? match.away_team_id : match.home_team_id;

    const matchLineup = lineupsByMatch[match.id] || {};

    // 1. Team members currently playing for this team
    const teamIds = new Set<string>();
    const goalkeeperIds = new Set<string>();

    (matchLineup[teamId] || teamPlayers[teamId] || []).forEach((p) => {
      teamIds.add(p.player_id);
      if (p.is_goalkeeper) {
        goalkeeperIds.add(p.player_id);
      }
    });

    // If pelada has fixed goalkeepers, associate the team's fixed goalkeeper
    if (pelada?.fixed_goalkeepers) {
      const isHome = teamId === match.home_team_id;
      const teamFixedGkId = isHome
        ? pelada.home_fixed_goalkeeper_id
        : pelada.away_fixed_goalkeeper_id;
      if (teamFixedGkId) {
        teamIds.add(teamFixedGkId);
        goalkeeperIds.add(teamFixedGkId);
      }
    }

    // 2. Opponent members to exclude completely
    const opponentIds = new Set<string>();
    (matchLineup[opponentTeamId] || teamPlayers[opponentTeamId] || []).forEach(
      (p) => opponentIds.add(p.player_id),
    );

    // Opponent fixed goalkeeper should also be excluded from this team's options
    if (pelada?.fixed_goalkeepers) {
      const isHome = teamId === match.home_team_id;
      const opponentFixedGkId = isHome
        ? pelada.away_fixed_goalkeeper_id
        : pelada.home_fixed_goalkeeper_id;
      if (opponentFixedGkId) {
        opponentIds.add(opponentFixedGkId);
      }
    }

    // 3. Collect bench/substitute candidate IDs (not on the opponent team)
    const benchIds = new Set<string>();

    // From other drafted teams (not currently playing in this match)
    Object.entries(teamPlayers).forEach(([tid, list]) => {
      if (tid !== teamId && tid !== opponentTeamId) {
        list.forEach((p) => {
          if (!teamIds.has(p.player_id) && !opponentIds.has(p.player_id)) {
            benchIds.add(p.player_id);
          }
        });
      }
    });

    // From attendance (confirmed bench players)
    attendance.forEach((att) => {
      const pid = getAttendancePlayerId(att);
      if (pid && !teamIds.has(pid) && !opponentIds.has(pid)) {
        benchIds.add(pid);
      }
    });

    // From organization players
    Object.keys(orgPlayerIdToPlayer).forEach((id) => {
      if (!teamIds.has(id) && !opponentIds.has(id)) {
        benchIds.add(id);
      }
    });

    // Always include current event player if not already present
    if (event?.player_id && !teamIds.has(event.player_id)) {
      benchIds.add(event.player_id);
    }

    const buildOption = (
      playerId: string,
      group: "team" | "bench",
    ): FormattedPlayerOption => {
      const orgPlayer = orgPlayerIdToPlayer[playerId];
      const userId = orgPlayer?.user_id || orgPlayerIdToUserId[playerId];
      const name = resolvePlayerName(
        playerId,
        orgPlayerIdToPlayer,
        orgPlayerIdToUserId,
        userIdToName,
      );
      const rawPos = orgPlayer?.position || orgPlayer?.user_position || "";
      const isGoalkeeper =
        goalkeeperIds.has(playerId) || rawPos.toLowerCase() === "goalkeeper";
      const positionLabel = isGoalkeeper
        ? t("common.positions.goalkeeper").toUpperCase()
        : rawPos
          ? t(`common.positions.${rawPos.toLowerCase()}`, rawPos).toUpperCase()
          : "";

      return {
        id: playerId,
        userId,
        name,
        avatarFilename: orgPlayer?.user_avatar_filename,
        position: rawPos,
        positionLabel,
        isGoalkeeper,
        group,
      };
    };

    const teamList: FormattedPlayerOption[] = [];
    const benchList: FormattedPlayerOption[] = [];

    teamIds.forEach((id) => teamList.push(buildOption(id, "team")));
    benchIds.forEach((id) => benchList.push(buildOption(id, "bench")));

    teamList.sort(comparePlayersByPosition);
    benchList.sort(comparePlayersByPosition);

    return { teamMembers: teamList, benchPlayers: benchList };
  }, [
    match,
    teamId,
    pelada?.fixed_goalkeepers,
    pelada?.home_fixed_goalkeeper_id,
    pelada?.away_fixed_goalkeeper_id,
    lineupsByMatch,
    teamPlayers,
    attendance,
    orgPlayerIdToPlayer,
    orgPlayerIdToUserId,
    userIdToName,
    event?.player_id,
    t,
  ]);

  // Derived assistant candidates (scorer cannot assist their own goal)
  const availableTeamAssistants = useMemo(
    () => teamMembers.filter((p) => p.id !== selectedScorerId),
    [teamMembers, selectedScorerId],
  );
  const availableBenchAssistants = useMemo(
    () => benchPlayers.filter((p) => p.id !== selectedScorerId),
    [benchPlayers, selectedScorerId],
  );

  const handleScorerChange = (newScorerId: string) => {
    setSelectedScorerId(newScorerId);
    if (newScorerId === selectedAssistantId) {
      setSelectedAssistantId(NO_ASSISTANT);
    }
  };

  const handleSave = async () => {
    if (!selectedScorerId) return;
    setSaving(true);
    try {
      await onSave(
        selectedScorerId,
        selectedAssistantId === NO_ASSISTANT ? null : selectedAssistantId,
      );
      onClose();
    } catch (err) {
      console.error("Failed to save edited event", err);
    } finally {
      setSaving(false);
    }
  };

  const isGoal = event?.event_type === "goal";
  const isOwnGoal = event?.event_type === "own_goal";

  const getEventTitle = () => {
    if (isOwnGoal) return t("peladas.timeline.edit_own_goal", "Edit Own Goal");
    if (isGoal) return t("peladas.timeline.edit_goal", "Edit Goal & Assist");
    return t("peladas.timeline.edit_event", "Edit Event");
  };

  const getEventIcon = () => {
    if (isOwnGoal) return <ErrorOutlinedIcon color="error" />;
    if (isGoal) return <SportsSoccerIcon color="success" />;
    return <StarsIcon color="info" />;
  };

  const scorerSectionLabel = isOwnGoal
    ? t("common.player", "Jogador")
    : isGoal
      ? t("peladas.timeline.scorer_label", "Autor do Gol")
      : t("common.player", "Jogador");

  const scorerSelectLabel = isOwnGoal
    ? t("common.player")
    : isGoal
      ? t("common.goal")
      : t("common.player");

  const renderPlayerMenuItem = (
    p: FormattedPlayerOption,
    testIdPrefix: string,
  ) => (
    <MenuItem
      key={p.id}
      value={p.id}
      data-testid={`${testIdPrefix}-${p.id}`}
      sx={{
        py: 1,
        borderLeft: p.group === "team" ? "3px solid" : "3px solid transparent",
        borderColor: p.group === "team" ? "primary.main" : "transparent",
        bgcolor: p.group === "team" ? "action.hover" : "transparent",
      }}
    >
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1.5, width: "100%" }}
      >
        <SecureAvatar
          userId={p.userId}
          filename={p.avatarFilename}
          sx={{ width: 28, height: 28, fontSize: "0.8rem" }}
        />
        <Typography
          variant="body2"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            fontWeight: p.group === "team" ? 700 : 400,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {p.name}
        </Typography>
        {p.positionLabel && (
          <Chip
            label={p.positionLabel}
            size="small"
            variant={p.isGoalkeeper ? "filled" : "outlined"}
            color={p.isGoalkeeper ? "warning" : "default"}
            sx={{ height: 20, fontSize: "0.65rem", fontWeight: "bold" }}
          />
        )}
      </Box>
    </MenuItem>
  );

  const renderPlayerGroup = (
    title: string,
    players: FormattedPlayerOption[],
    testIdPrefix: string,
    headerColor = "text.secondary",
  ) => {
    if (players.length === 0) return null;
    return [
      <ListSubheader
        key={`header-${title}`}
        component="div"
        role="presentation"
        tabIndex={-1}
        sx={{
          bgcolor: "background.paper",
          color: headerColor,
          fontWeight: "bold",
          lineHeight: "36px",
          pointerEvents: "none",
        }}
      >
        {title}
      </ListSubheader>,
      ...players.map((p) => renderPlayerMenuItem(p, testIdPrefix)),
    ];
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      data-testid="edit-event-dialog"
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      <DialogTitle component="div" sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          {getEventIcon()}
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", lineHeight: 1.2 }}
            >
              {getEventTitle()}
            </Typography>
            {match && (
              <Typography variant="caption" color="text.secondary">
                {t("peladas.timeline.match_short", "Match")} #
                {match.sequence || 1} •{" "}
                {teamNameById[match.home_team_id] || "Home"} vs{" "}
                {teamNameById[match.away_team_id] || "Away"} •{" "}
                <Box
                  component="span"
                  sx={{ fontWeight: 700, color: "primary.main" }}
                >
                  {teamName}
                </Box>
              </Typography>
            )}
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Chip
              label={`${formatMs(event?.match_time_ms)} / ${formatMs(event?.session_time_ms)}`}
              size="small"
              variant="outlined"
              sx={{ fontWeight: "medium", fontSize: "0.75rem" }}
            />
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent
        sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2.5 }}
      >
        {/* Scorer Section */}
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center", mb: 1.5 }}
          >
            <SportsSoccerIcon fontSize="small" color="primary" />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {scorerSectionLabel}
            </Typography>
          </Stack>

          {/* Quick Select Chips for Team Members */}
          {teamMembers.length > 0 && (
            <Box sx={{ mb: 1.5 }}>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontWeight: 600,
                  display: "block",
                  mb: 0.75,
                }}
              >
                ⭐️ {t("peladas.timeline.quick_select", "Seleção rápida")} (
                {teamName}):
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {teamMembers.map((p) => {
                  const isSelected = selectedScorerId === p.id;
                  return (
                    <Chip
                      key={p.id}
                      data-testid={`quick-select-scorer-${p.id}`}
                      avatar={
                        <SecureAvatar
                          userId={p.userId}
                          filename={p.avatarFilename}
                          sx={{ width: 22, height: 22, fontSize: "0.75rem" }}
                        />
                      }
                      label={p.name}
                      clickable
                      color={isSelected ? "primary" : "default"}
                      variant={isSelected ? "filled" : "outlined"}
                      onClick={() => handleScorerChange(p.id)}
                      icon={
                        isSelected ? (
                          <CheckCircleIcon fontSize="small" />
                        ) : undefined
                      }
                      sx={{
                        fontWeight: isSelected ? 700 : 500,
                        borderRadius: 2,
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          )}

          {/* Scorer Dropdown */}
          <FormControl fullWidth size="small">
            <InputLabel id="edit-scorer-label">{scorerSelectLabel}</InputLabel>
            <Select
              labelId="edit-scorer-label"
              value={selectedScorerId}
              label={scorerSelectLabel}
              onChange={(e) => handleScorerChange(e.target.value as string)}
              data-testid="edit-scorer-select"
            >
              {renderPlayerGroup(
                `⭐️ ${t("peladas.timeline.team_members", "Membros da Equipe")} (${teamName})`,
                teamMembers,
                "scorer-option",
                "primary.main",
              )}
              {renderPlayerGroup(
                `👥 ${t("peladas.timeline.bench_and_others", "Banco e Outros Jogadores")}`,
                benchPlayers,
                "scorer-option",
              )}
            </Select>
          </FormControl>
        </Paper>

        {/* Assistant Section (Goal events only) */}
        {isGoal && (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "center", mb: 1.5 }}
            >
              <StarsIcon fontSize="small" color="info" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {t("common.assist", "Assistência")}
              </Typography>
            </Stack>

            {/* Quick Select Chips for Assistant */}
            <Box sx={{ mb: 1.5 }}>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontWeight: 600,
                  display: "block",
                  mb: 0.75,
                }}
              >
                ⭐️ {t("peladas.timeline.quick_select", "Seleção rápida")}:
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                <Chip
                  data-testid="quick-select-assistant-none"
                  icon={<BlockIcon fontSize="small" />}
                  label={t("common.without_assistance", "Sem assistência")}
                  clickable
                  color={
                    selectedAssistantId === NO_ASSISTANT ? "primary" : "default"
                  }
                  variant={
                    selectedAssistantId === NO_ASSISTANT ? "filled" : "outlined"
                  }
                  onClick={() => setSelectedAssistantId(NO_ASSISTANT)}
                  sx={{
                    fontWeight:
                      selectedAssistantId === NO_ASSISTANT ? 700 : 500,
                    borderRadius: 2,
                  }}
                />
                {availableTeamAssistants.map((p) => {
                  const isSelected = selectedAssistantId === p.id;
                  return (
                    <Chip
                      key={p.id}
                      data-testid={`quick-select-assistant-${p.id}`}
                      avatar={
                        <SecureAvatar
                          userId={p.userId}
                          filename={p.avatarFilename}
                          sx={{ width: 22, height: 22, fontSize: "0.75rem" }}
                        />
                      }
                      label={p.name}
                      clickable
                      color={isSelected ? "primary" : "default"}
                      variant={isSelected ? "filled" : "outlined"}
                      onClick={() => setSelectedAssistantId(p.id)}
                      icon={
                        isSelected ? (
                          <CheckCircleIcon fontSize="small" />
                        ) : undefined
                      }
                      sx={{
                        fontWeight: isSelected ? 700 : 500,
                        borderRadius: 2,
                      }}
                    />
                  );
                })}
              </Box>
            </Box>

            {/* Assistant Dropdown */}
            <FormControl fullWidth size="small">
              <InputLabel id="edit-assistant-label">
                {t("common.assist")}
              </InputLabel>
              <Select
                labelId="edit-assistant-label"
                value={selectedAssistantId}
                label={t("common.assist")}
                onChange={(e) =>
                  setSelectedAssistantId(e.target.value as string)
                }
                data-testid="edit-assistant-select"
              >
                <MenuItem
                  value={NO_ASSISTANT}
                  data-testid="assistant-option-none"
                >
                  <em>{t("common.without_assistance")}</em>
                </MenuItem>
                {renderPlayerGroup(
                  `⭐️ ${t("peladas.timeline.team_members", "Membros da Equipe")} (${teamName})`,
                  availableTeamAssistants,
                  "assistant-option",
                  "primary.main",
                )}
                {renderPlayerGroup(
                  `👥 ${t("peladas.timeline.bench_and_others", "Banco e Outros Jogadores")}`,
                  availableBenchAssistants,
                  "assistant-option",
                )}
              </Select>
            </FormControl>
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          disabled={saving}
        >
          {t("common.actions.cancel")}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={!selectedScorerId || saving}
          data-testid="save-event-edit-button"
          startIcon={
            saving ? <CircularProgress size={16} color="inherit" /> : undefined
          }
        >
          {t("common.actions.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
