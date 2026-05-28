import {
  Box,
  Typography,
  Stack,
  Paper,
  IconButton,
  useTheme,
} from "@mui/material";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import ErrorOutlinedIcon from "@mui/icons-material/ErrorOutlined";
import StarsIcon from "@mui/icons-material/Stars";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTranslation } from "react-i18next";
import type { MatchEvent, Match } from "../../../shared/api/endpoints";

interface GroupedEvent {
  id: string;
  timeMs: number;
  matchTimeMs: number;
  type: "goal" | "own_goal" | "assist";
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

  const isOwnGoal = groupedEvent.type === "own_goal";
  const isAssist = groupedEvent.type === "assist";

  const scorerId =
    groupedEvent.goalEvent?.player_id ||
    groupedEvent.standaloneEvent?.player_id;
  const scorerName = getPlayerName(scorerId || "");
  const assistantId = groupedEvent.assistEvent?.player_id;
  const assistantName = assistantId ? getPlayerName(assistantId) : null;

  const targetEvent = groupedEvent.goalEvent || groupedEvent.standaloneEvent;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        position: "relative",
        minWidth: { xs: 150, sm: 220 },
        maxWidth: 280,
        bgcolor: "background.paper",
        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
        display: "flex",
        flexDirection: "column",
        gap: 0.5,

