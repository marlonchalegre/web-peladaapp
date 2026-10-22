import { useMemo } from "react";
import { Box, Button, Tooltip, Typography } from "@mui/material";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import { useTranslation } from "react-i18next";
import type { Match } from "../../../shared/api/endpoints";
import { getStandingPoints, type StandingRow } from "../utils/standingsUtils";

type LiveStandingsCardProps = {
  standings: StandingRow[];
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
};

export function LiveStandingsCard({
  standings,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
}: LiveStandingsCardProps) {
  const { t } = useTranslation();

  const liveMatchTable = useMemo(() => {
    return standings.map((row, index) => {
      const games = row.wins + row.draws + row.losses;
      const v = row.wins;
      const e = row.draws;
      const d = row.losses;
      const sg = row.goalsFor - row.goalsAgainst;
      const p = getStandingPoints(row);

      let color: string;
      if (row.teamId === homeTeamId) {
        color = "home.main";
      } else if (row.teamId === awayTeamId) {
        color = "away.main";
      } else {
        const palette = [
          "primary.main",
          "matchEvents.vish",
          "gold.main",
          "matchEvents.chute",
        ];
        color = palette[index % palette.length];
      }

      const teamName =
        row.teamId === homeTeamId
          ? homeTeamName || row.name
          : row.teamId === awayTeamId
            ? awayTeamName || row.name
            : row.name;

      return {
        teamId: row.teamId,
        position: index + 1,
        name: teamName,
        color,
        record: `${games}J · ${v}V ${e}E ${d}D`,
        sgLabel: (sg > 0 ? "+" : "") + sg,
        p,
        isPlaying: row.teamId === homeTeamId || row.teamId === awayTeamId,
      };
    });
  }, [standings, homeTeamId, awayTeamId, homeTeamName, awayTeamName]);

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: (theme) => `1.5px solid ${theme.palette.divider}`,
        borderRadius: "13px",
        px: "13px",
        py: "12px",
      }}
      data-testid="live-standings-card"
    >
      <Typography
        sx={{
          fontFamily: "Archivo, sans-serif",
          fontWeight: 800,
          fontSize: "9.5px",
          lineHeight: 1,
          letterSpacing: "0.14em",
          color: "text.secondary",
          mb: "9px",
        }}
      >
        {t(
          "peladas.dashboard.live_state.live_standings",
          "CLASSIFICAÇÃO AO VIVO",
        )}
      </Typography>
      {liveMatchTable.map((row) => (
        <Box
          key={row.teamId}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            py: "7px",
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "11px",
              lineHeight: 1,
              color: "text.secondary",
              width: "18px",
              flexShrink: 0,
            }}
          >
            {row.position}º
          </Typography>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: row.color,
              flexShrink: 0,
            }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              noWrap
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: row.isPlaying ? 900 : 700,
                fontSize: "12px",
                lineHeight: 1,
                color: "text.primary",
                textTransform: "uppercase",
              }}
            >
              {row.name}
            </Typography>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontSize: "9.5px",
                fontWeight: 600,
                lineHeight: 1,
                color: "text.secondary",
                mt: "3px",
              }}
            >
              {row.record} · SG {row.sgLabel}
            </Typography>
          </Box>
          <Typography
            sx={{
              fontFamily: "'Anton', sans-serif",
              fontSize: "20px",
              lineHeight: 1,
              color: "text.primary",
            }}
          >
            {row.p}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

type NextMatchCardProps = {
  nextMatch: Match | null;
  teamNameById: Record<string, string>;
  isDesktop: boolean;
};

