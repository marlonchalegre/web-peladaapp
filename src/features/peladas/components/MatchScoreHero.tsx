import { useState, useMemo } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ReplayIcon from "@mui/icons-material/Replay";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import HistoryIcon from "@mui/icons-material/History";
import type { Match, Pelada } from "../../../shared/api/endpoints";
import type { StandingRow } from "../utils/standingsUtils";
import { useTranslation } from "react-i18next";

interface MatchScoreHeroProps {
  match: Match;
  pelada: Pelada;
  homeTeamName: string;
  awayTeamName: string;
  isAdmin: boolean;
  totalMatches: number;
  standings: StandingRow[];
  clockLabel: string;
  running: boolean;
  sessionLabel: string;
  homeOnFieldCount?: number;
  awayOnFieldCount?: number;
  onToggleHistory: () => void;
  onToggleRun: () => void;
  onOpenResetConfirm: (type: "session" | "match") => void;
  onEndMatch: () => void;
  updating: boolean;
  finished?: boolean;
  isEditing?: boolean;
  onToggleEdit?: () => void;
}

const ordinal = (position: number) => `${position}º`;

export default function MatchScoreHero({
  match,
  pelada,
  homeTeamName,
  awayTeamName,
  isAdmin,
  totalMatches,
  standings,
  clockLabel,
  running,
  sessionLabel,
  onToggleHistory,
  onToggleRun,
  onOpenResetConfirm,
  onEndMatch,
  updating,
  finished: finishedProp,
  isEditing,
  onToggleEdit,
}: MatchScoreHeroProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const isMatchFinished =
    finishedProp !== undefined
      ? finishedProp
      : (match.status || "").toLowerCase() === "finished";
  const finished = isEditing ? false : isMatchFinished;

  // Dynamic standings positions for the two teams based on current tournament table
  const livePositions = useMemo(() => {
    const homeIndex = standings.findIndex(
      (r) => r.teamId === match.home_team_id,
    );
    const awayIndex = standings.findIndex(
      (r) => r.teamId === match.away_team_id,
    );

    return {
      home: homeIndex >= 0 ? homeIndex + 1 : 1,
      away: awayIndex >= 0 ? awayIndex + 1 : 2,
    };
  }, [standings, match.home_team_id, match.away_team_id]);

  const homePosition = livePositions.home;
  const awayPosition = livePositions.away;

  const runState = finished
    ? t("peladas.dashboard.status.finished")
    : running
      ? t("peladas.dashboard.live_state.running")
      : t("peladas.dashboard.live_state.paused");

  const matchLabel = t("peladas.matches.match_x_of_y", {
    n: match.sequence,
    m: totalMatches,
  });

  const optionsMenu = (
    <Menu
      anchorEl={menuAnchor}
      open={Boolean(menuAnchor)}
      onClose={() => setMenuAnchor(null)}
    >
      {isAdmin && !finished && (
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            onOpenResetConfirm("match");
          }}
          data-testid="reset-match-timer-button"
        >
          <ReplayIcon fontSize="small" sx={{ mr: 1 }} />
          {t("peladas.dashboard.live_state.reset_match_timer")}
        </MenuItem>
      )}
      <MenuItem
        onClick={() => {
          setMenuAnchor(null);
          onOpenResetConfirm("session");
        }}
        data-testid="reset-session-timer-button"
      >
        <ReplayIcon fontSize="small" sx={{ mr: 1 }} />
        {t("peladas.dashboard.live_state.reset_session_timer")}
      </MenuItem>
    </Menu>
  );

  if (isDesktop) {
    return (
      <Box
        sx={{
          bgcolor: "background.paper",
          border: "1.5px solid",
          borderColor: "divider",
          borderRadius: "18px",
          px: "22px",
          py: "18px",
          boxShadow: (theme) => `0 3px 0 ${theme.palette.divider}`,
        }}
        data-testid="match-score-hero"
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: "18px",
          }}
        >
          {/* Time 1 - Right aligned */}
          <Box sx={{ textAlign: "right", minWidth: 0 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "7px",
              }}
            >
              {homePosition && (
                <Box
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 700,
                    fontSize: "9.5px",
                    lineHeight: 1,
                    letterSpacing: "0.06em",
                    color: "home.subtleText",
                    bgcolor: "home.subtleBg",
                    borderRadius: "5px",
                    px: "5px",
                    py: "3px",
                  }}
                >
                  {ordinal(homePosition)}
                </Box>
              )}
              <Typography
                noWrap
                data-testid="hero-home-name"
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 900,
                  fontSize: "17px",
                  lineHeight: 1.1,
                  letterSpacing: "0.04em",
                  color: "home.main",
                }}
              >
                {homeTeamName.toUpperCase()}
              </Typography>
            </Box>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "10px",
                lineHeight: 1,
                letterSpacing: "0.12em",
                color: "text.secondary",
                mt: "6px",
              }}
            >
              LARANJA
            </Typography>
          </Box>

          {/* Center Scores & Timer */}
          <Stack
            direction="row"
            spacing="16px"
            sx={{ alignItems: "center" }}
            data-testid="match-score-display"
          >
            <Typography
              sx={{
                fontFamily: "'Anton', sans-serif",
                fontSize: "60px",
                lineHeight: 1,
                color: "home.main",
                minWidth: 52,
                textAlign: "center",
              }}
            >
              {match.home_score ?? 0}
            </Typography>

            <Box sx={{ textAlign: "center" }}>
              <Typography
                data-testid="match-timer-text"
                sx={{
                  fontFamily: "ui-monospace, Menlo, monospace",
                  fontWeight: 700,
                  fontSize: "21px",
                  lineHeight: 1,
                  color: "text.primary",
                }}
              >
                {clockLabel}
              </Typography>
              <Typography
                data-testid={finished ? "match-status-text" : undefined}
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: "9px",
                  lineHeight: 1,
                  letterSpacing: "0.14em",
                  color: "text.secondary",
                  mt: "6px",
                  textTransform: "uppercase",
                }}
              >
                {runState}
              </Typography>
            </Box>

            <Typography
              sx={{
                fontFamily: "'Anton', sans-serif",
                fontSize: "60px",
                lineHeight: 1,
                color: "away.main",
                minWidth: 52,
                textAlign: "center",
              }}
            >
              {match.away_score ?? 0}
            </Typography>
          </Stack>

          {/* Time 2 - Left aligned */}
          <Box sx={{ textAlign: "left", minWidth: 0 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
              }}
            >
              <Typography
                noWrap
                data-testid="hero-away-name"
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 900,
                  fontSize: "17px",
                  lineHeight: 1.1,
                  letterSpacing: "0.04em",
                  color: "away.main",
                }}
              >
                {awayTeamName.toUpperCase()}
              </Typography>
              {awayPosition && (
                <Box
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 700,
                    fontSize: "9.5px",
                    lineHeight: 1,
                    letterSpacing: "0.06em",
                    color: "away.subtleText",
                    bgcolor: "away.subtleBg",
                    borderRadius: "5px",
                    px: "5px",
                    py: "3px",
                  }}
                >
                  {ordinal(awayPosition)}
                </Box>
              )}
            </Box>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "10px",
                lineHeight: 1,
                letterSpacing: "0.12em",
                color: "text.secondary",
                mt: "6px",
              }}
            >
              AZUL
            </Typography>
          </Box>
        </Box>

        {/* Action buttons inside card */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            mt: "16px",
            pt: "15px",
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          {isAdmin && !finished && (
            <Button
              onClick={onToggleRun}
              data-testid={
                running
                  ? "pause-match-timer-button"
                  : "start-match-timer-button"
              }
              sx={{
                border: 0,
                borderRadius: "11px",
                bgcolor: "primary.main",
                color: "primary.contrastText",
                px: "20px",
                py: "12px",
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "12px",
                lineHeight: 1,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                "&:hover": {
                  bgcolor: "primary.dark",
                },
              }}
            >
              {running
                ? t("peladas.dashboard.live_state.pause", "PAUSAR")
                : t("peladas.dashboard.live_state.resume", "RETOMAR")}
            </Button>
          )}

          {isAdmin && !finished && (
            <Button
              onClick={() => onOpenResetConfirm("match")}
              data-testid="reset-match-timer-button"
              sx={{
                border: "1.5px solid",
                borderColor: "divider",
                borderRadius: "11px",
                bgcolor: "action.hover",
                color: "text.secondary",
                px: "16px",
                py: "11px",
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "12px",
                lineHeight: 1,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                "&:hover": {
                  borderColor: "text.primary",
                  color: "text.primary",
                },
              }}
            >
              {t("peladas.dashboard.live_state.reset", "ZERAR")}
            </Button>
          )}

          <Box sx={{ flex: 1 }} />

          {isMatchFinished ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Chip
                label={t("peladas.dashboard.status.finished")}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 800 }}
                data-testid="match-status-text"
              />
              {isAdmin && onToggleEdit && (
                <Button
                  onClick={onToggleEdit}
                  data-testid={
                    isEditing ? "finish-editing-button" : "edit-match-button"
                  }
                  size="small"
                  variant={isEditing ? "contained" : "outlined"}
                  color={isEditing ? "success" : "warning"}
                  sx={{
                    borderRadius: "10px",
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 800,
                    fontSize: "11px",
                    textTransform: "none",
                  }}
                >
                  {isEditing
                    ? t("peladas.dashboard.button.finish_editing")
                    : t("peladas.dashboard.button.edit_match")}
                </Button>
              )}
            </Box>
          ) : (
            isAdmin && (
              <Button
                onClick={onEndMatch}
                data-testid="end-match-button"
                disabled={updating}
                startIcon={
                  updating ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : undefined
                }
                sx={{
                  border: (theme) =>
                    `1.5px solid ${theme.palette.secondary.light}`,
                  borderRadius: "11px",
                  bgcolor: "background.paper",
                  color: "secondary.main",
                  px: "18px",
                  py: "11px",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: "12px",
                  lineHeight: 1,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  "&:hover": {
                    borderColor: "secondary.main",
                    bgcolor: "secondary.light",
                  },
                }}
              >
                {t(
                  "peladas.dashboard.live_state.end_match_full",
                  "ENCERRAR PARTIDA",
                )}
              </Button>
            )
          )}
        </Box>
      </Box>
    );
  }

  // Mobile layout (reference 1a)
  return (
    <Box
      sx={{
        flexShrink: 0,
        bgcolor: "pitch.main",
        color: "pitch.contrastText",
        p: "14px 16px 12px",
      }}
      data-testid="match-score-hero"
    >
      {/* Top row */}
      <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <IconButton
          onClick={onToggleHistory}
          data-testid="toggle-history-drawer"
          aria-label={t("peladas.dashboard.button.history")}
          sx={{
            border: 0,
            bgcolor: "rgba(255,255,255,0.12)",
            color: "pitch.contrastText",
            width: 34,
            height: 34,
            borderRadius: "10px",
            p: 0,
            "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
          }}
        >
          <HistoryIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            noWrap
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "10px",
              lineHeight: 1,
              letterSpacing: "0.16em",
              color: "pitch.light",
            }}
          >
            {(pelada.organization_name || "100FÔLEGO").toUpperCase()} ·{" "}
            {sessionLabel.toUpperCase()}
          </Typography>
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "14px",
              lineHeight: 1.3,
              letterSpacing: "0.02em",
              color: "pitch.contrastText",
              mt: "4px",
            }}
          >
            {matchLabel.toUpperCase()}
          </Typography>
        </Box>
        <IconButton
          onClick={(e) => setMenuAnchor(e.currentTarget)}
          aria-label={t("peladas.dashboard.live_state.options")}
          data-testid="hero-options-button"
          sx={{
            border: 0,
            bgcolor: "rgba(255,255,255,0.12)",
            color: "pitch.contrastText",
            width: 34,
            height: 34,
            borderRadius: "10px",
            p: 0,
            "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
          }}
        >
          <MoreHorizIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
      {optionsMenu}

      {/* Score Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: "10px",
          mt: "18px",
        }}
      >
        {/* Time 1 */}
        <Box sx={{ textAlign: "right" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "7px",
            }}
          >
            {homePosition && (
              <Box
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "9.5px",
                  lineHeight: 1,
                  letterSpacing: "0.06em",
                  color: "pitch.main",
                  bgcolor: "home.light",
                  borderRadius: "5px",
                  px: "5px",
                  py: "3px",
                }}
              >
                {ordinal(homePosition)}
              </Box>
            )}
            <Typography
              noWrap
              data-testid="hero-home-name"
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 900,
                fontSize: "15px",
                lineHeight: 1.2,
                letterSpacing: "0.04em",
                color: "pitch.contrastText",
              }}
            >
              {homeTeamName.toUpperCase()}
            </Typography>
          </Box>
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: "10px",
              lineHeight: 1,
              letterSpacing: "0.1em",
              color: "home.light",
              mt: "6px",
            }}
          >
            LARANJA
          </Typography>
        </Box>

        {/* Center Scores */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
          data-testid="match-score-display"
        >
          <Typography
            sx={{
              fontFamily: "'Anton', sans-serif",
              fontSize: "54px",
              lineHeight: 1,
              color: "home.main",
              minWidth: 44,
              textAlign: "center",
            }}
          >
            {match.home_score ?? 0}
          </Typography>
          <Typography
            sx={{
              fontFamily: "'Anton', sans-serif",
              fontSize: "24px",
              lineHeight: 1,
              color: "pitch.light",
            }}
          >
            –
          </Typography>
          <Typography
            sx={{
              fontFamily: "'Anton', sans-serif",
              fontSize: "54px",
              lineHeight: 1,
              color: "away.main",
              minWidth: 44,
              textAlign: "center",
            }}
          >
            {match.away_score ?? 0}
          </Typography>
        </Box>

        {/* Time 2 */}
        <Box sx={{ textAlign: "left" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
            }}
          >
            <Typography
              noWrap
              data-testid="hero-away-name"
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 900,
                fontSize: "15px",
                lineHeight: 1.2,
                letterSpacing: "0.04em",
                color: "pitch.contrastText",
              }}
            >
              {awayTeamName.toUpperCase()}
            </Typography>
            {awayPosition && (
              <Box
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "9.5px",
                  lineHeight: 1,
                  letterSpacing: "0.06em",
                  color: "pitch.main",
                  bgcolor: "away.light",
                  borderRadius: "5px",
                  px: "5px",
                  py: "3px",
                }}
              >
                {ordinal(awayPosition)}
              </Box>
            )}
          </Box>
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: "10px",
              lineHeight: 1,
              letterSpacing: "0.1em",
              color: "away.light",
              mt: "6px",
            }}
          >
            AZUL
          </Typography>
        </Box>
      </Box>

      {/* Clock & Controls row */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          mt: "16px",
          mx: 0,
          pt: "13px",
          borderTop: "1px solid rgba(255,255,255,0.14)",
          flexWrap: "wrap",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "baseline",
            gap: "8px",
            minWidth: 0,
          }}
        >
          <Typography
            data-testid="match-timer-text"
            sx={{
              fontFamily: "ui-monospace, Menlo, monospace",
              fontWeight: 700,
              fontSize: { xs: "20px", sm: "22px" },
              lineHeight: 1,
              letterSpacing: "0.04em",
              color: "pitch.contrastText",
            }}
          >
            {clockLabel}
          </Typography>
          <Typography
            data-testid={isMatchFinished ? "match-status-text" : undefined}
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "9.5px",
              lineHeight: 1,
              letterSpacing: "0.12em",
              color: "pitch.light",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            {runState}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          {isAdmin && !finished && (
            <Button
              onClick={onToggleRun}
              data-testid={
                running
                  ? "pause-match-timer-button"
                  : "start-match-timer-button"
              }
              sx={{
                border: 0,
                borderRadius: "11px",
                bgcolor: "background.paper",
                color: "pitch.main",
                px: { xs: "12px", sm: "16px" },
                py: "8px",
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: { xs: "11px", sm: "12px" },
                lineHeight: 1,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
            >
              {running
                ? t("peladas.dashboard.live_state.pause", "PAUSAR")
                : t("peladas.dashboard.live_state.resume", "RETOMAR")}
            </Button>
          )}
          {isAdmin && !finished && (
            <Button
              onClick={onEndMatch}
              data-testid="end-match-button"
              disabled={updating}
              startIcon={
                updating ? (
                  <CircularProgress size={12} color="inherit" />
                ) : undefined
              }
              sx={{
                border: (theme) =>
                  `1.5px solid ${theme.palette.secondary.main}`,
                borderRadius: "11px",
                bgcolor: "background.paper",
                color: "secondary.main",
                px: { xs: "11px", sm: "14px" },
                py: "8px",
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: { xs: "11px", sm: "12px" },
                lineHeight: 1,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                "&:hover": {
                  borderColor: "secondary.dark",
                  bgcolor: "secondary.light",
                },
              }}
            >
              {t("peladas.dashboard.live_state.end_match", "ENCERRAR")}
              <Box
                component="span"
                sx={{ display: { xs: "none", sm: "inline" }, ml: 0.5 }}
              >
                {t("peladas.dashboard.live_state.match_word", "PARTIDA")}
              </Box>
            </Button>
          )}
          {isMatchFinished && isAdmin && onToggleEdit && (
            <Button
              onClick={onToggleEdit}
              data-testid={
                isEditing ? "finish-editing-button" : "edit-match-button"
              }
              sx={{
                border: 0,
                borderRadius: "11px",
                bgcolor: isEditing ? "primary.main" : "rgba(255,255,255,0.15)",
                color: "pitch.contrastText",
                px: "14px",
                py: "8px",
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "11px",
                lineHeight: 1,
                letterSpacing: "0.04em",
                textTransform: "none",
                "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
              }}
            >
              {isEditing
                ? t("peladas.dashboard.button.finish_editing")
                : t("peladas.dashboard.button.edit_match")}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