        // Highlight accent border on the spine edge
        borderRight: side === "home" ? `4px solid ${teamColor}` : undefined,
        borderLeft: side === "away" ? `4px solid ${teamColor}` : undefined,
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
          spacing={1}
          sx={{
            alignItems: "center",
            minWidth: 0,
            flexGrow: 1,
          }}
        >
          {isOwnGoal ? (
            <ErrorOutlinedIcon fontSize="small" color="error" />
          ) : isAssist ? (
            <StarsIcon fontSize="small" color="info" />
          ) : (
            <SportsSoccerIcon fontSize="small" color="success" />
          )}

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: "bold",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: { xs: "0.75rem", sm: "0.85rem" },
              }}
            >
              {isOwnGoal
                ? t("common.own_goal")
                : isAssist
                  ? t("common.assist")
                  : t("common.goal")}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "block",
                fontSize: { xs: "0.7rem", sm: "0.75rem" },
              }}
            >
              {scorerName}
            </Typography>
          </Box>
        </Stack>

        {/* Admin actions */}
        {isAdmin && targetEvent && (
          <Stack direction="row" spacing={0.5} sx={{ ml: 1, flexShrink: 0 }}>
            <IconButton
              size="small"
              onClick={() => onEditClick?.(targetEvent)}
              sx={{ p: 0.25 }}
              data-testid={`edit-event-${targetEvent.id}`}
            >
              <EditIcon fontSize="inherit" sx={{ fontSize: "1.1rem" }} />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => onDeleteClick?.(targetEvent)}
              sx={{ p: 0.25 }}
              data-testid={`delete-event-${targetEvent.id}`}
            >
              <DeleteIcon fontSize="inherit" sx={{ fontSize: "1.1rem" }} />
            </IconButton>
          </Stack>
        )}
      </Stack>

      {/* Nested assistant info */}
      {assistantName && (
        <Box
          sx={{
            mt: 1,
            pt: 0.75,
            borderTop: "1px dashed",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          <StarsIcon
            fontSize="inherit"
            sx={{ fontSize: "0.9rem", color: "info.main" }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontWeight: "medium",
              fontSize: { xs: "0.65rem", sm: "0.75rem" },
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
  isAdmin,
  onEditClick,
  onDeleteClick,
}: PeladaTimelineProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const homeColor = theme.palette.home?.main || "#2563eb";
  const awayColor = theme.palette.away?.main || "#f97316";

  const formatMs = (ms?: number | null) => {
    if (ms === undefined || ms === null) return "--:--";
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    const pad = (n: number) => n.toString().padStart(2, "0");
    if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  const getPlayerName = (playerId: string) => {
    const userId = orgPlayerIdToUserId[playerId];
    return userIdToName[userId] || `Player ${playerId}`;
  };

  if (events.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography sx={{ color: "text.secondary" }}>
          {t("peladas.timeline.no_events")}
        </Typography>
      </Box>
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
        {sortedEvents.map((event, index) => {
          const isGoal =
            event.event_type === "goal" || event.event_type === "own_goal";
          return (
            <Paper
              key={event.id || index}
              variant="outlined"
              sx={{ p: 1.5, borderRadius: 2 }}
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: isGoal ? "bold" : "normal" }}
              >
                {event.event_type === "own_goal"
                  ? t("common.own_goal")
                  : t(`common.${event.event_type}`)}
                : {getPlayerName(event.player_id)}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.5 }}
              >
                {formatMs(event.session_time_ms)}
              </Typography>
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{ display: "block" }}
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
    <Box sx={{ py: 2 }} className="MuiTimeline-root">
      {sortedMatches.map((match, matchIdx) => {
        // Filter events for this match
        const matchEvents = events.filter((e) => e.match_id === match.id);
        if (matchEvents.length === 0) {
          return null; // skip match if no events
        }

        // Separate goals and assists
        const goals = matchEvents.filter(
          (e) => e.event_type === "goal" || e.event_type === "own_goal",
        );
        const assists = matchEvents.filter((e) => e.event_type === "assist");

        const grouped: {
          id: string;
          timeMs: number;
          matchTimeMs: number;
          type: "goal" | "own_goal" | "assist";
          goalEvent?: MatchEvent;
          assistEvent?: MatchEvent;
          standaloneEvent?: MatchEvent;
        }[] = [];

        const pairedAssistIds = new Set<string>();

        // Match goal and assist pairs
        goals.forEach((goal) => {
          const matchingAssist = assists.find(
            (a) =>
              !pairedAssistIds.has(a.id!) &&
              a.session_time_ms === goal.session_time_ms &&
              a.match_time_ms === goal.match_time_ms,
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

        // Sort match timeline events chronologically
        grouped.sort((a, b) => a.timeMs - b.timeMs);

        const homeName = teamNameById[match.home_team_id] || "Home";
        const awayName = teamNameById[match.away_team_id] || "Away";

        return (
          <Box key={match.id} sx={{ mb: 6, mt: matchIdx > 0 ? 6 : 2 }}>
            <Paper
              elevation={0}
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: "center",
                justifyContent: "space-between",
                mb: 4,
                bgcolor: "action.hover",
                py: { xs: 1.5, md: 2 },
                px: 3,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                gap: { xs: 2, md: 0 },
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              {/* Left Side: Circular Sequence Badge + Uppercase Label */}
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
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    bgcolor: "background.paper",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: "bold",
                      color: "text.primary",
                      fontSize: "0.8rem",
                    }}
                  >
                    {match.sequence}
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: "bold",
                    color: "text.secondary",
                    fontSize: "0.75rem",
                    letterSpacing: "0.05em",
                  }}
                >
                  {t(
                    "peladas.matches.match_uppercase",
                    "PARTIDA",
                  ).toUpperCase()}
                </Typography>
              </Stack>

              {/* Center: Teams Name & Large Score */}
              <Stack
                direction="row"
                spacing={{ xs: 1, sm: 2 }}
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
                      width: { xs: 10, md: 12 },
                      height: { xs: 10, md: 12 },
                      borderRadius: "3px",
                      bgcolor: homeColor,
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: "bold",
                      fontSize: { xs: "0.75rem", md: "0.85rem" },
                      color: "text.primary",
                      textTransform: "uppercase",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: { xs: 80, sm: 120, md: 180 },
                    }}
                  >
                    {homeName}
                  </Typography>
                </Stack>

                {/* Score */}
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    mx: { xs: 1, md: 2 },
                    fontSize: { xs: "1.15rem", md: "1.35rem" },
                    flexShrink: 0,
                  }}
                >
                  <span style={{ color: homeColor }}>
                    {match.home_score ?? 0}
                  </span>
                  <Typography
                    component="span"
                    sx={{
                      color: "text.disabled",
                      mx: { xs: 0.75, md: 1.5 },
                      fontWeight: "normal",
                      fontSize: { xs: "0.9rem", md: "1.1rem" },
                    }}
                  >
                    ×
                  </Typography>
                  <span style={{ color: awayColor }}>
                    {match.away_score ?? 0}
                  </span>
                </Typography>

                {/* Away Team */}
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center", minWidth: 0 }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: "bold",
                      fontSize: { xs: "0.75rem", md: "0.85rem" },
                      color: "text.primary",
                      textTransform: "uppercase",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: { xs: 80, sm: 120, md: 180 },
                    }}
                  >
                    {awayName}
                  </Typography>
                  <Box
                    sx={{
                      width: { xs: 10, md: 12 },
                      height: { xs: 10, md: 12 },
                      borderRadius: "3px",
                      bgcolor: awayColor,
                      flexShrink: 0,
                    }}
                  />
                </Stack>
              </Stack>

              {/* Right Side: Duration Label & Time */}
              <Stack
                direction={{ xs: "row", md: "column" }}
                spacing={{ xs: 1, md: 0.5 }}
                sx={{
                  alignItems: { xs: "center", md: "flex-end" },
                  justifyContent: { xs: "center", md: "flex-end" },
                  textAlign: { xs: "center", md: "right" },
                  width: { xs: "100%", md: "auto" },
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.55rem",
                    fontWeight: "bold",
                    color: "text.secondary",
                    letterSpacing: "0.1em",
                  }}
                >
                  {t("peladas.matches.duration", "DURATION").toUpperCase()}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: "bold",
                    color: "text.primary",
                    fontSize: "0.95rem",
                    lineHeight: 1.2,
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
              <Stack spacing={4}>
                {grouped.map((groupedEvent) => {
                  // Determine side: scorer's team compared to match home/away team
                  const targetEvent =
                    groupedEvent.goalEvent || groupedEvent.standaloneEvent;
                  const playerId = targetEvent?.player_id;
                  const teamId =
                    playerId && orgPlayerIdToTeamId
                      ? orgPlayerIdToTeamId[playerId]
                      : null;
                  const side = teamId === match.away_team_id ? "away" : "home";

                  return (
                    <Box
                      key={groupedEvent.id}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 96px 1fr",
                        alignItems: "center",
                        position: "relative",
                      }}
                    >
                      {/* Left side: Home card */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          pr: { xs: 1.5, sm: 3 },
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
                        <Paper
                          variant="outlined"
                          sx={{
                            px: { xs: 1, sm: 1.5 },
                            py: 0.5,
                            borderRadius: 10,
                            bgcolor: "background.paper",
                            borderColor: "divider",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                            minWidth: 72,
                            textAlign: "center",
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: "bold",
                              display: "block",
                              fontSize: { xs: "0.65rem", sm: "0.75rem" },
                            }}
                          >
                            {formatMs(groupedEvent.timeMs)}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.disabled",
                              fontSize: "0.6rem",
                              display: "block",
                            }}
                          >
                            {formatMs(groupedEvent.matchTimeMs)}
                          </Typography>
                        </Paper>
                      </Box>

                      {/* Right side: Away card */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-start",
                          pl: { xs: 1.5, sm: 3 },
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