export function NextMatchCard({
  nextMatch,
  teamNameById,
  isDesktop,
}: NextMatchCardProps) {
  const { t } = useTranslation();

  if (!nextMatch) return null;
  const homeName = teamNameById[nextMatch.home_team_id] || "TIME 3";
  const awayName = teamNameById[nextMatch.away_team_id] || "TIME 4";

  if (isDesktop) {
    return (
      <Box
        sx={{
          p: "12px 14px",
          bgcolor: "background.paper",
          border: (theme) => `1.5px solid ${theme.palette.divider}`,
          borderRadius: "13px",
        }}
        data-testid="next-match-card"
      >
        <Typography
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 800,
            fontSize: "9.5px",
            lineHeight: 1,
            letterSpacing: "0.14em",
            color: "text.secondary",
          }}
        >
          {t("peladas.dashboard.summary.next_up", "A SEGUIR")}
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            mt: "8px",
          }}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              bgcolor: "home.main",
              border: "1px solid rgba(0,0,0,0.15)",
              flexShrink: 0,
            }}
          />
          <Typography
            noWrap
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "13px",
              lineHeight: 1,
              color: "text.primary",
            }}
          >
            {homeName.toUpperCase()}
          </Typography>
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: "10px",
              lineHeight: 1,
              letterSpacing: "0.08em",
              color: "text.secondary",
            }}
          >
            LARANJA
          </Typography>
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 600,
              fontSize: "11px",
              lineHeight: 1,
              color: "text.secondary",
            }}
          >
            vs
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            mt: "6px",
          }}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              bgcolor: "away.main",
              border: "1px solid rgba(0,0,0,0.15)",
              flexShrink: 0,
            }}
          />
          <Typography
            noWrap
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "13px",
              lineHeight: 1,
              color: "text.primary",
            }}
          >
            {awayName.toUpperCase()}
          </Typography>
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: "10px",
              lineHeight: 1,
              letterSpacing: "0.08em",
              color: "text.secondary",
            }}
          >
            AZUL
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        mt: 0,
        mb: "8px",
        p: "12px 14px",
        bgcolor: "action.hover",
        borderRadius: "13px",
      }}
      data-testid="next-match-card"
    >
      <Typography
        sx={{
          fontFamily: "Archivo, sans-serif",
          fontWeight: 800,
          fontSize: "10px",
          lineHeight: 1,
          letterSpacing: "0.14em",
          color: "text.secondary",
        }}
      >
        {t("peladas.dashboard.summary.next_up", "A SEGUIR")}
      </Typography>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          flex: 1,
          minWidth: 0,
        }}
      >
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            bgcolor: "home.main",
            border: "1px solid rgba(0,0,0,0.15)",
            flexShrink: 0,
          }}
        />
        <Typography
          noWrap
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 800,
            fontSize: "12.5px",
            lineHeight: 1,
            color: "text.primary",
          }}
        >
          {homeName}
        </Typography>
        <Typography
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 600,
            fontSize: "11px",
            lineHeight: 1,
            color: "text.secondary",
          }}
        >
          vs
        </Typography>
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            bgcolor: "away.main",
            border: "1px solid rgba(0,0,0,0.15)",
            flexShrink: 0,
          }}
        />
        <Typography
          noWrap
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 800,
            fontSize: "12.5px",
            lineHeight: 1,
            color: "text.primary",
          }}
        >
          {awayName}
        </Typography>
      </Box>
    </Box>
  );
}

type MatchSupportRowProps = {
  match: Match;
  getPlayerName: (playerId: string) => string;
  isDesktop: boolean;
  onNavigateToSupportTab?: () => void;
};

