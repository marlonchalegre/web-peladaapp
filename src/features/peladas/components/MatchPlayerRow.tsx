import {
  TableRow,
  TableCell,
  Stack,
  Box,
  Typography,
  IconButton,
  Paper,
} from "@mui/material";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import PanToolIcon from "@mui/icons-material/PanTool";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { useTranslation } from "react-i18next";
import { type Player } from "../../../shared/api/endpoints";
import StatInput from "./StatInput";

export type DashboardRowItem = {
  player_id: number;
  team_id?: number;
  side: "home" | "away";
  teamId: number;
  isEmpty: boolean;
  is_goalkeeper?: boolean;
};

interface MatchPlayerRowProps {
  item: DashboardRowItem;
  stats: { goals: number; assists: number; ownGoals: number };
  playerName: string;
  isSubMenuOpen: boolean;
  finished: boolean;
  updating: boolean;
  loadingGoals: boolean;
  loadingAssists: boolean;
  loadingOwnGoals: boolean;
  benchPlayers: Player[];
  onStatChange: (type: "goal" | "assist" | "own_goal", diff: number) => void;
  onSubClick: () => void;
  onAddClick: () => void;
  onCloseMenu: () => void;
  onReplace: (inId: number) => void;
  onAdd: (inId: number) => void;
  getPlayerName: (id: number) => string;
}

export default function MatchPlayerRow({
  item,
  stats,
  playerName,
  isSubMenuOpen,
  finished,
  updating,
  loadingGoals,
  loadingAssists,
  loadingOwnGoals,
  benchPlayers,
  onStatChange,
  onSubClick,
  onAddClick,
  onCloseMenu,
  onReplace,
  onAdd,
  getPlayerName,
}: MatchPlayerRowProps) {
  const { t } = useTranslation();

  if (item.isEmpty) {
    return (
      <TableRow hover>
        <TableCell>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 4,
                height: 24,
                bgcolor: item.side === "home" ? "home.main" : "away.main",
              }}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              fontStyle="italic"
            >
              {t("peladas.dashboard.empty_slot")}
            </Typography>
          </Stack>
          {isSubMenuOpen && (
            <Paper
              elevation={3}
              sx={{
                position: "absolute",
                zIndex: 10,
                mt: 1,
                p: 1,
                maxHeight: 200,
                overflow: "auto",
              }}
            >
              <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                {t("peladas.dashboard.add_player")}
              </Typography>
              {benchPlayers.length === 0 && (
                <Typography variant="caption" color="text.secondary">
                  {t("peladas.dashboard.no_bench_players")}
                </Typography>
              )}
              {benchPlayers.map((bp) => (
                <Box
                  key={bp.id}
                  sx={{
                    p: 0.5,
                    cursor: "pointer",
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                  onClick={() => onAdd(bp.id)}
                >
                  {getPlayerName(bp.id)}
                </Box>
              ))}
              <Box
                sx={{
                  p: 0.5,
                  cursor: "pointer",
                  color: "error.main",
                  mt: 1,
                }}
                onClick={onCloseMenu}
              >
                {t("common.cancel")}
              </Box>
            </Paper>
          )}
        </TableCell>
        <TableCell align="center">
          <IconButton size="small" onClick={onAddClick} disabled={finished}>
            <PersonAddIcon color={isSubMenuOpen ? "primary" : "inherit"} />
          </IconButton>
        </TableCell>
        <TableCell colSpan={3} align="center">
          <Typography variant="caption" color="text.secondary">
            -
          </Typography>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow hover data-testid="player-row">
      <TableCell>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 4,
              height: 24,
              bgcolor: item.side === "home" ? "home.main" : "away.main",
              borderRadius: 1,
            }}
          />
          <Typography variant="body2" data-testid="player-name">
            {playerName}
          </Typography>
          {!!item.is_goalkeeper && (
            <PanToolIcon
              sx={{ fontSize: 14, color: "secondary.main", ml: 0.5 }}
              titleAccess={t("common.positions.goalkeeper")}
            />
          )}
        </Stack>
        {isSubMenuOpen && (
          <Paper
            elevation={3}
            sx={{
              position: "absolute",
              zIndex: 10,
              mt: 1,
              p: 1,
              maxHeight: 200,
              overflow: "auto",
            }}
          >
            <Typography variant="caption" display="block" sx={{ mb: 1 }}>
              {t("peladas.dashboard.replace_with")}
            </Typography>
            {benchPlayers.map((bp) => (
              <Box
                key={bp.id}
                sx={{
                  p: 0.5,
                  cursor: "pointer",
                  "&:hover": { bgcolor: "action.hover" },
                }}
                onClick={() => onReplace(bp.id)}
              >
                {getPlayerName(bp.id)}
              </Box>
            ))}
            <Box
              sx={{
                p: 0.5,
                cursor: "pointer",
                color: "error.main",
                mt: 1,
              }}
              onClick={onCloseMenu}
            >
              {t("common.cancel")}
            </Box>
          </Paper>
        )}
      </TableCell>
      <TableCell align="center">
        <IconButton size="small" onClick={onSubClick} disabled={finished}>
          <SwapHorizIcon color={isSubMenuOpen ? "primary" : "inherit"} />
        </IconButton>
      </TableCell>
      <TableCell align="center">
        <Stack direction="row" alignItems="center" justifyContent="center">
          <StatInput
            value={stats.goals}
            disabled={finished || updating}
            loading={loadingGoals}
            onChange={(diff) => onStatChange("goal", diff)}
            testIdPrefix="stat-goals"
          />
        </Stack>
      </TableCell>
      <TableCell align="center">
        <Stack direction="row" alignItems="center" justifyContent="center">
          <StatInput
            value={stats.assists}
            disabled={finished || updating}
            loading={loadingAssists}
            onChange={(diff) => onStatChange("assist", diff)}
            testIdPrefix="stat-assists"
          />
        </Stack>
      </TableCell>
      <TableCell align="center">
        <Stack direction="row" alignItems="center" justifyContent="center">
          <StatInput
            value={stats.ownGoals}
            disabled={finished || updating}
            loading={loadingOwnGoals}
            onChange={(diff) => onStatChange("own_goal", diff)}
            testIdPrefix="stat-own-goals"
          />
        </Stack>
      </TableCell>
    </TableRow>
  );
}
