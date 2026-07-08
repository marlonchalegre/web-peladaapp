import {
  Stack,
  Box,
  Typography,
  Button,
  Grid,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  Chip,
  Avatar,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  ListItemText,
  Fab,
  alpha,
  Paper,
} from "@mui/material";
import {
  type Dispatch,
  type SetStateAction,
  useState,
  useMemo,
  useCallback,
} from "react";
import type {
  Match,
  TeamPlayer,
  Player,
  Pelada,
  MatchEventType,
} from "../../../shared/api/endpoints";
import MatchScoreHero from "./MatchScoreHero";
import MatchPlayerCard from "./MatchPlayerCard";
import HistoryIcon from "@mui/icons-material/History";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import BoltIcon from "@mui/icons-material/Bolt";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import WarningIcon from "@mui/icons-material/Warning";
import SentimentVeryDissatisfiedIcon from "@mui/icons-material/SentimentVeryDissatisfied";
import ShieldIcon from "@mui/icons-material/Shield";
import SentimentVerySatisfiedIcon from "@mui/icons-material/SentimentVerySatisfied";
import { useTranslation } from "react-i18next";
import PlayerSelectMenu from "./PlayerSelectMenu";
import { POSITION_ORDER } from "../utils/playerUtils";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";

export type SelectMenuState = {
  teamId: string;
  forPlayerId?: string;
  type: "replace" | "add";
} | null;

type Props = {
  match: Match;
  pelada: Pelada;
  homeTeamName: string;
  awayTeamName: string;
  homePlayers: TeamPlayer[];
  awayPlayers: TeamPlayer[];
  orgPlayerIdToUserId: Record<string, string>;
  userIdToName: Record<string, string>;
  orgPlayerIdToPlayer: Record<string, Player>;
  statsMap: Record<
    string,
    { goals: number; assists: number; ownGoals: number }
  >;
  benchPlayers: Player[];
  finished: boolean;
  isAdmin: boolean;
  updating: boolean;
  selectMenu: SelectMenuState;
  setSelectMenu: Dispatch<SetStateAction<SelectMenuState>>;
  playersPerTeam?: number | null;
  // Timer Actions
  onStartMatch: (id: string) => Promise<void>;
  onPauseMatch: (id: string) => Promise<void>;
  onResetMatch: (id: string) => Promise<void>;
  onOpenResetConfirm: (type: "session" | "match") => void;
  recordEvent: (
    matchId: string,
    playerId: string,
    type: MatchEventType,
    sessionTimeMs?: number,
    matchTimeMs?: number,
    assistantId?: string,
  ) => Promise<void>;
  deleteEventAndRefresh: (
    matchId: string,
    playerId: string,
    type: MatchEventType,
  ) => Promise<void>;
  adjustScore: (
    matchId: string,
    team: "home" | "away",
    delta: 1 | -1,
  ) => Promise<void>;
  replacePlayerOnTeam: (
    teamId: string,
    outPlayerId: string,
    inPlayerId: string,
  ) => Promise<void>;
  addPlayerToTeam: (teamId: string, playerId: string) => Promise<void>;
  onEndMatch: () => void;
  // History Drawer
  matches: Match[];
  onSelectMatch: (id: string) => void;
  teamNameById: Record<string, string>;
};

