import {
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableSortLabel,
  TableBody,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { type PlayerStats } from "../hooks/useOrganizationStatistics";

interface StatsTableProps {
  stats: PlayerStats[];
  orderBy: keyof PlayerStats;
  order: "asc" | "desc";
  onSort: (property: keyof PlayerStats) => void;
}

export default function StatsTable({
  stats,
  orderBy,
  order,
  onSort,
}: StatsTableProps) {
  const { t } = useTranslation();

  return (
    <TableContainer component={Paper}>
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
          {stats.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center">
                {t("organizations.stats.empty")}
              </TableCell>
            </TableRow>
          ) : (
            stats.map((row) => (
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
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