export function MatchSupportRow({
  match,
  getPlayerName,
  isDesktop,
  onNavigateToSupportTab,
}: MatchSupportRowProps) {
  const { t } = useTranslation();

  const cam = match.support_camera_player_id
    ? getPlayerName(match.support_camera_player_id)
    : null;
  const stats = match.support_stats_player_id
    ? getPlayerName(match.support_stats_player_id)
    : null;
  const unassigned = t(
    "peladas.matches.support_lineup.unassigned",
    "Não definido",
  );
  const camTitle = t("peladas.matches.support_lineup.camera_short", "Câmera");
  const statsTitle = t("peladas.matches.support_lineup.stats_short", "Súmula");
  const escalaLink = onNavigateToSupportTab && (
    <Button
      onClick={onNavigateToSupportTab}
      data-testid="view-full-support-schedule"
      sx={{
        minWidth: 0,
        p: 0,
        fontFamily: "Archivo, sans-serif",
        fontWeight: 700,
        fontSize: "11.5px",
        lineHeight: 1,
        color: "primary.main",
        "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
      }}
    >
      {t("peladas.support_lineup.view_escalation", "Escala")}
    </Button>
  );

  if (isDesktop) {
    return (
      <Box
        sx={{
          p: "12px 14px",
          border: (theme) => `1.5px dashed ${theme.palette.divider}`,
          borderRadius: "13px",
        }}
        data-testid="active-match-support-lineup-card"
      >
        <Typography
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 800,
            fontSize: "9.5px",
            lineHeight: 1,
            letterSpacing: "0.14em",
            color: "text.secondary",
          }}
        >
          {t("peladas.dashboard.live_state.support_label", "SUPORTE")}
        </Typography>
        <Box
          sx={{
            mt: "7px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <Box
            data-testid="support-camera-person"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              minWidth: 0,
            }}
          >
            <Tooltip title={camTitle}>
              <VideocamOutlinedIcon
                data-testid="support-camera-icon"
                aria-label={camTitle}
                sx={{ fontSize: 16, color: "text.secondary", flexShrink: 0 }}
              />
            </Tooltip>
            <Typography
              noWrap
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 600,
                fontSize: "12px",
                lineHeight: 1.2,
                color: "text.secondary",
              }}
            >
              {cam || unassigned}
            </Typography>
          </Box>

          <Box
            data-testid="support-stats-person"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              minWidth: 0,
            }}
          >
            <Tooltip title={statsTitle}>
              <AssignmentOutlinedIcon
                data-testid="support-stats-icon"
                aria-label={statsTitle}
                sx={{ fontSize: 16, color: "text.secondary", flexShrink: 0 }}
              />
            </Tooltip>
            <Typography
              noWrap
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 600,
                fontSize: "12px",
                lineHeight: 1.2,
                color: "text.secondary",
              }}
            >
              {stats || unassigned}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        mt: 0,
        mb: "12px",
        p: "12px 14px",
        border: (theme) => `1.5px dashed ${theme.palette.divider}`,
        borderRadius: "13px",
      }}
      data-testid="active-match-support-lineup-card"
    >
      <Typography
        sx={{
          fontFamily: "Archivo, sans-serif",
          fontWeight: 800,
          fontSize: "10px",
          lineHeight: 1,
          letterSpacing: "0.14em",
          color: "text.secondary",
          flexShrink: 0,
        }}
      >
        {t("peladas.dashboard.live_state.support_label", "SUPORTE")}
      </Typography>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <Box
          data-testid="support-camera-person"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <Tooltip title={camTitle}>
            <VideocamOutlinedIcon
              data-testid="support-camera-icon"
              aria-label={camTitle}
              sx={{ fontSize: 15, color: "text.secondary", flexShrink: 0 }}
            />
          </Tooltip>
          <Typography
            noWrap
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 600,
              fontSize: "11.5px",
              lineHeight: 1.2,
              color: "text.secondary",
            }}
          >
            {cam || unassigned}
          </Typography>
        </Box>

        <Box
          data-testid="support-stats-person"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <Tooltip title={statsTitle}>
            <AssignmentOutlinedIcon
              data-testid="support-stats-icon"
              aria-label={statsTitle}
              sx={{ fontSize: 15, color: "text.secondary", flexShrink: 0 }}
            />
          </Tooltip>
          <Typography
            noWrap
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 600,
              fontSize: "11.5px",
              lineHeight: 1.2,
              color: "text.secondary",
            }}
          >
            {stats || unassigned}
          </Typography>
        </Box>
      </Box>

      {escalaLink}
    </Box>
  );
}
