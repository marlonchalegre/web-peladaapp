import {
  Box,
  Typography,
  IconButton,
  Stack,
  Paper,
  Tooltip,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import ReplayIcon from "@mui/icons-material/Replay";
import TimerIcon from "@mui/icons-material/Timer";
import { useTranslation } from "react-i18next";
import type { Pelada } from "../../../shared/api/endpoints";
import { usePeladaTimer } from "../hooks/usePeladaTimer";

interface GlobalSessionTimerProps {
  pelada: Pelada;
  isAdmin: boolean;
  onStartPelada: () => Promise<void>;
  onPausePelada: () => Promise<void>;
  onOpenResetConfirm: () => void;
}

export default function GlobalSessionTimer({
  pelada,
  isAdmin,
  onStartPelada,
  onPausePelada,
  onOpenResetConfirm,
}: GlobalSessionTimerProps) {
  const { t } = useTranslation();

  const isPeladaClosed = ["closed", "voting"].includes(
    (pelada?.status || "").toLowerCase(),
  );

  const sessionTimer = usePeladaTimer(
    pelada.timer_started_at,
    pelada.timer_accumulated_ms,
    pelada.timer_status,
    isPeladaClosed,
    onStartPelada,
    onPausePelada,
  );

  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: { xs: 1, sm: 2 },
        px: { xs: 1.5, sm: 2 },
        py: { xs: 0.5, sm: 1 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "action.hover",
      }}
    >
      <TimerIcon color="action" fontSize="small" />
      <Box>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            lineHeight: 1,
            fontWeight: "bold",
            color: "text.secondary",
            fontSize: { xs: "0.55rem", sm: "0.6rem" },
          }}
        >
          {t("peladas.timeline.session_timer")}
        </Typography>
        <Typography
          variant="h5"
          sx={{
            fontFamily: "monospace",
            fontWeight: "bold",
            lineHeight: 1.2,
            fontSize: { xs: "1.1rem", sm: "1.5rem" },
          }}
        >
          {sessionTimer.formattedTime}
        </Typography>
      </Box>

      {isAdmin && !isPeladaClosed && (
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            ml: { xs: 0.5, sm: 1 },
            borderLeft: "1px solid",
            borderColor: "divider",
            pl: { xs: 0.5, sm: 1 },
          }}
        >
          {sessionTimer.status === "running" ? (
            <Tooltip title={t("common.pause")}>
              <IconButton
                size="small"
                onClick={sessionTimer.pause}
                color="warning"
              >
                <PauseIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title={t("common.start")}>
              <IconButton
                size="small"
                onClick={sessionTimer.start}
                color="success"
              >
                <PlayArrowIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={t("common.reset")}>
            <IconButton size="small" onClick={onOpenResetConfirm}>
              <ReplayIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
            </IconButton>
          </Tooltip>
        </Stack>
      )}
    </Paper>
  );
}
