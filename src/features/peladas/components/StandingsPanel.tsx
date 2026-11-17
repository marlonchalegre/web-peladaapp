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
  Chip,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import { useMemo } from "react";
import type { Match } from "../../../shared/api/endpoints";
import {
  getStandingPoints,
  getMathematicalChampion,
  getMatchStageLabel,
  getMatchWinnerTeamId,
  isKnockoutStage,
  type StandingRow,
} from "../utils/standingsUtils";

export type { StandingRow };

type Props = {
  standings: StandingRow[];
  showHighlights?: boolean;
  matches?: Match[];
};

function StandingsHighlights({ champion }: { champion: StandingRow }) {
  const { t } = useTranslation();

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
      <Box sx={{ flex: 1, maxWidth: { xs: "100%", sm: "300px" }, minWidth: 0 }}>
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
              bgcolor: "warning.light",
              color: "warning.main",
              flexShrink: 0,
            }}
          >
            <EmojiEventsIcon fontSize="small" />
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
            {t("common.champion")}
          </Typography>
        </Stack>

        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "background.default",
            border: "2px solid",
            borderColor: "warning.main",
            borderRadius: 3,
            boxShadow: "0 4px 12px rgba(237, 108, 2, 0.1)",
            minWidth: 0,
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              alignItems: "center",
              minWidth: 0,
              flex: 1,
            }}
          >
            <Avatar
              sx={{
                width: 38,
                height: 38,
                bgcolor: "warning.main",
                fontWeight: "bold",
                flexShrink: 0,
              }}
            >
              <EmojiEventsIcon fontSize="small" />
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="subtitle1"
                noWrap
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
                noWrap
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
      <Divider sx={{ mt: 2.5 }} />
    </Box>
  );
}

export default function StandingsPanel({
  standings,
  showHighlights,
  matches,
}: Props) {
  const { t } = useTranslation();
  const champion = useMemo(
    () => getMathematicalChampion(standings, matches),
    [standings, matches],
  );

  const teamNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of standings) {
      map[s.teamId] = s.name;
    }
    return map;
  }, [standings]);

  const knockoutMatches = useMemo(() => {
    if (!matches) return [];
    return matches.filter((m) => isKnockoutStage(m.stage));
  }, [matches]);

  return (
    <Paper variant="outlined" sx={{ mb: 2, overflow: "hidden" }}>
      {showHighlights && champion && (
        <StandingsHighlights champion={champion} />
      )}
      {knockoutMatches.length > 0 && (
        <Box
          data-testid="standings-knockout-bracket"
          sx={{
            p: 2,
            bgcolor: "background.default",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center", mb: 1.5 }}
          >
            <AccountTreeIcon color="primary" fontSize="small" />
            <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
              {t(
                "peladas.panel.standings.knockout_title",
                "FASE FINAL / MATA-MATA",
              )}
            </Typography>
          </Stack>
          <Stack spacing={1}>
            {knockoutMatches.map((km) => {
              const homeName =
                teamNameMap[km.home_team_id] ||
                t("peladas.matches.team_fallback", { id: km.home_team_id });
              const awayName =
                teamNameMap[km.away_team_id] ||
                t("peladas.matches.team_fallback", { id: km.away_team_id });
              const hs = km.home_score ?? 0;
              const as = km.away_score ?? 0;
              const winnerId = getMatchWinnerTeamId(km);

              return (
                <Paper
                  key={km.id}
                  variant="outlined"
                  sx={{
                    p: 1.25,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1.5,
                  }}
                >
                  <Chip
                    size="small"
                    color={
                      (km.stage || "").toLowerCase() === "final"
                        ? "warning"
                        : "primary"
                    }
                    label={getMatchStageLabel(t, km.stage) || km.stage}
                    sx={{ fontWeight: 700, fontSize: "10.5px" }}
                  />
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      alignItems: "center",
                      flex: 1,
                      justifyContent: "flex-end",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: winnerId === km.home_team_id ? 800 : 500,
                        color:
                          winnerId === km.home_team_id
                            ? "primary.main"
                            : "text.primary",
                      }}
                    >
                      {homeName}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 800,
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        bgcolor: "action.hover",
                      }}
                    >
                      {hs} x {as}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: winnerId === km.away_team_id ? 800 : 500,
                        color:
                          winnerId === km.away_team_id
                            ? "primary.main"
                            : "text.primary",
                      }}
                    >
                      {awayName}
                    </Typography>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        </Box>
      )}
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
              const points = getStandingPoints(row);
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
