import {
  Paper,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip,
  Box,
  Stack,
  Divider,
} from "@mui/material";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import AssistantIcon from "@mui/icons-material/Assistant";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";
import { getInitials } from "../../../shared/utils/initials";

export type PlayerStatRow = {
  playerId: string;
  userId?: string;
  name: string;
  avatar_filename?: string | null;
  goals: number;
  assists: number;
  ownGoals: number;
  goalsConceded?: number;
  matchesPlayed?: number;
};

type Props = {
  playerStats: PlayerStatRow[];
  onToggleSort: (by: "goals" | "assists") => void;
  showHighlights?: boolean;
};

const HighlightCard = ({
  title,
  players,
  count,
  icon,
  color,
}: {
  title: string;
  players: PlayerStatRow[];
  count: number;
  icon: React.ReactNode;
  color: "primary" | "info" | "secondary" | "warning" | "error" | "success";
}) => (
  <Box sx={{ flex: 1, minWidth: { xs: "100%", sm: "140px" } }}>
    <Stack
      direction="row"
      spacing={1}
      sx={{
        alignItems: "center",
        mb: 1.5,
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: 1,
          bgcolor: `${color}.light`,
          color: `${color}.main`,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="subtitle2"
        noWrap
        sx={{
          fontWeight: "bold",
          color: "text.secondary",
          textTransform: "uppercase",
          letterSpacing: 1,
          minWidth: 0,
        }}
      >
        {title}
      </Typography>
    </Stack>

    <Stack spacing={1}>
      {players.map((p) => (
        <Paper
          key={p.playerId}
          elevation={0}
          sx={{
            p: 1.25,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "background.default",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            minWidth: 0,
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: "center",
              minWidth: 0,
              flex: 1,
              mr: 1,
            }}
          >
            <SecureAvatar
              userId={p.userId}
              filename={p.avatar_filename}
              sx={{
                width: 32,
                height: 32,
                fontSize: "0.875rem",
                bgcolor: `${color}.main`,
                flexShrink: 0,
              }}
              fallbackText={getInitials(p.name)}
            />
            <Typography
              variant="body2"
              noWrap
              sx={{
                fontWeight: "bold",
                minWidth: 0,
              }}
            >
              {p.name}
            </Typography>
          </Stack>
          <Typography
            variant="h6"
            color={`${color}.main`}
            sx={{
              fontWeight: "black",
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            {count}
          </Typography>
        </Paper>
      ))}
    </Stack>
  </Box>
);

function StatsHighlights({ stats }: { stats: PlayerStatRow[] }) {
  const { t } = useTranslation();

  const topScorers = useMemo(() => {
    const maxGoals = Math.max(...stats.map((s) => s.goals));
    if (maxGoals <= 0) return [];
    return stats.filter((s) => s.goals === maxGoals);
  }, [stats]);

  const topAssists = useMemo(() => {
    const maxAssists = Math.max(...stats.map((s) => s.assists));
    if (maxAssists <= 0) return [];
    return stats.filter((s) => s.assists === maxAssists);
  }, [stats]);

  if (topScorers.length === 0 && topAssists.length === 0) return null;

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: "action.hover" }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "center",
          mb: 2.5,
        }}
      >
        <TrendingUpIcon color="primary" />
        <Typography
          variant="h6"
          sx={{
            fontWeight: "bold",
          }}
        >
          {t("peladas.dashboard.summary.highlights")}
        </Typography>
      </Stack>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 2, sm: 1.5, md: 2 }}
        sx={{ flexWrap: "wrap" }}
      >
        {topScorers.length > 0 && (
          <HighlightCard
            title={t("common.goals")}
            players={topScorers}
            count={topScorers[0].goals}
            icon={<SportsSoccerIcon fontSize="small" />}
            color="primary"
          />
        )}
        {topAssists.length > 0 && (
          <HighlightCard
            title={t("common.assists")}
            players={topAssists}
            count={topAssists[0].assists}
            icon={<AssistantIcon fontSize="small" />}
            color="info"
          />
        )}
      </Stack>
      <Divider sx={{ mt: 2.5 }} />
    </Box>
  );
}

export default function PlayerStatsPanel({
  playerStats,
  onToggleSort,
  showHighlights,
}: Props) {
  const { t } = useTranslation();

  return (
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      {showHighlights && <StatsHighlights stats={playerStats} />}
      <Box
        sx={{
          bgcolor: "action.hover",
          p: 1.5,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: "bold",
          }}
        >
          {t("peladas.panel.stats.title")}
        </Typography>
      </Box>
      <TableContainer>
        <Table size="small" data-testid="player-stats-table">
          <TableHead>
            <TableRow sx={{ height: 56 }}>
              <TableCell>{t("common.player")}</TableCell>
              <TableCell align="center">{t("common.matches_played")}</TableCell>
              <TableCell align="center">
                <Stack
                  direction="row"
                  sx={{
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {t("common.goals")}
                  <Tooltip title={t("peladas.panel.stats.sort.goals")}>
                    <IconButton
                      size="small"
                      onClick={() => onToggleSort("goals")}
                      sx={{ ml: 0.5, p: 0, color: "inherit" }}
                    >
                      <SwapVertIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </TableCell>
              <TableCell align="center">
                <Stack
                  direction="row"
                  sx={{
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {t("common.assists_short")}
                  <Tooltip title={t("peladas.panel.stats.sort.assists")}>
                    <IconButton
                      size="small"
                      onClick={() => onToggleSort("assists")}
                      sx={{ ml: 0.5, p: 0, color: "inherit" }}
                    >
                      <SwapVertIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </TableCell>
              <TableCell align="center">
                {t("common.own_goals_short")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {playerStats.map((p, index) => (
              <TableRow
                key={`pst-${p.playerId}`}
                hover
                sx={{
                  bgcolor: index % 2 === 1 ? "action.hover" : "inherit",
                  height: 48,
                }}
              >
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{
                      alignItems: "center",
                    }}
                  >
                    <SecureAvatar
                      userId={p.userId}
                      filename={p.avatar_filename}
                      sx={{ width: 28, height: 28, fontSize: "0.75rem" }}
                      fallbackText={p.name.charAt(0)}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {p.name}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell align="center">{p.matchesPlayed ?? "-"}</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  {p.goals}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 500 }}>
                  {p.assists}
                </TableCell>
                <TableCell align="center" sx={{ color: "text.secondary" }}>
                  {p.ownGoals}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
