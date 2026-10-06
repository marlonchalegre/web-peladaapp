import {
  Box,
  Typography,
  Stack,
  Paper,
  IconButton,
  useTheme,
  Button,
  alpha,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";
import StarsIcon from "@mui/icons-material/Stars";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BoltIcon from "@mui/icons-material/Bolt";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import WarningIcon from "@mui/icons-material/Warning";
import SentimentVeryDissatisfiedIcon from "@mui/icons-material/SentimentVeryDissatisfied";
import ShieldIcon from "@mui/icons-material/Shield";
import SentimentVerySatisfiedIcon from "@mui/icons-material/SentimentVerySatisfied";
import { useTranslation } from "react-i18next";
import type { MatchEvent, Match } from "../../../shared/api/endpoints";
import { formatMs } from "../../../shared/utils/timeUtils";
import { getPlayerTeamInMatch, isAssistForGoal } from "../utils/playerUtils";

interface GroupedEvent {
  id: string;
  timeMs: number;
  matchTimeMs: number;
  type:
    | "goal"
    | "own_goal"
    | "assist"
    | "drible"
    | "chute"
    | "falta"
    | "furada"
    | "defesa"
    | "vish";
  goalEvent?: MatchEvent;
  assistEvent?: MatchEvent;
  standaloneEvent?: MatchEvent;
}

interface PeladaTimelineProps {
  events: MatchEvent[];
  userIdToName: Record<string, string>;
  orgPlayerIdToUserId: Record<string, string>;
  teamNameById: Record<string, string>;
  matches?: Match[];
  orgPlayerIdToTeamId?: Record<string, string>;
  lineupsByMatch?: Record<string, Record<string, { player_id: string }[]>>;
  teamPlayers?: Record<string, { player_id: string }[]>;
  isAdmin?: boolean;
  onEditClick?: (event: MatchEvent) => void;
  onDeleteClick?: (event: MatchEvent) => void;
}

function TimelineCard({
  groupedEvent,
  side,
  isAdmin = false,
  onEditClick,
  onDeleteClick,
  getPlayerName,
  teamColor,
}: {
  groupedEvent: GroupedEvent;
  side: "home" | "away";
  isAdmin?: boolean;
  onEditClick?: (event: MatchEvent) => void;
  onDeleteClick?: (event: MatchEvent) => void;
  getPlayerName: (pid: string) => string;
  teamColor: string;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  const scorerId =
    groupedEvent.goalEvent?.player_id ||
    groupedEvent.standaloneEvent?.player_id;
  const scorerName = getPlayerName(scorerId || "");
  const assistantId = groupedEvent.assistEvent?.player_id;
  const assistantName = assistantId ? getPlayerName(assistantId) : null;

  const targetEvent = groupedEvent.goalEvent || groupedEvent.standaloneEvent;

  const getEventConfig = (type: string) => {
    switch (type) {
      case "goal":
        return {
          icon: <SportsSoccerIcon sx={{ fontSize: "15px" }} />,
          title: t("common.goal"),
          color: theme.palette.matchEvents?.goal || theme.palette.success.main,
          bg: theme.palette.matchEventBg?.goal || theme.palette.action.hover,
        };
      case "own_goal":
        return {
          icon: <ErrorOutlinedIcon sx={{ fontSize: "15px" }} />,
          title: t("common.own_goal"),
          color:
            theme.palette.matchEvents?.own_goal || theme.palette.error.main,
          bg:
            theme.palette.matchEventBg?.own_goal || theme.palette.action.hover,
        };
      case "assist":
        return {
          icon: <StarsIcon sx={{ fontSize: "15px" }} />,
          title: t("common.assist"),
          color: theme.palette.matchEvents?.assist || theme.palette.info.main,
          bg: theme.palette.matchEventBg?.assist || theme.palette.action.hover,
        };
      case "drible":
        return {
          icon: <BoltIcon sx={{ fontSize: "15px" }} />,
          title: t("common.drible"),
          color: theme.palette.matchEvents?.drible || "#f6a45c",
          bg: theme.palette.matchEventBg?.drible || theme.palette.action.hover,
        };
      case "chute":
        return {
          icon: <LocalFireDepartmentIcon sx={{ fontSize: "15px" }} />,
          title: t("common.chute"),
          color: theme.palette.matchEvents?.chute || "#8fbde8",
          bg: theme.palette.matchEventBg?.chute || theme.palette.action.hover,
        };
      case "falta":
        return {
          icon: <WarningIcon sx={{ fontSize: "15px" }} />,
          title: t("common.falta"),
          color: theme.palette.matchEvents?.falta || "#e06c50",
          bg: theme.palette.matchEventBg?.falta || theme.palette.action.hover,
        };
      case "furada":
        return {
          icon: <SentimentVeryDissatisfiedIcon sx={{ fontSize: "15px" }} />,
          title: t("common.furada"),
          color: theme.palette.matchEvents?.furada || "#9a958a",
          bg: theme.palette.matchEventBg?.furada || theme.palette.action.hover,
        };
      case "defesa":
        return {
          icon: <ShieldIcon sx={{ fontSize: "15px" }} />,
          title: t("common.defesa"),
          color: theme.palette.matchEvents?.defesa || "#2e7d32",
          bg: theme.palette.matchEventBg?.defesa || theme.palette.action.hover,
        };
      case "vish":
        return {
          icon: <SentimentVerySatisfiedIcon sx={{ fontSize: "15px" }} />,
          title: t("common.vish"),
          color: theme.palette.matchEvents?.vish || "#a78bfa",
          bg: theme.palette.matchEventBg?.vish || theme.palette.action.hover,
        };
      default:
        return {
          icon: <SportsSoccerIcon sx={{ fontSize: "15px" }} color="disabled" />,
          title: t(`common.${type}`, type),
          color: theme.palette.text.secondary,
          bg: theme.palette.action.hover,
        };
    }
  };

  const config = getEventConfig(groupedEvent.type);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.25, sm: 1.5 },
        borderRadius: "13px",
        border: (theme) => `1.5px solid ${theme.palette.divider}`,
        position: "relative",
        minWidth: { xs: 130, sm: 210 },
        maxWidth: 290,
        bgcolor: "background.paper",
        boxShadow: (theme) => theme.customShadows?.card || "none",
        display: "flex",
        flexDirection: "column",
        gap: 0.5,

        // Refined side spine accent border
        borderRight: side === "home" ? `3.5px solid ${teamColor}` : undefined,
        borderLeft: side === "away" ? `3.5px solid ${teamColor}` : undefined,
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <Stack
          direction="row"
          spacing={1.25}
          sx={{
            alignItems: "center",
            minWidth: 0,
            flexGrow: 1,
          }}
        >
          {/* Dedicated event icon box */}
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "8px",
              bgcolor: config.bg,
              color: config.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {config.icon}
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: { xs: "11px", sm: "12px" },
                letterSpacing: ".03em",
                color: "text.primary",
                lineHeight: 1.2,
                textTransform: "uppercase",
              }}
            >
              {config.title}
            </Typography>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 600,
                color: "text.secondary",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "block",
                fontSize: { xs: "10.5px", sm: "11.5px" },
                lineHeight: 1.2,
                mt: "2px",
              }}
            >
              {scorerName}
            </Typography>
          </Box>
        </Stack>

        {/* Admin actions */}
        {isAdmin && targetEvent && (
          <Stack direction="row" spacing={0.25} sx={{ ml: 0.5, flexShrink: 0 }}>
            <IconButton
              size="small"
              onClick={() => onEditClick?.(targetEvent)}
              sx={{
                p: 0.5,
                color: "text.secondary",
                "&:hover": { color: "text.primary", bgcolor: "action.hover" },
              }}
              data-testid={`edit-event-${targetEvent.id}`}
            >
              <EditIcon sx={{ fontSize: "14px" }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onDeleteClick?.(targetEvent)}
              sx={{
                p: 0.5,
                color: "error.main",
                "&:hover": {
                  bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                },
              }}
              data-testid={`delete-event-${targetEvent.id}`}
            >
              <DeleteIcon sx={{ fontSize: "14px" }} />
            </IconButton>
          </Stack>
        )}
      </Stack>

      {/* Nested assistant info */}
      {assistantName && (
        <Box
          sx={{
            mt: 0.75,
            pt: 0.75,
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            display: "flex",
            alignItems: "center",
            gap: 0.75,
          }}
        >
          <StarsIcon
            sx={{ fontSize: "12px", color: "info.main", flexShrink: 0 }}
          />
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontWeight: 600,
              fontSize: { xs: "10px", sm: "11px" },
              color: "text.secondary",
            }}
          >
            {t("common.assist")}: {assistantName}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

