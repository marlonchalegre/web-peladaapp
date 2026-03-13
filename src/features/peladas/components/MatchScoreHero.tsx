import {
  Box,
  Paper,
  Typography,
  IconButton,
  Stack,
  Button,
  Chip,
  useTheme,
  CircularProgress,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import ReplayIcon from "@mui/icons-material/Replay";
import FlagIcon from "@mui/icons-material/Flag";
import type { Match, Pelada } from "../../../shared/api/endpoints";
import { usePeladaTimer } from "../hooks/usePeladaTimer";
import { useTranslation } from "react-i18next";

interface MatchScoreHeroProps {
  match: Match;
  pelada: Pelada;
  homeTeamName: string;
  awayTeamName: string;
  isAdmin: boolean;
  onStartMatch: (id: number) => Promise<void>;
  onPauseMatch: (id: number) => Promise<void>;
  onOpenResetConfirm: (type: "session" | "match") => void;
  onEndMatch: () => void;
  updating: boolean;
}

export default function MatchScoreHero({
  match,
  homeTeamName,
  awayTeamName,
  isAdmin,
  onStartMatch,
  onPauseMatch,
  onOpenResetConfirm,
  onEndMatch,
  updating,
}: MatchScoreHeroProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const matchTimer = usePeladaTimer(
    match.timer_started_at,
    match.timer_accumulated_ms,
    match.timer_status,
    () => onStartMatch(match.id),
    () => onPauseMatch(match.id),
  );

  const finished = match.status === "finished";

  const scoreBoxStyle = (color: string) => ({
    width: { xs: 50, md: 60 },
    height: { xs: 60, md: 70 },
    bgcolor: "background.default",
    color: color,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 2,
    border: "2px solid",
    borderColor: color,
    boxShadow: 1,
  });

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 4,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        mb: 2,
      }}
    >
      <Stack spacing={2} alignItems="center">
        {/* Score Row */}
        <Stack
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={{ xs: 2, md: 4 }}
          sx={{ width: "100%" }}
        >
          {/* Home Team Name */}
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: "bold",
              color: "text.secondary",
              flex: 1,
              textAlign: "right",
              display: { xs: "none", sm: "block" },
            }}
          >
            {homeTeamName.toUpperCase()}
          </Typography>

          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={scoreBoxStyle(theme.palette.home.main)}>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {match.home_score ?? 0}
              </Typography>
            </Box>

            <Typography
              variant="h5"
              color="text.disabled"
              sx={{ fontWeight: "bold" }}
            >
              —
            </Typography>

            <Box sx={scoreBoxStyle(theme.palette.away.main)}>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {match.away_score ?? 0}
              </Typography>
            </Box>
          </Stack>

          {/* Away Team Name */}
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: "bold",
              color: "text.secondary",
              flex: 1,
              textAlign: "left",
              display: { xs: "none", sm: "block" },
            }}
          >
            {awayTeamName.toUpperCase()}
          </Typography>
        </Stack>

        {/* Mobile Team Names */}
        <Typography
          variant="caption"
          sx={{
            fontWeight: "bold",
            color: "text.secondary",
            display: { xs: "block", sm: "none" },
            textAlign: "center",
          }}
        >
          {homeTeamName.toUpperCase()} vs {awayTeamName.toUpperCase()}
        </Typography>

        {/* Controls Row */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={{ xs: 1.5, sm: 3 }}
          flexWrap="wrap"
          sx={{
            width: "100%",
            pt: 1,
            borderTop: "1px solid",
            borderColor: "divider",
            gap: 1,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontFamily: "monospace",
              fontWeight: "bold",
              color:
                matchTimer.status === "running"
                  ? "primary.main"
                  : "text.secondary",
              mr: { xs: 1, sm: 0 },
            }}
            data-testid="match-timer-text"
          >
            {matchTimer.formattedTime.substring(3)}
          </Typography>

          {isAdmin && !finished && (
            <Stack direction="row" spacing={1}>
              {matchTimer.status === "running" ? (
                <IconButton
                  onClick={matchTimer.pause}
                  size="small"
                  sx={{
                    bgcolor: "warning.main",
                    color: "white",
                    "&:hover": { bgcolor: "warning.dark" },
                    width: 32,
                    height: 32,
                  }}
                >
                  <PauseIcon fontSize="small" />
                </IconButton>
              ) : (
                <IconButton
                  onClick={matchTimer.start}
                  size="small"
                  sx={{
                    bgcolor: "success.main",
                    color: "white",
                    "&:hover": { bgcolor: "success.dark" },
                    width: 32,
                    height: 32,
                  }}
                >
                  <PlayArrowIcon fontSize="small" />
                </IconButton>
              )}
              <IconButton
                onClick={() => onOpenResetConfirm("match")}
                size="small"
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  width: 32,
                  height: 32,
                }}
              >
                <ReplayIcon fontSize="small" />
              </IconButton>
            </Stack>
          )}

          {finished ? (
            <Chip
              label={t("peladas.dashboard.status.finished")}
              color="default"
              variant="outlined"
              size="small"
              sx={{ fontWeight: "bold" }}
              data-testid="match-status-text"
            />
          ) : (
            isAdmin && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={
                  updating ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <FlagIcon />
                  )
                }
                onClick={onEndMatch}
                disabled={updating}
                data-testid="end-match-button"
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  ml: { xs: 0, sm: 2 },
                  minHeight: 32,
                  whiteSpace: "nowrap",
                  fontWeight: "bold",
                  px: 2,
                }}
              >
                {t("peladas.dashboard.button.end_match")}
              </Button>
            )
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}
