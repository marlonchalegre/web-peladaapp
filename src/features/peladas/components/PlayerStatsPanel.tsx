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
} from "@mui/material";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import { useTranslation } from "react-i18next";

export type PlayerStatRow = {
  playerId: number;
  name: string;
  goals: number;
  assists: number;
  ownGoals: number;
  matchesPlayed?: number;
};
export type SortState = {
  by: "default" | "goals" | "assists";
  dir: "asc" | "desc";
};

type Props = {
  playerStats: PlayerStatRow[];
  onToggleSort: (by: "goals" | "assists") => void;
};

export default function PlayerStatsPanel({ playerStats, onToggleSort }: Props) {
  const { t } = useTranslation();

  return (
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
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
