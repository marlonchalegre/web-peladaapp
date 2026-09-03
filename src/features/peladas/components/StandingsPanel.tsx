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
  Tooltip,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { useMemo } from "react";

export type StandingRow = {
  teamId: string;
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

function getMathematicalChampion(standings: StandingRow[]): StandingRow | null {
  if (!standings || standings.length === 0) return null;
  const first = standings[0];
  const firstPoints = first.points ?? first.wins * 3 + first.draws;

  if (first.wins === 0 && first.draws === 0) return null;

  if (standings.length > 1) {
    const second = standings[1];
    const secondPoints = second.points ?? second.wins * 3 + second.draws;

    if (
      firstPoints === secondPoints &&
      first.goalDifference === second.goalDifference &&
      first.goalsFor === second.goalsFor
    ) {
      return null;
    }
  }

  return first;
}

function StandingsHighlights({ standings }: { standings: StandingRow[] }) {
  const { t } = useTranslation();

  const champion = useMemo(
    () => getMathematicalChampion(standings),
    [standings],
  );

  if (!champion) return null;

  return (
    <Box sx={{ p: 2.5, bgcolor: "action.hover" }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "center",
          mb: 3,
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
      <Box sx={{ flex: 1, maxWidth: { xs: "100%", sm: "300px" } }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "center",
            mb: 1.5,
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
              bgcolor: "warning.light",
              color: "warning.main",
            }}
          >
            <EmojiEventsIcon fontSize="small" />
          </Box>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: "bold",
              color: "text.secondary",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
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
          <Stack
            direction="row"
            spacing={2}
            sx={{
              alignItems: "center",
            }}
          >
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
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: "800",
                  lineHeight: 1.2,
                }}
              >
                {champion.name ||
                  t("peladas.matches.team_fallback", { id: champion.teamId })}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                }}
              >
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
  const champion = useMemo(
    () => (showHighlights ? getMathematicalChampion(standings) : null),
    [showHighlights, standings],
  );

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
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: "bold",
          }}
        >
          {t("peladas.panel.standings.title")}
        </Typography>
      </Box>
      <TableContainer>
        <Table size="small" data-testid="standings-table">
          <TableHead>
            <TableRow sx={{ height: 56 }}>
              <TableCell sx={{ minWidth: { xs: 100, sm: 140 } }}>
                {t("common.team")}
              </TableCell>
              <TableCell
                align="center"
                sx={{ width: { xs: 36, sm: 50 }, px: { xs: 0.5, sm: 1.5 } }}
              >
                {t("common.points_short")}
              </TableCell>
              <TableCell
                align="center"
                sx={{ width: { xs: 32, sm: 44 }, px: { xs: 0.5, sm: 1.5 } }}
              >
                {t("common.wins_short")}
              </TableCell>
              <TableCell
                align="center"
                sx={{ width: { xs: 32, sm: 44 }, px: { xs: 0.5, sm: 1.5 } }}
              >
                {t("common.draws_short")}
              </TableCell>
              <TableCell
                align="center"
                sx={{ width: { xs: 32, sm: 44 }, px: { xs: 0.5, sm: 1.5 } }}
              >
                {t("common.losses_short")}
              </TableCell>
              <TableCell
                align="center"
                sx={{ width: { xs: 32, sm: 44 }, px: { xs: 0.5, sm: 1.5 } }}
              >
                GP
              </TableCell>
              <TableCell
                align="center"
                sx={{ width: { xs: 32, sm: 44 }, px: { xs: 0.5, sm: 1.5 } }}
              >
                SG
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {standings.map((row, index) => {
              const points = row.points ?? row.wins * 3 + row.draws;
              const isChampion = champion?.teamId === row.teamId;
              return (
                <TableRow
                  key={`stand-${row.teamId}`}
                  hover
                  sx={{
                    bgcolor: index % 2 === 1 ? "action.hover" : "inherit",
                    height: 48,
                  }}
                >
                  <TableCell sx={{ minWidth: { xs: 100, sm: 140 } }}>
                    <Stack
                      direction="row"
                      spacing={0.75}
                      sx={{ alignItems: "center" }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {row.name ||
                          t("peladas.matches.team_fallback", {
                            id: row.teamId,
                          })}
                      </Typography>
                      {isChampion && (
                        <Tooltip title={t("common.champion")}>
                          <EmojiEventsIcon
                            sx={{
                              fontSize: 16,
                              color: "warning.main",
                              flexShrink: 0,
                            }}
                            data-testid="champion-trophy-icon"
                          />
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: "bold", px: { xs: 0.5, sm: 1.5 } }}
                  >
                    {points}
                  </TableCell>
                  <TableCell align="center" sx={{ px: { xs: 0.5, sm: 1.5 } }}>
                    {row.wins}
                  </TableCell>
                  <TableCell align="center" sx={{ px: { xs: 0.5, sm: 1.5 } }}>
                    {row.draws}
                  </TableCell>
                  <TableCell align="center" sx={{ px: { xs: 0.5, sm: 1.5 } }}>
                    {row.losses}
                  </TableCell>
                  <TableCell align="center" sx={{ px: { xs: 0.5, sm: 1.5 } }}>
                    {row.goalsFor}
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ px: { xs: 0.5, sm: 1.5 }, fontWeight: 600 }}
                  >
                    {(row.goalDifference > 0 ? "+" : "") + row.goalDifference}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
