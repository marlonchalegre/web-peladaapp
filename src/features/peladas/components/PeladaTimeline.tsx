import { Box, Typography } from "@mui/material";
import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";
import TimelineOppositeContent from "@mui/lab/TimelineOppositeContent";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import StarsIcon from "@mui/icons-material/Stars";
import { useTranslation } from "react-i18next";
import type { MatchEvent, Match } from "../../../shared/api/endpoints";

interface PeladaTimelineProps {
  events: MatchEvent[];
  matches: Match[];
  userIdToName: Record<number, string>;
  orgPlayerIdToUserId: Record<number, number>;
  teamNameById: Record<number, string>;
}

export default function PeladaTimeline({
  events,
  matches,
  userIdToName,
  orgPlayerIdToUserId,
}: PeladaTimelineProps) {
  const { t } = useTranslation();

  const formatMs = (ms?: number | null) => {
    if (ms === undefined || ms === null) return "--:--";
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    const pad = (n: number) => n.toString().padStart(2, "0");
    if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  const getPlayerName = (playerId: number) => {
    const userId = orgPlayerIdToUserId[playerId];
    return userIdToName[userId] || `Player ${playerId}`;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "goal":
        return <SportsSoccerIcon fontSize="small" />;
      case "own_goal":
        return <ErrorOutlineIcon fontSize="small" color="error" />;
      case "assist":
        return <StarsIcon fontSize="small" color="info" />;
      default:
        return <SportsSoccerIcon fontSize="small" />;
    }
  };

  const sortedEvents = [...events].sort((a, b) => {
    if (a.session_time_ms && b.session_time_ms) {
      return a.session_time_ms - b.session_time_ms;
    }
    return (a.id || 0) - (b.id || 0);
  });

  if (events.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="text.secondary">
          {t("peladas.timeline.no_events")}
        </Typography>
      </Box>
    );
  }

  return (
    <Timeline position="right" sx={{ p: 0 }}>
      {sortedEvents.map((event, index) => {
        const match = matches.find((m) => m.id === event.match_id);
        const isGoal =
          event.event_type === "goal" || event.event_type === "own_goal";

        return (
          <TimelineItem key={event.id || index}>
            <TimelineOppositeContent
              sx={{
                m: "auto 0",
                flex: 0.2,
                minWidth: 80,
                textAlign: "right",
                px: 1,
              }}
              align="right"
              variant="body2"
              color="text.secondary"
            >
              <Typography
                variant="caption"
                sx={{ fontWeight: "bold", display: "block" }}
              >
                {formatMs(event.session_time_ms)}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                {t("peladas.timeline.match_short")}{" "}
                {formatMs(event.match_time_ms)}
              </Typography>
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot
                color={event.event_type === "own_goal" ? "error" : "primary"}
                variant={isGoal ? "filled" : "outlined"}
              >
                {getEventIcon(event.event_type)}
              </TimelineDot>
              {index < sortedEvents.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent sx={{ py: "12px", px: 2 }}>
              <Typography
                variant="body1"
                component="span"
                sx={{ fontWeight: isGoal ? "bold" : "normal" }}
              >
                {event.event_type === "own_goal"
                  ? t("common.own_goal")
                  : t(`common.${event.event_type}`)}
                : {getPlayerName(event.player_id)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("peladas.dashboard.summary.title", { seq: match?.sequence })}
              </Typography>
            </TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );
}
