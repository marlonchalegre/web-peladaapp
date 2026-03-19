import {
  Paper,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
  Stack,
  Avatar,
  Divider,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { useMemo } from "react";

export type StandingRow = {
  teamId: number;
  name: string;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points?: number;
};

type Props = {
  standings: StandingRow[];
  showHighlights?: boolean;
};

function StandingsHighlights({ standings }: { standings: StandingRow[] }) {
  const { t } = useTranslation();

  const champion = useMemo(() => {
    if (standings.length === 0) return null;
    // Assuming standings are already sorted by points, wins, GD
    return standings[0];
  }, [standings]);

  if (!champion || (champion.wins === 0 && champion.draws === 0)) return null;

  return (
    <Box sx={{ p: 2.5, bgcolor: "action.hover" }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <TrendingUpIcon color="primary" />
        <Typography variant="h6" fontWeight="bold">
          {t("peladas.dashboard.summary.highlights")}
        </Typography>
      </Stack>

      <Box sx={{ flex: 1, maxWidth: { xs: "100%", sm: "300px" } }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 1,
              bgcolor: "warning.light",
              color: "warning.main",
            }}
          >
            <EmojiEventsIcon fontSize="small" />
          </Box>
          <Typography
            variant="subtitle2"
            fontWeight="bold"
            color="text.secondary"
            sx={{ textTransform: "uppercase", letterSpacing: 1 }}
          >
            {t("common.champion")}
          </Typography>
        </Stack>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "background.default",
            border: "2px solid",
            borderColor: "warning.main",
            borderRadius: 3,
            boxShadow: "0 4px 12px rgba(237, 108, 2, 0.1)",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: "warning.main",
                fontWeight: "bold",
              }}
            >
              <EmojiEventsIcon />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="800" lineHeight={1.2}>
                {champion.name ||
                  t("peladas.matches.team_fallback", { id: champion.teamId })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {champion.wins}V {champion.draws}E {champion.losses}D
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Box>
      <Divider sx={{ mt: 3 }} />
    </Box>
  );
}

export default function StandingsPanel({ standings, showHighlights }: Props) {
  const { t } = useTranslation();

  return (
    <Paper variant="outlined" sx={{ mb: 2, overflow: "hidden" }}>
      {showHighlights && <StandingsHighlights standings={standings} />}

      <Box
        sx={{
          bgcolor: "action.hover",
          p: 1.5,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold">
          {t("peladas.panel.standings.title")}
        </Typography>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>
                {t("common.team")}
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                {t("common.wins_short")}
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                {t("common.draws_short")}
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                {t("common.losses_short")}
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                GP
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                SG
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {standings.map((row, index) => (
              <TableRow
                key={`stand-${row.teamId}`}
                hover
                sx={{ bgcolor: index % 2 === 1 ? "action.hover" : "inherit" }}
              >
                <TableCell>
                  {row.name ||
                    t("peladas.matches.team_fallback", { id: row.teamId })}
                </TableCell>
                <TableCell align="center">{row.wins}</TableCell>
                <TableCell align="center">{row.draws}</TableCell>
                <TableCell align="center">{row.losses}</TableCell>
                <TableCell align="center">{row.goalsFor}</TableCell>
                <TableCell align="center">
                  {(row.goalDifference > 0 ? "+" : "") + row.goalDifference}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
