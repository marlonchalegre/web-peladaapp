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
        gap: { xs: 1, sm: 1.5 },
        px: "14px",
        py: "8px",
        borderRadius: "11px",
        border: (theme) => `1.5px solid ${theme.palette.divider}`,
        bgcolor: "background.paper",
        boxShadow: (theme) => theme.customShadows?.subtle || "none",
      }}
    >
      <TimerIcon
        sx={{
          color:
            sessionTimer.status === "running"
              ? "primary.main"
              : "text.secondary",
          fontSize: "18px",
        }}
      />
      <Box>
        <Typography
          sx={{
            display: "block",
            lineHeight: 1,
            fontFamily: "Archivo, sans-serif",
            fontWeight: 800,
            color: "text.secondary",
            fontSize: "8.5px",
            letterSpacing: ".12em",
            textTransform: "uppercase",
          }}
        >
          {t("peladas.timeline.session_timer", "TEMPO TOTAL DA SESSÃO")}
        </Typography>
        <Typography
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 800,
            lineHeight: 1.2,
            fontSize: { xs: "13px", sm: "15px" },
            color: "text.primary",
            letterSpacing: ".02em",
          }}
          data-testid="global-timer-text"
        >
          {sessionTimer.formattedTime}
        </Typography>
      </Box>

      {isAdmin && !isPeladaClosed && (
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            ml: 1,
            borderLeft: (theme) => `1.5px solid ${theme.palette.divider}`,
            pl: 1,
          }}
        >
          {sessionTimer.status === "running" ? (
            <Tooltip title={t("common.pause")}>
              <IconButton
                size="small"
                onClick={sessionTimer.pause}
                color="warning"
                data-testid="pause-global-timer-button"
                sx={{ p: 0.5 }}
              >
                <PauseIcon sx={{ fontSize: "16px" }} />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title={t("common.start")}>
              <IconButton
                size="small"
                onClick={sessionTimer.start}
                color="success"
                data-testid="start-global-timer-button"
                sx={{ p: 0.5 }}
              >
                <PlayArrowIcon sx={{ fontSize: "16px" }} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={t("common.reset")}>
            <IconButton
              size="small"
              onClick={onOpenResetConfirm}
              data-testid="reset-global-timer-button"
              sx={{ p: 0.5, color: "text.secondary" }}
            >
              <ReplayIcon sx={{ fontSize: "16px" }} />
            </IconButton>
          </Tooltip>
        </Stack>
      )}
    </Paper>
  );
}
