import {
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableSortLabel,
  TableBody,
  Box,
  Typography,
  Divider,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { type OrganizationPlayerStats } from "../../../shared/api/endpoints";

interface StatsTableProps {
  stats: OrganizationPlayerStats[];
  orderBy: keyof OrganizationPlayerStats;
  order: "asc" | "desc";
  onSort: (property: keyof OrganizationPlayerStats) => void;
}

export default function StatsTable({
  stats,
  orderBy,
  order,
  onSort,
}: StatsTableProps) {
  const { t } = useTranslation();

  if (stats.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography color="text.secondary">
          {t("organizations.stats.empty")}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Desktop View */}
      <TableContainer
        component={Paper}
        sx={{ display: { xs: "none", md: "block" } }}
      >
        <Table sx={{ minWidth: 650 }} aria-label="statistics table">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "player_name"}
                  direction={orderBy === "player_name" ? order : "asc"}
                  onClick={() => onSort("player_name")}
                >
                  {t("common.player")}
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === "peladas_played"}
                  direction={orderBy === "peladas_played" ? order : "asc"}
                  onClick={() => onSort("peladas_played")}
                >
                  {t("organizations.stats.table.peladas")}
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === "goal"}
                  direction={orderBy === "goal" ? order : "asc"}
                  onClick={() => onSort("goal")}
                >
                  {t("common.goals")}
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === "assist"}
                  direction={orderBy === "assist" ? order : "asc"}
                  onClick={() => onSort("assist")}
                >
                  {t("common.assists")}
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === "own_goal"}
                  direction={orderBy === "own_goal" ? order : "asc"}
                  onClick={() => onSort("own_goal")}
                >
                  {t("common.own_goals")}
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stats.map((row) => (
              <TableRow
                key={row.player_id}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {row.player_name}
                </TableCell>
                <TableCell align="right">{row.peladas_played}</TableCell>
                <TableCell align="right">{row.goal}</TableCell>
                <TableCell align="right">{row.assist}</TableCell>
                <TableCell align="right">{row.own_goal}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Mobile View */}
      <Box
        sx={{
          display: { xs: "flex", md: "none" },
          flexDirection: "column",
          gap: 2,
        }}
      >
        {stats.map((row) => (
          <Paper key={row.player_id} sx={{ p: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                {row.player_name}
              </Typography>
              <Box
                sx={{
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  px: 1,
                  borderRadius: 1,
                }}
              >
                <Typography variant="caption" fontWeight="bold">
                  {row.goal} {t("common.goals").toLowerCase()}
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ mb: 1 }} />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 1,
                textAlign: "center",
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t("organizations.stats.table.peladas")}
                </Typography>
                <Typography variant="body2">{row.peladas_played}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t("common.assists")}
                </Typography>
                <Typography variant="body2">{row.assist}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t("common.own_goals")}
                </Typography>
                <Typography variant="body2">{row.own_goal}</Typography>
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