export default function ActiveMatchDashboard(props: Props) {
  const {
    match,
    pelada,
    homeTeamName,
    awayTeamName,
    homePlayers,
    awayPlayers,
    orgPlayerIdToUserId,
    userIdToName,
    orgPlayerIdToPlayer,
    statsMap,
    benchPlayers,
    finished,
    isAdmin,
    updating,
    selectMenu,
    setSelectMenu,
    playersPerTeam,
    onStartMatch,
    onPauseMatch,
    onOpenResetConfirm,
    recordEvent,
    deleteEventAndRefresh,
    adjustScore,
    replacePlayerOnTeam,
    addPlayerToTeam,
    onEndMatch,
    matches,
    onSelectMatch,
    teamNameById,
  } = props;

  const { t } = useTranslation();
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [assistDialogOpen, setAssistDialogOpen] = useState(false);
  const [goalScorerInfo, setGoalScorerInfo] = useState<{
    playerId: string;
    side: "home" | "away";
  } | null>(null);

  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [selectedEventPlayerId, setSelectedEventPlayerId] = useState<
    string | null
  >(null);
  const [selectedEventType, setSelectedEventType] =
    useState<MatchEventType | null>(null);

  const assistantOptions = useMemo(() => {
    if (!goalScorerInfo) return [];
    const teamPlayers =
      goalScorerInfo.side === "home" ? homePlayers : awayPlayers;
    return teamPlayers.filter((p) => p.player_id !== goalScorerInfo.playerId);
  }, [goalScorerInfo, homePlayers, awayPlayers]);

  const handleSelectAssistant = (assistantId?: string) => {
    if (!goalScorerInfo) return;
    recordEvent(
      match.id,
      goalScorerInfo.playerId,
      "goal",
      undefined,
      undefined,
      assistantId,
    );
    adjustScore(match.id, goalScorerInfo.side, 1);
    setAssistDialogOpen(false);
    setGoalScorerInfo(null);
  };

  const handleCloseAssistDialog = () => {
    setAssistDialogOpen(false);
    setGoalScorerInfo(null);
  };

  const handleConfirmEvent = async () => {
    if (!selectedEventPlayerId || !selectedEventType) return;
    await recordEvent(
      match.id,
      selectedEventPlayerId,
      selectedEventType,
      undefined,
      undefined,
    );
    setSelectedEventPlayerId(null);
    setSelectedEventType(null);
    setEventDialogOpen(false);
  };

  const effectiveFinished = finished && !isEditing;

  const getPlayerName = useCallback(
    (pid: string) => {
      const uid = orgPlayerIdToUserId[pid];
      return uid && userIdToName[uid] ? userIdToName[uid] : `Player #${pid}`;
    },
    [orgPlayerIdToUserId, userIdToName],
  );

  const nextMatchId = useMemo(() => {
    if (matches.some((m) => m.status === "running")) return null;
    return matches.find((m) => m.status === "scheduled")?.id || null;
  }, [matches]);

  const handleStatChange = (
    playerId: string,
    type: "goal" | "assist" | "own_goal",
    diff: number,
    side: "home" | "away",
  ) => {
    if (diff === 0) return;

    const absDiff = Math.abs(diff);
    for (let i = 0; i < absDiff; i++) {
      if (diff > 0) {
        if (type === "goal") {
          setGoalScorerInfo({ playerId, side });
          setAssistDialogOpen(true);
        } else {
          recordEvent(match.id, playerId, type, undefined, undefined);
          if (type === "own_goal") {
            adjustScore(match.id, side === "home" ? "away" : "home", 1);
          }
        }
      } else {
        deleteEventAndRefresh(match.id, playerId, type);
        if (type === "goal") {
          adjustScore(match.id, side, -1);
        } else if (type === "own_goal") {
          adjustScore(match.id, side === "home" ? "away" : "home", -1);
        }
      }
    }
  };

  const targetCount = useMemo(() => {
    let base = Number(playersPerTeam || 0);
    if (pelada.fixed_goalkeepers && base > 0) {
      base += 1;
    }
    return Math.max(base, homePlayers.length, awayPlayers.length);
  }, [
    playersPerTeam,
    pelada.fixed_goalkeepers,
    homePlayers.length,
    awayPlayers.length,
  ]);

  const generateTeamList = useCallback(
    (players: TeamPlayer[], side: "home" | "away", teamId: string) => {
      // Sort by position then name
      const sortedPlayers = [...players].sort((a, b) => {
        const playerA = orgPlayerIdToPlayer[a.player_id];
        const playerB = orgPlayerIdToPlayer[b.player_id];

        // 1. Manual goalkeeper override (highest priority)
        if (a.is_goalkeeper && !b.is_goalkeeper) return -1;
        if (!a.is_goalkeeper && b.is_goalkeeper) return 1;

        // 2. Standard position order
        const getPosStr = (p?: Player) =>
          (p?.position || p?.user_position || "").toLowerCase();

        const posA = POSITION_ORDER[getPosStr(playerA)] ?? 99;
        const posB = POSITION_ORDER[getPosStr(playerB)] ?? 99;

        if (posA !== posB) return posA - posB;

        const nameA = getPlayerName(a.player_id).toLowerCase();
        const nameB = getPlayerName(b.player_id).toLowerCase();
        return nameA.localeCompare(nameB);
      });

      const list = sortedPlayers.map((p) => ({
        ...p,
        side,
        teamId,
        isEmpty: false,
      }));
      if (targetCount > 0 && players.length < targetCount) {
        const missing = targetCount - players.length;
        for (let i = 0; i < missing; i++) {
          list.push({
            player_id: String(-1 * (i + 1 + (side === "home" ? 0 : 100))),
            team_id: teamId,
            is_goalkeeper: false,
            side,
            teamId,
            isEmpty: true,
          });
        }
      }
      return list;
    },
    [orgPlayerIdToPlayer, getPlayerName, targetCount],
  );

  const homeList = useMemo(
    () => generateTeamList(homePlayers, "home", match.home_team_id),
    [homePlayers, match.home_team_id, generateTeamList],
  );
  const awayList = useMemo(
    () => generateTeamList(awayPlayers, "away", match.away_team_id),
    [awayPlayers, match.away_team_id, generateTeamList],
  );

  const eventPlayerOptions = useMemo(() => {
    const home = homeList.filter((p) => !p.isEmpty);
    const away = awayList.filter((p) => !p.isEmpty);
    return { home, away };
  }, [homeList, awayList]);

  const nextMatch = useMemo(() => {
    return (
      matches
        .filter((m) => m.status === "scheduled" && m.sequence > match.sequence)
        .sort((a, b) => a.sequence - b.sequence)[0] || null
    );
  }, [matches, match.sequence]);

  return (
    <Box sx={{ pb: 8 }}>
      <Stack spacing={2}>
        {/* Top Actions Row */}
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: "center",
            }}
          >
            <Button
              onClick={() => setHistoryOpen(true)}
              size="small"
              variant="outlined"
              startIcon={<HistoryIcon />}
              data-testid="toggle-history-drawer"
              sx={{
                textTransform: "none",
                borderRadius: 1.5,
                fontWeight: "bold",
                minWidth: "auto",
                px: 1,
              }}
            >
              {t("peladas.dashboard.button.history")}
            </Button>

            {nextMatch && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: { xs: 1.5, sm: 2 },
                  py: { xs: 0.6, sm: 0.8 },
                  bgcolor: "background.paper",
                  borderRadius: 10,
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  maxWidth: { xs: "220px", sm: "none" },
                  height: "30.75px", // Match MUI small button height roughly
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontWeight: "800",
                    fontSize: { xs: "0.6rem", sm: "0.65rem" },
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: { xs: "none", sm: "block" },
                  }}
                >
                  {t("peladas.dashboard.summary.next_up")}:
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: "bold",
                    fontSize: { xs: "0.75rem", sm: "0.85rem" },
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Box component="span" sx={{ color: "home.main" }}>
                    {teamNameById[nextMatch.home_team_id] || "Home"}
                  </Box>
                  <Box
                    component="span"
                    sx={{ color: "text.disabled", mx: 1, fontWeight: "500" }}
                  >
                    vs
                  </Box>
                  <Box component="span" sx={{ color: "away.main" }}>
                    {teamNameById[nextMatch.away_team_id] || "Away"}
                  </Box>
                </Typography>
              </Box>
            )}
          </Stack>

          {isAdmin && finished && (
            <Button
              startIcon={isEditing ? <CheckCircleIcon /> : <EditIcon />}
              color={isEditing ? "success" : "warning"}
              variant={isEditing ? "contained" : "outlined"}
              onClick={() => setIsEditing(!isEditing)}
              size="small"
              sx={{ textTransform: "none", borderRadius: 2 }}
              data-testid={
                isEditing ? "finish-editing-button" : "edit-match-button"
              }
            >
              {isEditing
                ? t("peladas.dashboard.button.finish_editing")
                : t("peladas.dashboard.button.edit_match")}
            </Button>
          )}
        </Stack>

        {/* Hero Scoreboard */}
        <MatchScoreHero
          match={match}
          pelada={pelada}
          homeTeamName={homeTeamName}
          awayTeamName={awayTeamName}
          isAdmin={isAdmin}
          onStartMatch={onStartMatch}
          onPauseMatch={onPauseMatch}
          onOpenResetConfirm={onOpenResetConfirm}
          onEndMatch={onEndMatch}
          updating={updating}
        />

        {isAdmin && !effectiveFinished && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 1 }}>
            <Button
              variant="outlined"
              color="primary"
              size="medium"
              startIcon={<BoltIcon />}
              onClick={() => setEventDialogOpen(true)}
              data-testid="record-event-inline-button"
              sx={{
                borderRadius: 3,
                px: 3,
                py: 0.75,
                fontWeight: "bold",
                textTransform: "none",
                fontSize: "0.9rem",
                borderWidth: "1.5px",
                borderColor: "primary.main",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  borderWidth: "1.5px",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  bgcolor: "action.hover",
                },
              }}
            >
              {t(
                "peladas.matches.record_event_inline",
                "Registrar Evento (Drible, Defesa, Chute...)",
              )}
            </Button>
          </Box>
        )}

        {/* Players Section */}
        <Grid container spacing={2}>
          {/* Home Team */}
          <Grid size={{ xs: 12, sm: 6 }} data-testid="home-team-match-section">
            <Box
              sx={{
                mb: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
                pl: 1,
              }}
            >
              <Box
                sx={{
                  width: 4,
                  height: 16,
                  bgcolor: theme.palette.home.main,
                  borderRadius: 1,
                }}
              />
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: "bold",
                  color: "text.secondary",
                }}
              >
                {homeTeamName.toUpperCase()}
              </Typography>
            </Box>
            <Stack spacing={1}>
              {homeList.map((p) => {
                return (
                  <MatchPlayerCard
                    key={p.player_id}
                    player={p}
                    playerName={getPlayerName(p.player_id)}
                    playerData={orgPlayerIdToPlayer[p.player_id]}
                    stats={
                      statsMap[p.player_id] || {
                        goals: 0,
                        assists: 0,
                        ownGoals: 0,
                      }
                    }
                    finished={effectiveFinished}
                    isAdmin={isAdmin}
                    onStatChange={(type, diff, side) =>
                      handleStatChange(p.player_id, type, diff, side)
                    }
                    onSubClick={() =>
                      setSelectMenu({
                        teamId: p.teamId,
                        forPlayerId: p.player_id,
                        type: p.isEmpty ? "add" : "replace",
                      })
                    }
                  />
                );
              })}
            </Stack>
          </Grid>

          {/* Away Team */}
          <Grid size={{ xs: 12, sm: 6 }} data-testid="away-team-match-section">
            <Box
              sx={{
                mb: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
                pl: 1,
              }}
            >
              <Box
                sx={{
                  width: 4,
                  height: 16,
                  bgcolor: theme.palette.away.main,
                  borderRadius: 1,
                }}
              />
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: "bold",
                  color: "text.secondary",
                }}
              >
                {awayTeamName.toUpperCase()}
              </Typography>
            </Box>
            <Stack spacing={1}>
              {awayList.map((p) => {
                return (
                  <MatchPlayerCard
                    key={p.player_id}
                    player={p}
                    playerName={getPlayerName(p.player_id)}
                    playerData={orgPlayerIdToPlayer[p.player_id]}
                    stats={
                      statsMap[p.player_id] || {
                        goals: 0,
                        assists: 0,
                        ownGoals: 0,
                      }
                    }
                    finished={effectiveFinished}
                    isAdmin={isAdmin}
                    onStatChange={(type, diff, side) =>
                      handleStatChange(p.player_id, type, diff, side)
                    }
                    onSubClick={() =>
                      setSelectMenu({
                        teamId: p.teamId,
                        forPlayerId: p.player_id,
                        type: p.isEmpty ? "add" : "replace",
                      })
                    }
                  />
                );
              })}
            </Stack>
          </Grid>
        </Grid>
      </Stack>
      {/* Substitute Selector */}
      {selectMenu && (
        <PlayerSelectMenu
          teamId={selectMenu.teamId}
          benchPlayers={benchPlayers}
          onClose={() => setSelectMenu(null)}
          onSelect={(pid) => {
            if (selectMenu.type === "add") {
              addPlayerToTeam(selectMenu.teamId, pid);
            } else {
              replacePlayerOnTeam(
                selectMenu.teamId,
                selectMenu.forPlayerId!,
                pid,
              );
            }
          }}
          getPlayerName={getPlayerName}
        />
      )}
      {/* Who Assisted Dialog */}
      <Dialog
        open={assistDialogOpen}
        onClose={handleCloseAssistDialog}
        fullWidth
        maxWidth="xs"
        data-testid="assist-select-dialog"
      >
        <DialogTitle sx={{ fontWeight: "bold" }}>
          {t("peladas.matches.who_assisted", "Who assisted?")}
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <List sx={{ pt: 0, maxHeight: 400, overflow: "auto" }}>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleSelectAssistant(undefined)}
                data-testid="without-assistance-option"
              >
                <Avatar
                  sx={{
                    bgcolor: "text.disabled",
                    width: 40,
                    height: 40,
                    mr: 2,
                  }}
                >
                  <BlockIcon />
                </Avatar>
                <ListItemText
                  primary={t("common.without_assistance")}
                  slotProps={{
                    primary: {
                      sx: { fontWeight: "bold", color: "text.secondary" },
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>

            {assistantOptions.map((player) => {
              const name = getPlayerName(player.player_id);
              const playerData = orgPlayerIdToPlayer[player.player_id];
              return (
                <ListItem key={player.player_id} disablePadding>
                  <ListItemButton
                    onClick={() => handleSelectAssistant(player.player_id)}
                    data-testid={`assistant-player-item-${player.player_id}`}
                  >
                    <SecureAvatar
                      userId={playerData?.user_id}
                      filename={playerData?.user_avatar_filename}
                      sx={{
                        width: 40,
                        height: 40,
                        fontSize: "0.9rem",
                        fontWeight: "bold",
                        mr: 2,
                      }}
                      fallbackText={name.substring(0, 2).toUpperCase()}
                    />
                    <ListItemText
                      primary={name}
                      slotProps={{
                        primary: { sx: { fontWeight: "bold" } },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </DialogContent>
      </Dialog>
      {/* History Drawer */}
      <Drawer
        anchor="left"
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        data-testid="history-drawer"
      >
        <Box sx={{ width: 320, p: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
              mb: 3,
              px: 1,
            }}
          >
            {t("peladas.matches.history_title")}
          </Typography>
          <List sx={{ px: 0 }}>
            {matches.map((m) => {
              const isSelected = match.id === m.id;
              const isNext = m.id === nextMatchId;
              const status = isNext ? "next" : m.status;

              const statusColor =
                status === "finished"
                  ? "success"
                  : status === "running"
                    ? "primary"
                    : status === "next"
                      ? "info"
                      : "default";

              return (
                <ListItem key={m.id} disablePadding sx={{ mb: 1.5 }}>
                  <ListItemButton
                    selected={isSelected}
                    onClick={() => {
                      onSelectMatch(m.id);
                      setHistoryOpen(false);
                    }}
                    sx={{
                      borderRadius: 3,
                      border: "1px solid",
                      borderColor: isSelected
                        ? "primary.main"
                        : isNext
                          ? "info.light"
                          : "divider",
                      bgcolor: isSelected
                        ? "primary.lighter"
                        : isNext
                          ? "info.lighter"
                          : "transparent",
                      flexDirection: "column",
                      alignItems: "stretch",
                      gap: 1,
                      p: 1.5,
                      "&:hover": {
                        bgcolor: isSelected
                          ? "primary.lighter"
                          : isNext
                            ? "info.lighter"
                            : "action.hover",
                      },
                    }}
                    data-testid={`match-history-item-${m.sequence}`}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 0.5,
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                          alignItems: "center",
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            fontSize: "0.75rem",
                            bgcolor: isSelected
                              ? "primary.main"
                              : isNext
                                ? "info.main"
                                : "text.secondary",
                            fontWeight: "bold",
                          }}
                        >
                          {m.sequence}
                        </Avatar>
                        <Typography
                          variant="caption"
                          color={
                            isSelected
                              ? "primary.main"
                              : isNext
                                ? "info.main"
                                : "text.secondary"
                          }
                          sx={{
                            fontWeight: "bold",
                          }}
                        >
                          {t("peladas.matches.match_label", {
                            seq: m.sequence,
                          }).toUpperCase()}
                        </Typography>
                      </Stack>
                      <Chip
                        label={t(`peladas.matches.status.${status}`)}
                        size="small"
                        color={statusColor}
                        variant={
                          status === "running" || status === "next"
                            ? "filled"
                            : "outlined"
                        }
                        sx={{
                          height: 20,
                          fontSize: "0.65rem",
                          fontWeight: "bold",
                          textTransform: "uppercase",
                        }}
                      />
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          flex: 1,
                          textAlign: "right",
                          fontWeight: m.home_score > m.away_score ? 800 : 500,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {teamNameById[m.home_team_id] || "Home"}
                      </Typography>

                      <Box
                        sx={{
                          px: 1.5,
                          py: 0.25,
                          borderRadius: 1,
                          bgcolor: "action.selected",
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          minWidth: 60,
                          justifyContent: "center",
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: "900",
                          }}
                        >
                          {m.home_score}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.disabled",
                            fontWeight: "bold",
                          }}
                        >
                          x
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: "900",
                          }}
                        >
                          {m.away_score}
                        </Typography>
                      </Box>

                      <Typography
                        variant="body2"
                        sx={{
                          flex: 1,
                          textAlign: "left",
                          fontWeight: m.away_score > m.home_score ? 800 : 500,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {teamNameById[m.away_team_id] || "Away"}
                      </Typography>
                    </Box>
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>

      {/* Floating Action Button for recording custom events */}
      {isAdmin && !effectiveFinished && (
        <Fab
          color="primary"
          aria-label="record event"
          onClick={() => setEventDialogOpen(true)}
          sx={{
            position: "fixed",
            bottom: { xs: 16, sm: 24 },
            right: { xs: 16, sm: 24 },
            boxShadow: 4,
            zIndex: 1000,
          }}
          data-testid="record-event-fab"
        >
          <BoltIcon />
        </Fab>
      )}

      {/* Dialogue overlay for custom events */}
      <Dialog
        open={eventDialogOpen}
        onClose={() => {
          setSelectedEventPlayerId(null);
          setSelectedEventType(null);
          setEventDialogOpen(false);
        }}
        fullWidth
        maxWidth="md"
        data-testid="record-event-dialog"
      >
        <DialogTitle sx={{ fontWeight: "bold" }}>
          {t("peladas.matches.record_event_title", "Registrar Evento")}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            {/* Player Selector Column */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: "bold", mb: 1.5, color: "text.secondary" }}
              >
                {t("peladas.matches.select_player", "SELECIONAR JOGADOR")}
              </Typography>
              <Box sx={{ maxHeight: 350, overflow: "auto", pr: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: "bold",
                    color: "home.main",
                    display: "block",
                    mb: 1,
                  }}
                >
                  {homeTeamName.toUpperCase()}
                </Typography>
                <List sx={{ p: 0, mb: 2 }}>
                  {eventPlayerOptions.home.map((player) => {
                    const name = getPlayerName(player.player_id);
                    const playerData = orgPlayerIdToPlayer[player.player_id];
                    const isSelected =
                      selectedEventPlayerId === player.player_id;
                    return (
                      <ListItem
                        key={player.player_id}
                        disablePadding
                        sx={{ mb: 0.5 }}
                      >
                        <ListItemButton
                          selected={isSelected}
                          onClick={() =>
                            setSelectedEventPlayerId(player.player_id)
                          }
                          sx={{
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: isSelected
                              ? "primary.main"
                              : "divider",
                            bgcolor: isSelected
                              ? alpha(theme.palette.primary.main, 0.08)
                              : "transparent",
                          }}
                          data-testid={`event-player-item-${player.player_id}`}
                        >
                          <SecureAvatar
                            userId={playerData?.user_id}
                            filename={playerData?.user_avatar_filename}
                            sx={{
                              width: 32,
                              height: 32,
                              fontSize: "0.8rem",
                              fontWeight: "bold",
                              mr: 1.5,
                            }}
                            fallbackText={name.substring(0, 2).toUpperCase()}
                          />
                          <ListItemText
                            primary={name}
                            slotProps={{
                              primary: {
                                sx: {
                                  fontWeight: isSelected ? "bold" : "normal",
                                },
                              },
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>

                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: "bold",
                    color: "away.main",
                    display: "block",
                    mb: 1,
                  }}
                >
                  {awayTeamName.toUpperCase()}
                </Typography>
                <List sx={{ p: 0 }}>
                  {eventPlayerOptions.away.map((player) => {
                    const name = getPlayerName(player.player_id);
                    const playerData = orgPlayerIdToPlayer[player.player_id];
                    const isSelected =
                      selectedEventPlayerId === player.player_id;
                    return (
                      <ListItem
                        key={player.player_id}
                        disablePadding
                        sx={{ mb: 0.5 }}
                      >
                        <ListItemButton
                          selected={isSelected}
                          onClick={() =>
                            setSelectedEventPlayerId(player.player_id)
                          }
                          sx={{
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: isSelected
                              ? "primary.main"
                              : "divider",
                            bgcolor: isSelected
                              ? alpha(theme.palette.primary.main, 0.08)
                              : "transparent",
                          }}
                          data-testid={`event-player-item-${player.player_id}`}
                        >
                          <SecureAvatar
                            userId={playerData?.user_id}
                            filename={playerData?.user_avatar_filename}
                            sx={{
                              width: 32,
                              height: 32,
                              fontSize: "0.8rem",
                              fontWeight: "bold",
                              mr: 1.5,
                            }}
                            fallbackText={name.substring(0, 2).toUpperCase()}
                          />
                          <ListItemText
                            primary={name}
                            slotProps={{
                              primary: {
                                sx: {
                                  fontWeight: isSelected ? "bold" : "normal",
                                },
                              },
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            </Grid>

            {/* Event Selector Column */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: "bold", mb: 1.5, color: "text.secondary" }}
              >
                {t("peladas.matches.select_event", "SELECIONAR EVENTO")}
              </Typography>
              <Grid container spacing={2}>
                {[
                  {
                    type: "drible",
                    label: t("common.drible"),
                    icon: (
                      <BoltIcon sx={{ fontSize: "2rem", color: "#d97706" }} />
                    ),
                    color: "#d97706",
                  },
                  {
                    type: "chute",
                    label: t("common.chute"),
                    icon: (
                      <LocalFireDepartmentIcon
                        sx={{ fontSize: "2rem", color: "#e11d48" }}
                      />
                    ),
                    color: "#e11d48",
                  },
                  {
                    type: "falta",
                    label: t("common.falta"),
                    icon: (
                      <WarningIcon
                        sx={{ fontSize: "2rem", color: "#ea580c" }}
                      />
                    ),
                    color: "#ea580c",
                  },
                  {
                    type: "furada",
                    label: t("common.furada"),
                    icon: (
                      <SentimentVeryDissatisfiedIcon
                        sx={{ fontSize: "2rem", color: "#6b7280" }}
                      />
                    ),
                    color: "#6b7280",
                  },
                  {
                    type: "defesa",
                    label: t("common.defesa"),
                    icon: (
                      <ShieldIcon sx={{ fontSize: "2rem", color: "#0d9488" }} />
                    ),
                    color: "#0d9488",
                  },
                  {
                    type: "vish",
                    label: t("common.vish"),
                    icon: (
                      <SentimentVerySatisfiedIcon
                        sx={{ fontSize: "2rem", color: "#7c3aed" }}
                      />
                    ),
                    color: "#7c3aed",
                  },
                ].map((ev) => {
                  const isSelected = selectedEventType === ev.type;
                  return (
                    <Grid size={{ xs: 6 }} key={ev.type}>
                      <Paper
                        variant="outlined"
                        onClick={() =>
                          setSelectedEventType(ev.type as MatchEventType)
                        }
                        sx={{
                          p: 2.5,
                          borderRadius: 3,
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 1,
                          border: "2px solid",
                          borderColor: isSelected ? ev.color : "divider",
                          bgcolor: isSelected
                            ? alpha(ev.color, 0.08)
                            : "background.paper",
                          transition: "all 0.2s",
                          "&:hover": {
                            borderColor: ev.color,
                            bgcolor: alpha(ev.color, 0.04),
                            transform: "translateY(-2px)",
                            boxShadow: 1,
                          },
                        }}
                        data-testid={`event-type-card-${ev.type}`}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "32px",
                            mb: 0.5,
                          }}
                        >
                          {ev.icon}
                        </Box>
                        <Typography
                          sx={{
                            fontWeight: "bold",
                            color: isSelected ? ev.color : "text.primary",
                            fontSize: "0.9rem",
                          }}
                        >
                          {ev.label}
                        </Typography>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </Grid>
          </Grid>

          <Stack
            direction="row"
            spacing={2}
            sx={{ mt: 4, justifyContent: "flex-end" }}
          >
            <Button
              variant="outlined"
              onClick={() => {
                setSelectedEventPlayerId(null);
                setSelectedEventType(null);
                setEventDialogOpen(false);
              }}
              sx={{ borderRadius: 2, textTransform: "none" }}
              data-testid="cancel-event-button"
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="contained"
              disabled={!selectedEventPlayerId || !selectedEventType}
              onClick={handleConfirmEvent}
              sx={{ borderRadius: 2, textTransform: "none" }}
              data-testid="confirm-event-button"
            >
              {t("peladas.matches.confirm_registration", "Confirmar Registro")}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
