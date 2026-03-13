import {
  Box,
  Typography,
  Button,
  Stack,
  Divider,
  Paper,
  Dialog,
  DialogContent,
  IconButton,
  Chip,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import CloseIcon from "@mui/icons-material/Close";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useTranslation } from "react-i18next";
import type { Match, MatchEvent } from "../../../shared/api/endpoints";

interface MatchReportSummaryProps {
  open: boolean;
  onClose: () => void;
  match: Match;
  homeTeamName: string;
  awayTeamName: string;
  events: MatchEvent[];
  userIdToName: Record<number, string>;
  orgPlayerIdToUserId: Record<number, number>;
  orgPlayerIdToTeamId: Record<number, number>;
  teamNameById: Record<number, string>;
  nextMatch?: Match | null;
  onProceedToNext?: () => void;
}

import AssistWalkerIcon from "@mui/icons-material/DirectionsRun";
import GavelIcon from "@mui/icons-material/Gavel";

interface GroupedEvent {
  playerId: number;
  playerName: string;
  goals: number;
  assists: number;
  ownGoals: number;
}

export default function MatchReportSummary({
  open,
  onClose,
  match,
  homeTeamName,
  awayTeamName,
  events,
  userIdToName,
  orgPlayerIdToUserId,
  orgPlayerIdToTeamId,
  teamNameById,
  nextMatch,
  onProceedToNext,
}: MatchReportSummaryProps) {
  const { t } = useTranslation();

  const getPlayerName = (orgPlayerId: number) => {
    const userId = orgPlayerIdToUserId[orgPlayerId];
    return userIdToName[userId] || t("common.unknown_player");
  };

  const groupEventsByTeam = (teamId: number) => {
    const teamEvents = events.filter(
      (e) => orgPlayerIdToTeamId[e.player_id] === teamId,
    );
    const grouped: Record<number, GroupedEvent> = {};

    teamEvents.forEach((e) => {
      if (!grouped[e.player_id]) {
        grouped[e.player_id] = {
          playerId: e.player_id,
          playerName: getPlayerName(e.player_id),
          goals: 0,
          assists: 0,
          ownGoals: 0,
        };
      }
      if (e.event_type === "goal") grouped[e.player_id].goals += 1;
      if (e.event_type === "assist") grouped[e.player_id].assists += 1;
      if (e.event_type === "own_goal") grouped[e.player_id].ownGoals += 1;
    });

    return Object.values(grouped).sort((a, b) => b.goals - a.goals);
  };

  const homeHighlights = groupEventsByTeam(match.home_team_id);
  const awayHighlights = groupEventsByTeam(match.away_team_id);

  const nextHomeName = nextMatch
    ? teamNameById[nextMatch.home_team_id] ||
      t("peladas.matches.team_fallback", { id: nextMatch.home_team_id })
    : "";
  const nextAwayName = nextMatch
    ? teamNameById[nextMatch.away_team_id] ||
      t("peladas.matches.team_fallback", { id: nextMatch.away_team_id })
    : "";

  const isDraw = match.home_score === match.away_score;
  const homeWinner = (match.home_score ?? 0) > (match.away_score ?? 0);
  const awayWinner = (match.away_score ?? 0) > (match.home_score ?? 0);

  const renderHighlightItem = (h: GroupedEvent, align: "left" | "right") => {
    const icons = (
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ minHeight: 24 }}
      >
        {h.goals > 0 && (
          <Stack
            direction="row"
            alignItems="center"
            sx={{ color: "success.main" }}
          >
            <SportsSoccerIcon sx={{ fontSize: 18 }} />
            {h.goals > 1 && (
              <Typography
                variant="caption"
                sx={{ fontWeight: "bold", ml: 0.3, fontSize: "0.75rem" }}
              >
                x{h.goals}
              </Typography>
            )}
          </Stack>
        )}
        {h.assists > 0 && (
          <Stack
            direction="row"
            alignItems="center"
            sx={{ color: "info.main" }}
          >
            <AssistWalkerIcon sx={{ fontSize: 18 }} />
            {h.assists > 1 && (
              <Typography
                variant="caption"
                sx={{ fontWeight: "bold", ml: 0.3, fontSize: "0.75rem" }}
              >
                x{h.assists}
              </Typography>
            )}
          </Stack>
        )}
        {h.ownGoals > 0 && (
          <Stack
            direction="row"
            alignItems="center"
            sx={{ color: "error.main" }}
          >
            <GavelIcon sx={{ fontSize: 18 }} />
            {h.ownGoals > 1 && (
              <Typography
                variant="caption"
                sx={{ fontWeight: "bold", ml: 0.3, fontSize: "0.75rem" }}
              >
                x{h.ownGoals}
              </Typography>
            )}
          </Stack>
        )}
      </Stack>
    );

    return (
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        justifyContent={align === "left" ? "flex-start" : "flex-end"}
        key={h.playerId}
        sx={{ width: "100%" }}
      >
        {align === "right" && icons}
        <Typography
          variant="body2"
          sx={{
            fontWeight: h.goals > 0 ? "bold" : "normal",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {h.playerName}
        </Typography>
        {align === "left" && icons}
      </Stack>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 4, p: 1 },
      }}
    >
      <Box sx={{ position: "absolute", right: 8, top: 8 }}>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent>
        <Stack spacing={4} alignItems="center" sx={{ py: 2 }}>
          {/* Header */}
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: "bold", letterSpacing: 2 }}
            >
              {t("peladas.dashboard.summary.title", { seq: match.sequence })}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 1 }}>
              {t("peladas.dashboard.summary.match_finished")}
            </Typography>
          </Box>

          {/* Scoreboard */}
          <Paper
            elevation={0}
            variant="outlined"
            sx={{
              width: "100%",
              p: 3,
              borderRadius: 3,
              bgcolor: "action.hover",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
            }}
          >
            <Box sx={{ textAlign: "center", flex: 1 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", mb: 1 }}
              >
                {homeTeamName}
              </Typography>
              {homeWinner && <EmojiEventsIcon color="warning" />}
            </Box>

            <Box sx={{ textAlign: "center", px: 4 }}>
              <Typography variant="h2" sx={{ fontWeight: 900 }}>
                {match.home_score} - {match.away_score}
              </Typography>
              <Chip
                label={isDraw ? t("common.draw") : t("common.final_score")}
                size="small"
                variant="outlined"
                sx={{ mt: 1, fontWeight: "bold" }}
              />
            </Box>

            <Box sx={{ textAlign: "center", flex: 1 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", mb: 1 }}
              >
                {awayTeamName}
              </Typography>
              {awayWinner && <EmojiEventsIcon color="warning" />}
            </Box>
          </Paper>

          {/* Highlights */}
          <Box sx={{ width: "100%" }} data-testid="match-summary-highlights">
            <Typography
              variant="subtitle2"
              color="text.secondary"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
            >
              <SportsSoccerIcon fontSize="small" />
              {t("peladas.dashboard.summary.highlights")}
            </Typography>
            <Grid container spacing={2}>
              <Grid size={6}>
                <Stack spacing={1}>
                  {homeHighlights.map((h) => renderHighlightItem(h, "left"))}
                  {homeHighlights.length === 0 && (
                    <Typography variant="body2" color="text.disabled">
                      -
                    </Typography>
                  )}
                </Stack>
              </Grid>
              <Grid size={6}>
                <Stack spacing={1}>
                  {awayHighlights.map((h) => renderHighlightItem(h, "right"))}
                  {awayHighlights.length === 0 && (
                    <Typography
                      variant="body2"
                      color="text.disabled"
                      sx={{ textAlign: "right" }}
                    >
                      -
                    </Typography>
                  )}
                </Stack>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ width: "100%" }} />

          {/* Next Match Info */}
          {nextMatch && (
            <Box
              sx={{
                width: "100%",
                p: 2,
                borderRadius: 2,
                border: "1px dashed",
                borderColor: "divider",
                bgcolor: "action.hover",
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                gutterBottom
                sx={{ fontWeight: "bold", textTransform: "uppercase" }}
              >
                {t("peladas.dashboard.summary.next_up")}
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="center"
              >
                <Typography
                  variant="body1"
                  component="div"
                  data-testid="next-home-team"
                  sx={{
                    fontWeight: "bold",
                    color: "home.main",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "home.main",
                    }}
                  />
                  {nextHomeName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  vs
                </Typography>
                <Typography
                  variant="body1"
                  component="div"
                  data-testid="next-away-team"
                  sx={{
                    fontWeight: "bold",
                    color: "away.main",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  {nextAwayName}
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "away.main",
                    }}
                  />
                </Typography>
              </Stack>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                textAlign="center"
                sx={{ mt: 1 }}
              >
                {t("peladas.dashboard.summary.next_match_desc", {
                  seq: nextMatch.sequence,
                })}
              </Typography>
            </Box>
          )}

          {/* Actions */}
          <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
            <Button
              fullWidth
              variant="outlined"
              color="inherit"
              onClick={onClose}
              sx={{ borderRadius: 2, py: 1.5 }}
            >
              {t("common.close")}
            </Button>
            {onProceedToNext && nextMatch && (
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={onProceedToNext}
                endIcon={<ArrowForwardIcon />}
                sx={{ borderRadius: 2, py: 1.5, fontWeight: "bold" }}
              >
                {t("peladas.dashboard.summary.go_to_next")}
              </Button>
            )}
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
