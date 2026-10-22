import { useState, useEffect, useMemo, useRef } from "react";
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
  getPlayerTeamInMatch,
  findMatchingAssistForGoal,
  buildTimelinePlayerOptions,
  type FormattedPlayerOption,
} from "../utils/playerUtils";

export const NO_ASSISTANT = "none";

const EMPTY_RECORD = {};
const EMPTY_ARRAY: never[] = [];

export { type FormattedPlayerOption };

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

function resolveInitialAssistantId(
  event: MatchEvent | null | undefined,
  matchEvents: MatchEvent[],
  teamId: string,
  orgPlayerIdToTeamId: Record<string, string>,
): string {
  if (event?.event_type === "goal") {
    const assist = findMatchingAssistForGoal(
      event,
      matchEvents,
      teamId,
      orgPlayerIdToTeamId,
    );
    return assist ? assist.player_id : NO_ASSISTANT;
  }
  return NO_ASSISTANT;
}

function PlayerQuickSelectChip({
  player,
  isSelected,
  testIdPrefix,
  onSelect,
}: {
  player: FormattedPlayerOption;
  isSelected: boolean;
  testIdPrefix: string;
  onSelect: (playerId: string) => void;
}) {
  return (
    <Chip
      data-testid={`${testIdPrefix}-${player.id}`}
      avatar={
        <SecureAvatar
          userId={player.userId}
          filename={player.avatarFilename}
          sx={{ width: 22, height: 22, fontSize: "0.75rem" }}
        />
      }
      label={player.name}
      clickable
      color={isSelected ? "primary" : "default"}
      variant={isSelected ? "filled" : "outlined"}
      onClick={() => onSelect(player.id)}
      sx={{
        fontWeight: isSelected ? 700 : 500,
        borderRadius: 2,
      }}
    />
  );
}

function renderPlayerMenuItem(p: FormattedPlayerOption, testIdPrefix: string) {
  const isTeam = p.group === "team";
  return (
    <MenuItem
      key={p.id}
      value={p.id}
      data-testid={`${testIdPrefix}-${p.id}`}
      sx={{
        py: 1,
        borderLeft: isTeam ? "3px solid" : "3px solid transparent",
        borderColor: isTeam ? "primary.main" : "transparent",
        bgcolor: isTeam ? "action.hover" : "transparent",
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
            fontWeight: isTeam ? 700 : 400,
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
}

function renderPlayerGroup(
  title: string,
  players: FormattedPlayerOption[],
  testIdPrefix: string,
  headerColor = "text.secondary",
) {
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
  lineupsByMatch = EMPTY_RECORD,
  teamPlayers = EMPTY_RECORD,
  orgPlayerIdToTeamId = EMPTY_RECORD,
  matchEvents = EMPTY_ARRAY,
  attendance = EMPTY_ARRAY,
}: EditTimelineEventDialogProps) {
  const { t } = useTranslation();
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
    (match && teamId === match.home_team_id
      ? t("common.teams.home", "Time 1")
      : t("common.teams.away", "Time 2"));

  const [selectedScorerId, setSelectedScorerId] = useState<string>(
    () => event?.player_id || "",
  );
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>(() =>
    resolveInitialAssistantId(event, matchEvents, teamId, orgPlayerIdToTeamId),
  );
  const [saving, setSaving] = useState<boolean>(false);

  const prevEventIdRef = useRef<string | undefined>(event?.id);

  useEffect(() => {
    if (event?.id === prevEventIdRef.current) return;
    prevEventIdRef.current = event?.id;

    if (event && match) {
      setSelectedScorerId(event.player_id);
      setSelectedAssistantId(
        resolveInitialAssistantId(
          event,
          matchEvents,
          teamId,
          orgPlayerIdToTeamId,
        ),
      );
    } else {
      setSelectedScorerId("");
      setSelectedAssistantId(NO_ASSISTANT);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentionally keyed on event?.id only: background polling updates to match/matchEvents must not reset user selections while editing
  }, [event?.id]);

  const { teamMembers, benchPlayers } = useMemo(() => {
    if (!match) {
      return {
        teamMembers: EMPTY_ARRAY,
        benchPlayers: EMPTY_ARRAY,
      };
    }
    return buildTimelinePlayerOptions({
      match,
      pelada,
      teamId,
      eventPlayerId: event?.player_id,
      lineupsByMatch,
      teamPlayers,
      attendance,
      orgPlayerIdToPlayer,
      orgPlayerIdToUserId,
      userIdToName,
      t,
    });
  }, [
    match,
    pelada,
    teamId,
    event?.player_id,
    lineupsByMatch,
    teamPlayers,
    attendance,
    orgPlayerIdToPlayer,
    orgPlayerIdToUserId,
    userIdToName,
    t,
  ]);

  const isGoal = event?.event_type === "goal";
  const isOwnGoal = event?.event_type === "own_goal";

  const availableTeamAssistants = useMemo(
    () =>
      isGoal
        ? teamMembers.filter((p) => p.id !== selectedScorerId)
        : EMPTY_ARRAY,
    [isGoal, teamMembers, selectedScorerId],
  );
  const availableBenchAssistants = useMemo(
    () =>
      isGoal
        ? benchPlayers.filter((p) => p.id !== selectedScorerId)
        : EMPTY_ARRAY,
    [isGoal, benchPlayers, selectedScorerId],
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
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  };

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

  const teamGroupTitle = `⭐️ ${t("peladas.timeline.team_members", "Membros da Equipe")} (${teamName})`;
  const benchGroupTitle = `👥 ${t("peladas.timeline.bench_and_others", "Banco e Outros Jogadores")}`;

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
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
                {teamMembers.map((p) => (
                  <PlayerQuickSelectChip
                    key={p.id}
                    player={p}
                    isSelected={selectedScorerId === p.id}
                    testIdPrefix="quick-select-scorer"
                    onSelect={handleScorerChange}
                  />
                ))}
              </Box>
            </Box>
          )}

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
                teamGroupTitle,
                teamMembers,
                "scorer-option",
                "primary.main",
              )}
              {renderPlayerGroup(
                benchGroupTitle,
                benchPlayers,
                "scorer-option",
              )}
            </Select>
          </FormControl>
        </Paper>

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
                {availableTeamAssistants.map((p) => (
                  <PlayerQuickSelectChip
                    key={p.id}
                    player={p}
                    isSelected={selectedAssistantId === p.id}
                    testIdPrefix="quick-select-assistant"
                    onSelect={setSelectedAssistantId}
                  />
                ))}
              </Box>
            </Box>

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
                  teamGroupTitle,
                  availableTeamAssistants,
                  "assistant-option",
                  "primary.main",
                )}
                {renderPlayerGroup(
                  benchGroupTitle,
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
