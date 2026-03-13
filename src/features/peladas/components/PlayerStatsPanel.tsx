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
  Avatar,
  Divider,
} from "@mui/material";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import AssistantIcon from "@mui/icons-material/Assistant";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

export type PlayerStatRow = {
  playerId: number;
  name: string;
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

function StatsHighlights({ stats }: { stats: PlayerStatRow[] }) {
  const { t } = useTranslation();

  const topScorers = useMemo(() => {
    const maxGoals = Math.max(...stats.map((s) => s.goals));
    if (maxGoals === 0) return [];
    return stats.filter((s) => s.goals === maxGoals);
  }, [stats]);

  const topAssists = useMemo(() => {
    const maxAssists = Math.max(...stats.map((s) => s.assists));
    if (maxAssists === 0) return [];
    return stats.filter((s) => s.assists === maxAssists);
  }, [stats]);

  if (topScorers.length === 0 && topAssists.length === 0) return null;

  const HighlightCard = ({ 
    title, 
    players, 
    count, 
    icon, 
    color 
  }: { 
    title: string; 
    players: PlayerStatRow[]; 
    count: number; 
    icon: React.ReactNode;
    color: string;
  }) => (
    <Box sx={{ flex: 1, minWidth: { xs: '100%', sm: '200px' } }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: 1,
          bgcolor: `${color}.light`,
          color: `${color}.main`
        }}>
          {icon}
        </Box>
        <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
          {title}
        </Typography>
      </Stack>
      
      <Stack spacing={1}>
        {players.map(p => (
          <Paper 
            key={p.playerId}
            elevation={0} 
            sx={{ 
              p: 1.5, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              bgcolor: 'background.default',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem', bgcolor: `${color}.main` }}>
                {p.name.substring(0, 2).toUpperCase()}
              </Avatar>
              <Typography variant="body2" fontWeight="bold">{p.name}</Typography>
            </Stack>
            <Typography variant="h6" fontWeight="black" color={`${color}.main`}>{count}</Typography>
          </Paper>
        ))}
      </Stack>
    </Box>
  );

  return (
    <Box sx={{ p: 2.5, bgcolor: 'action.hover' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <TrendingUpIcon color="primary" />
        <Typography variant="h6" fontWeight="bold">{t("peladas.dashboard.summary.highlights")}</Typography>
      </Stack>
      
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
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
      <Divider sx={{ mt: 3 }} />
    </Box>
  );
}

export default function PlayerStatsPanel({ playerStats, onToggleSort, showHighlights }: Props) {
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
        <Typography variant="subtitle1" fontWeight="bold">
          {t("peladas.panel.stats.title")}
        </Typography>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>
                {t("common.player")}
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                {t("common.matches_played")}
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="center"
                >
                  {t("common.goals")}
                  <Tooltip title={t("peladas.panel.stats.sort.goals")}>
                    <IconButton
                      size="small"
                      onClick={() => onToggleSort("goals")}
                      sx={{ ml: 0.5, p: 0 }}
                    >
                      <SwapVertIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="center"
                >
                  {t("common.assists_short")}
                  <Tooltip title={t("peladas.panel.stats.sort.assists")}>
                    <IconButton
                      size="small"
                      onClick={() => onToggleSort("assists")}
                      sx={{ ml: 0.5, p: 0 }}
                    >
                      <SwapVertIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                {t("common.own_goals_short")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {playerStats.map((p, index) => (
              <TableRow
                key={`pst-${p.playerId}`}
                hover
                sx={{ bgcolor: index % 2 === 1 ? "action.hover" : "inherit" }}
              >
                <TableCell sx={{ whiteSpace: "nowrap" }}>{p.name}</TableCell>
                <TableCell align="center">{p.matchesPlayed ?? "-"}</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  {p.goals}
                </TableCell>
                <TableCell align="center">{p.assists}</TableCell>
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