export default function PeladaTimeline({
  events,
  userIdToName,
  orgPlayerIdToUserId,
  teamNameById,
  matches,
  orgPlayerIdToTeamId,
  lineupsByMatch,
  teamPlayers,
  isAdmin,
  onEditClick,
  onDeleteClick,
}: PeladaTimelineProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const homeColor = theme.palette.home?.main || theme.palette.secondary.main;
  const awayColor = theme.palette.away?.main || theme.palette.primary.main;

  const getPlayerName = (playerId: string) => {
    const userId = orgPlayerIdToUserId[playerId];
    return userIdToName[userId] || `Player ${playerId}`;
  };

  const handleExportTimeline = async () => {
    const headers = [
      t("peladas.timeline.export.headers.match", "Match"),
      t("peladas.timeline.export.headers.session_time", "Session Time"),
      t("peladas.timeline.export.headers.match_time", "Match Time"),
      t("peladas.timeline.export.headers.event_type", "Event"),
      t("peladas.timeline.export.headers.player", "Player"),
      t("peladas.timeline.export.headers.assist", "Assist"),
      t("peladas.timeline.export.headers.team", "Team"),
    ];

    const rows: string[][] = [];

    const getEventTitle = (type: string) => t(`common.${type}`, type);

    if (!matches || matches.length === 0) {
      const sortedEvents = [...events].sort((a, b) => {
        if (a.session_time_ms && b.session_time_ms) {
          return a.session_time_ms - b.session_time_ms;
        }
        if (a.id && b.id) {
          return String(a.id).localeCompare(String(b.id));
        }
        return 0;
      });

      sortedEvents.forEach((event) => {
        const teamId = orgPlayerIdToTeamId
          ? orgPlayerIdToTeamId[event.player_id]
          : null;
        const teamName = teamId ? teamNameById[teamId] || "" : "";
        rows.push([
          "-",
          formatMs(event.session_time_ms),
          formatMs(event.match_time_ms),
          getEventTitle(event.event_type),
          getPlayerName(event.player_id),
          "-",
          teamName || "-",
        ]);
      });
    } else {
      const sortedMatches = [...matches].sort(
        (a, b) => a.sequence - b.sequence,
      );

      sortedMatches.forEach((match) => {
        const matchEvents = events.filter((e) => e.match_id === match.id);
        if (matchEvents.length === 0) return;

        const goals = matchEvents.filter(
          (e) => e.event_type === "goal" || e.event_type === "own_goal",
        );
        const assists = matchEvents.filter((e) => e.event_type === "assist");
        const customEvents = matchEvents.filter(
          (e) => !["goal", "own_goal", "assist"].includes(e.event_type),
        );

        const grouped: GroupedEvent[] = [];
        const pairedAssistIds = new Set<string>();

        goals.forEach((goal) => {
          const matchingAssist = assists.find(
            (a) => !pairedAssistIds.has(a.id!) && isAssistForGoal(a, goal),
          );

          if (matchingAssist) {
            pairedAssistIds.add(matchingAssist.id!);
          }

          grouped.push({
            id: goal.id!,
            timeMs: goal.session_time_ms ?? 0,
            matchTimeMs: goal.match_time_ms ?? 0,
            type: goal.event_type as "goal" | "own_goal",
            goalEvent: goal,
            assistEvent: matchingAssist,
          });
        });

        assists.forEach((assist) => {
          if (!pairedAssistIds.has(assist.id!)) {
            grouped.push({
              id: assist.id!,
              timeMs: assist.session_time_ms ?? 0,
              matchTimeMs: assist.match_time_ms ?? 0,
              type: "assist",
              standaloneEvent: assist,
            });
          }
        });

        customEvents.forEach((ev) => {
          grouped.push({
            id: ev.id!,
            timeMs: ev.session_time_ms ?? 0,
            matchTimeMs: ev.match_time_ms ?? 0,
            type: ev.event_type as GroupedEvent["type"],
            standaloneEvent: ev,
          });
        });

        grouped.sort((a, b) => a.timeMs - b.timeMs);

        grouped.forEach((groupedEvent) => {
          const targetEvent =
            groupedEvent.goalEvent || groupedEvent.standaloneEvent;
          const playerId = targetEvent?.player_id;
          const teamId = playerId
            ? getPlayerTeamInMatch(
                playerId,
                match.id,
                match,
                lineupsByMatch,
                teamPlayers,
                orgPlayerIdToTeamId,
              )
            : null;
          const teamName = teamId ? teamNameById[teamId] || "" : "";

          const scorerId =
            groupedEvent.goalEvent?.player_id ||
            groupedEvent.standaloneEvent?.player_id;
          const scorerName = getPlayerName(scorerId || "");
          const assistantId = groupedEvent.assistEvent?.player_id;
          const assistantName = assistantId ? getPlayerName(assistantId) : "";

          rows.push([
            `${match.sequence}`,
            formatMs(groupedEvent.timeMs),
            formatMs(groupedEvent.matchTimeMs),
            getEventTitle(groupedEvent.type),
            scorerName,
            assistantName,
            teamName,
          ]);
        });
      });
    }

    const tsvContent = [
      headers.join("\t"),
      ...rows.map((row) => row.join("\t")),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(tsvContent);
      alert(t("peladas.timeline.export_success"));
    } catch (err) {
      console.error("Failed to copy timeline table:", err);
    }
  };

  const exportButton = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 1.5,
        mb: 3,
        px: 0.5,
      }}
    >
      <Typography
        sx={{
          fontFamily: "Archivo, sans-serif",
          fontWeight: 800,
          fontSize: "10.5px",
          letterSpacing: ".14em",
          color: "text.secondary",
          textTransform: "uppercase",
        }}
      >
        {matches && matches.length > 0
          ? `${matches.length} ${matches.length === 1 ? t("peladas.dashboard.live_state.match_word", "PARTIDA") : t("peladas.matches.title", "PARTIDAS")} · ${events.length} ${t("peladas.dashboard.live_state.records_count", { count: events.length, defaultValue: `${events.length} registros` })}`
          : `${events.length} ${t("peladas.dashboard.live_state.records_count", { count: events.length, defaultValue: `${events.length} registros` })}`}
      </Typography>
      <Button
        variant="outlined"
        size="small"
        data-testid="export-tabular-button"
        startIcon={<ContentCopyIcon sx={{ fontSize: "14px" }} />}
        onClick={handleExportTimeline}
        sx={{
          borderRadius: "10px",
          border: (theme) => `1.5px solid ${theme.palette.divider}`,
          bgcolor: "background.paper",
          color: "text.secondary",
          fontFamily: "Archivo, sans-serif",
          fontWeight: 800,
          fontSize: "11px",
          letterSpacing: ".04em",
          textTransform: "none",
          px: "14px",
          py: "6px",
          "&:hover": {
            borderColor: "text.primary",
            color: "text.primary",
            bgcolor: "action.hover",
          },
        }}
      >
        {t("peladas.timeline.export_tabular")}
      </Button>
    </Box>
  );

  if (events.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 4, sm: 6 },
          textAlign: "center",
          borderRadius: "14px",
          border: (theme) => `1.5px solid ${theme.palette.divider}`,
          bgcolor: "background.paper",
          maxWidth: 420,
          mx: "auto",
          my: 4,
        }}
      >
        <SportsSoccerIcon
          sx={{
            fontSize: "40px",
            color: "text.secondary",
            opacity: 0.35,
            mb: 1.5,
          }}
        />
        <Typography
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 700,
            fontSize: "14px",
            color: "text.secondary",
          }}
        >
          {t("peladas.timeline.no_events")}
        </Typography>
      </Paper>
    );
  }

  // Fallback for simple timeline rendering (e.g. during testing or if matches are not loaded)
  if (!matches || matches.length === 0) {
    const sortedEvents = [...events].sort((a, b) => {
      if (a.session_time_ms && b.session_time_ms) {
        return a.session_time_ms - b.session_time_ms;
      }
      if (a.id && b.id) {
        return String(a.id).localeCompare(String(b.id));
      }
      return 0;
    });

    return (
      <Stack spacing={2} sx={{ p: 1 }} className="MuiTimeline-root">
        {exportButton}
        {sortedEvents.map((event, index) => {
          const isGoal =
            event.event_type === "goal" || event.event_type === "own_goal";
          return (
            <Paper
              key={event.id || index}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "12px",
                border: (theme) => `1.5px solid ${theme.palette.divider}`,
                bgcolor: "background.paper",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: isGoal ? 800 : 600,
                  fontSize: "13px",
                  color: "text.primary",
                }}
              >
                {event.event_type === "own_goal"
                  ? t("common.own_goal")
                  : t(`common.${event.event_type}`)}
                : {getPlayerName(event.player_id)}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mt: 0.5,
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 600,
                  color: "text.secondary",
                }}
              >
                {formatMs(event.session_time_ms)}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  fontFamily: "Archivo, sans-serif",
                  color: "text.disabled",
                }}
              >
                ({t("peladas.timeline.match_short")}{" "}
                {formatMs(event.match_time_ms)})
              </Typography>
            </Paper>
          );
        })}
      </Stack>
    );
  }

  // Sort matches by sequence
  const sortedMatches = [...(matches || [])].sort(
    (a, b) => a.sequence - b.sequence,
  );

  return (
    <Box sx={{ py: 1 }} className="MuiTimeline-root">
      {exportButton}
      {sortedMatches.map((match, matchIdx) => {
        // Filter events for this match
        const matchEvents = events.filter((e) => e.match_id === match.id);
        if (matchEvents.length === 0) {
          return null; // skip match if no events
        }

        // Separate goals, assists, and custom events
        const goals = matchEvents.filter(
          (e) => e.event_type === "goal" || e.event_type === "own_goal",
        );
        const assists = matchEvents.filter((e) => e.event_type === "assist");
        const customEvents = matchEvents.filter(
          (e) => !["goal", "own_goal", "assist"].includes(e.event_type),
        );

        const grouped: {
          id: string;
          timeMs: number;
          matchTimeMs: number;
          type:
            | "goal"
            | "own_goal"
            | "assist"
            | "drible"
            | "chute"
            | "falta"
            | "furada"
            | "defesa"
            | "vish";
          goalEvent?: MatchEvent;
          assistEvent?: MatchEvent;
          standaloneEvent?: MatchEvent;
        }[] = [];

        const pairedAssistIds = new Set<string>();

        // Match goal and assist pairs
        goals.forEach((goal) => {
          const matchingAssist = assists.find(
            (a) => !pairedAssistIds.has(a.id!) && isAssistForGoal(a, goal),
          );

          if (matchingAssist) {
            pairedAssistIds.add(matchingAssist.id!);
          }

          grouped.push({
            id: goal.id!,
            timeMs: goal.session_time_ms ?? 0,
            matchTimeMs: goal.match_time_ms ?? 0,
            type: goal.event_type as "goal" | "own_goal",
            goalEvent: goal,
            assistEvent: matchingAssist,
          });
        });

        // Add standalone assists (historical data support)
        assists.forEach((assist) => {
          if (!pairedAssistIds.has(assist.id!)) {
            grouped.push({
              id: assist.id!,
              timeMs: assist.session_time_ms ?? 0,
              matchTimeMs: assist.match_time_ms ?? 0,
              type: "assist",
              standaloneEvent: assist,
            });
          }
        });

        // Add custom match events (drible, chute, falta, furada, defesa, vish)
        customEvents.forEach((ev) => {
          grouped.push({
            id: ev.id!,
            timeMs: ev.session_time_ms ?? 0,
            matchTimeMs: ev.match_time_ms ?? 0,
            type: ev.event_type as GroupedEvent["type"],
            standaloneEvent: ev,
          });
        });

        // Sort match timeline events chronologically
        grouped.sort((a, b) => a.timeMs - b.timeMs);

        const homeName = teamNameById[match.home_team_id] || "Home";
        const awayName = teamNameById[match.away_team_id] || "Away";

        return (
          <Box key={match.id} sx={{ mb: 6, mt: matchIdx > 0 ? 6 : 1 }}>
            <Paper
              elevation={0}
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: "center",
                justifyContent: "space-between",
                mb: 4,
                bgcolor: "background.paper",
                py: { xs: 1.5, md: "14px" },
                px: { xs: 2, md: 3 },
                borderRadius: "14px",
                border: (theme) => `1.5px solid ${theme.palette.divider}`,
                boxShadow: (theme) => theme.customShadows?.card || "none",
                gap: { xs: 1.5, md: 0 },
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              {/* Left Side: Sequence Pill Badge */}
              <Stack
                direction="row"
                spacing={1.5}
                sx={{
                  alignItems: "center",
                  justifyContent: { xs: "center", md: "flex-start" },
                  width: { xs: "100%", md: "auto" },
                }}
              >
                <Box
                  sx={{
                    px: "10px",
                    py: "4px",
                    borderRadius: "8px",
                    bgcolor: "action.hover",
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 900,
                      color: "text.primary",
                      fontSize: "11px",
                      letterSpacing: ".08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {match.sequence}
                  </Typography>
                </Box>
              </Stack>

              {/* Center: Teams Name & Large Score */}
              <Stack
                direction="row"
                spacing={{ xs: 1.5, sm: 2.5 }}
                sx={{
                  alignItems: "center",
                  justifyContent: "center",
                  width: { xs: "100%", md: "auto" },
                }}
              >
                {/* Home Team */}
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center", minWidth: 0 }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: homeColor,
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: { xs: "12px", md: "13px" },
                      color: "text.primary",
                      textTransform: "uppercase",
                      letterSpacing: ".02em",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: { xs: 90, sm: 140, md: 200 },
                    }}
                  >
                    {homeName}
                  </Typography>
                </Stack>

                {/* Score */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mx: { xs: 1, md: 2 },
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: "'Anton', sans-serif",
                      fontSize: { xs: "22px", md: "26px" },
                      color: homeColor,
                      lineHeight: 1,
                    }}
                  >
                    {match.home_score ?? 0}
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      color: "text.secondary",
                      mx: { xs: 1, md: 1.5 },
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 600,
                      fontSize: { xs: "13px", md: "15px" },
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: "'Anton', sans-serif",
                      fontSize: { xs: "22px", md: "26px" },
                      color: awayColor,
                      lineHeight: 1,
                    }}
                  >
                    {match.away_score ?? 0}
                  </Typography>
                </Box>

                {/* Away Team */}
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center", minWidth: 0 }}
                >
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: { xs: "12px", md: "13px" },
                      color: "text.primary",
                      textTransform: "uppercase",
                      letterSpacing: ".02em",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: { xs: 90, sm: 140, md: 200 },
                    }}
                  >
                    {awayName}
                  </Typography>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: awayColor,
                      flexShrink: 0,
                    }}
                  />
                </Stack>
              </Stack>

              {/* Right Side: Duration Label & Time */}
              <Stack
                direction={{ xs: "row", md: "column" }}
                spacing={{ xs: 1, md: 0.25 }}
                sx={{
                  alignItems: { xs: "center", md: "flex-end" },
                  justifyContent: { xs: "center", md: "flex-end" },
                  textAlign: { xs: "center", md: "right" },
                  width: { xs: "100%", md: "auto" },
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontSize: "8.5px",
                    fontWeight: 800,
                    color: "text.secondary",
                    letterSpacing: ".14em",
                    textTransform: "uppercase",
                  }}
                >
                  {t("peladas.matches.duration", "DURATION").toUpperCase()}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 800,
                    color: "text.primary",
                    fontSize: "13px",
                    lineHeight: 1.1,
                  }}
                >
                  {formatMs(match.timer_accumulated_ms || 0)}
                </Typography>
              </Stack>
            </Paper>

            {/* Split Axis Timeline */}
            <Box sx={{ position: "relative", py: 2 }}>
              {/* Spine line */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: "50%",
                  width: "2px",
                  bgcolor: "divider",
                  transform: "translateX(-50%)",
                  zIndex: 0,
                }}
              />

              {/* Timeline rows */}
              <Stack spacing={3.5}>
                {grouped.map((groupedEvent) => {
                  // Determine side: scorer's team compared to match home/away team
                  const targetEvent =
                    groupedEvent.goalEvent || groupedEvent.standaloneEvent;
                  const playerId = targetEvent?.player_id;
                  const teamId = playerId
                    ? getPlayerTeamInMatch(
                        playerId,
                        match.id,
                        match,
                        lineupsByMatch,
                        teamPlayers,
                        orgPlayerIdToTeamId,
                      )
                    : null;
                  const side = teamId === match.away_team_id ? "away" : "home";

                  return (
                    <Box
                      key={groupedEvent.id}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr 76px 1fr",
                          sm: "1fr 92px 1fr",
                        },
                        alignItems: "center",
                        position: "relative",
                      }}
                    >
                      {/* Left side: Home card */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          pr: { xs: 1, sm: 2.5 },
                          visibility: side === "home" ? "visible" : "hidden",
                        }}
                      >
                        {side === "home" && (
                          <TimelineCard
                            groupedEvent={groupedEvent}
                            side="home"
                            isAdmin={isAdmin}
                            onEditClick={onEditClick}
                            onDeleteClick={onDeleteClick}
                            getPlayerName={getPlayerName}
                            teamColor={homeColor}
                          />
                        )}
                      </Box>

                      {/* Center spine: Time Pill */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 1,
                        }}
                      >
                        <Box
                          sx={{
                            px: { xs: 1, sm: "11px" },
                            py: "3px",
                            borderRadius: "20px",
                            bgcolor: "background.paper",
                            border: (theme) =>
                              `1.5px solid ${theme.palette.divider}`,
                            boxShadow: (theme) =>
                              theme.customShadows?.subtle || "none",
                            minWidth: { xs: 58, sm: 68 },
                            textAlign: "center",
                          }}
                        >
                          <Typography
                            sx={{
                              fontFamily: "Archivo, sans-serif",
                              fontWeight: 800,
                              display: "block",
                              fontSize: { xs: "10px", sm: "11px" },
                              lineHeight: 1.2,
                              color: "text.primary",
                            }}
                          >
                            {formatMs(groupedEvent.timeMs)}
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: "Archivo, sans-serif",
                              fontWeight: 600,
                              color: "text.secondary",
                              fontSize: { xs: "8.5px", sm: "9px" },
                              display: "block",
                              lineHeight: 1,
                              mt: "1px",
                            }}
                          >
                            {formatMs(groupedEvent.matchTimeMs)}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Right side: Away card */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-start",
                          pl: { xs: 1, sm: 2.5 },
                          visibility: side === "away" ? "visible" : "hidden",
                        }}
                      >
                        {side === "away" && (
                          <TimelineCard
                            groupedEvent={groupedEvent}
                            side="away"
                            isAdmin={isAdmin}
                            onEditClick={onEditClick}
                            onDeleteClick={onDeleteClick}
                            getPlayerName={getPlayerName}
                            teamColor={awayColor}
                          />
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
