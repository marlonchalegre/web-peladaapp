import { useState, useMemo } from "react";
import { alpha } from "@mui/material/styles";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ReplayIcon from "@mui/icons-material/Replay";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import HistoryIcon from "@mui/icons-material/History";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
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
  onToggleHistory: () => void;
  onToggleRun: () => void;
  onOpenResetConfirm: (type: "session" | "match") => void;
  onEndMatch: () => void;
  updating: boolean;
  finished?: boolean;
  isEditing?: boolean;
  onToggleEdit?: () => void;
  isMirrored?: boolean;
  onToggleMirror?: () => void;
}

const ordinal = (position: number) => `${position}º`;

const mobileHeaderIconBtnSx = {
  border: 0,
  bgcolor: "rgba(255,255,255,0.12)",
  color: "pitch.contrastText",
  width: 34,
  height: 34,
  borderRadius: "10px",
  p: 0,
  "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
} as const;

function HeroTeamSide({
  side,
  teamName,
  position,
  subtitle,
  isDesktop,
  align = "left",
}: {
  side: "home" | "away";
  teamName: string;
  position: number;
  subtitle: string;
  isDesktop: boolean;
  align?: "left" | "right";
}) {
  const isRightAligned = align === "right";
  const badge = (
    <Box
      sx={{
        fontFamily: "Archivo, sans-serif",
        fontWeight: 700,
        fontSize: "9.5px",
        lineHeight: 1,
        letterSpacing: "0.06em",
        color: isDesktop ? `${side}.subtleText` : "pitch.main",
        bgcolor: isDesktop ? `${side}.subtleBg` : `${side}.light`,
        borderRadius: "5px",
        px: "5px",
        py: "3px",
      }}
    >
      {ordinal(position)}
    </Box>
  );

  return (
    <Box
      sx={{
        textAlign: isRightAligned ? "right" : "left",
        minWidth: isDesktop ? 0 : undefined,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: isRightAligned ? "flex-end" : undefined,
          gap: "7px",
        }}
      >
        {isRightAligned && badge}
        <Typography
          noWrap
          data-testid={`hero-${side}-name`}
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 900,
            fontSize: isDesktop ? "17px" : "15px",
            lineHeight: isDesktop ? 1.1 : 1.2,
            letterSpacing: "0.04em",
            color: isDesktop ? `${side}.main` : "pitch.contrastText",
          }}
        >
          {teamName.toUpperCase()}
        </Typography>
        {!isRightAligned && badge}
      </Box>
      <Typography
        sx={{
          fontFamily: "Archivo, sans-serif",
          fontWeight: 700,
          fontSize: "10px",
          lineHeight: 1,
          letterSpacing: isDesktop ? "0.12em" : "0.1em",
          color: isDesktop ? "text.secondary" : `${side}.light`,
          mt: "6px",
        }}
      >
        {subtitle}
      </Typography>
    </Box>
  );
}

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
  onToggleHistory,
  onToggleRun,
  onOpenResetConfirm,
  onEndMatch,
  updating,
  finished: finishedProp,
  isEditing,
  onToggleEdit,
  isMirrored = false,
  onToggleMirror,
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

  const swapSidesLabel = t(
    "peladas.dashboard.button.swap_sides",
    "Inverter lados",
  );

  const leftSide = isMirrored ? "away" : "home";
  const rightSide = isMirrored ? "home" : "away";

  const getSideInfo = (side: "home" | "away") => {
    const isHome = side === "home";
    return {
      side,
      teamName: isHome ? homeTeamName : awayTeamName,
      position: isHome ? livePositions.home : livePositions.away,
      subtitle: isHome
        ? t("peladas.matches.team_orange")
        : t("peladas.matches.team_blue"),
      color: isHome ? "home.main" : "away.main",
      score: (isHome ? match.home_score : match.away_score) ?? 0,
    };
  };

  const left = getSideInfo(leftSide);
  const right = getSideInfo(rightSide);

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
      {onToggleMirror && (
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            onToggleMirror();
          }}
          data-testid="menu-toggle-mirror-sides"
        >
          <SwapHorizIcon fontSize="small" sx={{ mr: 1 }} />
          {swapSidesLabel}
        </MenuItem>
      )}
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
          <HeroTeamSide
            side={left.side}
            teamName={left.teamName}
            position={left.position}
            subtitle={left.subtitle}
            isDesktop={true}
            align="right"
          />

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
                color: left.color,
                minWidth: 52,
                textAlign: "center",
              }}
            >
              {left.score}
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
                color: right.color,
                minWidth: 52,
                textAlign: "center",
              }}
            >
              {right.score}
            </Typography>
          </Stack>

          <HeroTeamSide
            side={right.side}
            teamName={right.teamName}
            position={right.position}
            subtitle={right.subtitle}
            isDesktop={true}
            align="left"
          />
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

          <IconButton
            onClick={onToggleHistory}
            data-testid="toggle-history-drawer"
            aria-label={t("peladas.dashboard.button.history")}
            sx={{
              border: "1.5px solid",
              borderColor: "divider",
              bgcolor: "action.hover",
              color: "text.secondary",
              width: 36,
              height: 36,
              borderRadius: "11px",
              p: 0,
              "&:hover": { borderColor: "text.primary", color: "text.primary" },
            }}
          >
            <HistoryIcon sx={{ fontSize: 18 }} />
          </IconButton>

          {onToggleMirror && (
            <Tooltip title={swapSidesLabel}>
              <IconButton
                onClick={onToggleMirror}
                data-testid="toggle-mirror-sides"
                aria-label={swapSidesLabel}
                sx={{
                  border: "1.5px solid",
                  borderColor: isMirrored ? "primary.main" : "divider",
                  bgcolor: isMirrored ? "action.selected" : "action.hover",
                  color: isMirrored ? "primary.main" : "text.secondary",
                  width: 36,
                  height: 36,
                  borderRadius: "11px",
                  p: 0,
                  "&:hover": {
                    borderColor: "primary.main",
                    color: "primary.main",
                  },
                }}
              >
                <SwapHorizIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
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
          sx={mobileHeaderIconBtnSx}
        >
          <HistoryIcon sx={{ fontSize: 18 }} />
        </IconButton>
        {onToggleMirror && (
          <IconButton
            onClick={onToggleMirror}
            data-testid="toggle-mirror-sides"
            aria-label={swapSidesLabel}
            sx={{
              ...mobileHeaderIconBtnSx,
              ...(isMirrored && {
                bgcolor: (theme) =>
                  alpha(theme.palette.pitch?.contrastText ?? "#ffffff", 0.28),
                color: "pitch.contrastText",
              }),
            }}
          >
            <SwapHorizIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
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
            {(pelada.organization_name || "100FÔLEGO").toUpperCase()}
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
          sx={mobileHeaderIconBtnSx}
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
        <HeroTeamSide
          side={left.side}
          teamName={left.teamName}
          position={left.position}
          subtitle={left.subtitle}
          isDesktop={false}
          align="right"
        />

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
              color: left.color,
              minWidth: 44,
              textAlign: "center",
            }}
          >
            {left.score}
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
              color: right.color,
              minWidth: 44,
              textAlign: "center",
            }}
          >
            {right.score}
          </Typography>
        </Box>

        <HeroTeamSide
          side={right.side}
          teamName={right.teamName}
          position={right.position}
          subtitle={right.subtitle}
          isDesktop={false}
          align="left"
        />
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
