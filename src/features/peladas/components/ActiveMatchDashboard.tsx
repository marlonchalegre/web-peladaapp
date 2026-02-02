import {
  Paper,
  Typography,
  Box,
  Stack,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  alpha,
  Button,
  CircularProgress,
} from "@mui/material";
import { type Dispatch, type SetStateAction, useState } from "react";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz"; // For substitution icon
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import type { Match, TeamPlayer, Player } from "../../../shared/api/endpoints";
import { useTranslation } from "react-i18next";

// Reusing types from MatchDetails if possible, or redefining locally if simple
export type ActionKey = {
  key: string;
  type: "assist" | "goal" | "own_goal";
} | null;
type SelectMenuState = {
  teamId: number;
  forPlayerId?: number;
  type: "replace" | "add";
} | null;

type Props = {
  match: Match;
  homeTeamName: string;
  awayTeamName: string;
  homePlayers: TeamPlayer[];
  awayPlayers: TeamPlayer[];
  orgPlayerIdToUserId: Record<number, number>;
  userIdToName: Record<number, string>;
  statsMap: Record<
    number,
    { goals: number; assists: number; ownGoals: number }
  >;
  benchPlayers: Player[];
  finished: boolean;
  updating: boolean;
  selectMenu: SelectMenuState;
  setSelectMenu: Dispatch<SetStateAction<SelectMenuState>>;
  playersPerTeam?: number | null;
  // Actions
  recordEvent: (
    matchId: number,
    playerId: number,
    type: "assist" | "goal" | "own_goal",
  ) => Promise<void>;
  deleteEventAndRefresh: (
    matchId: number,
    playerId: number,
    type: "assist" | "goal" | "own_goal",
  ) => Promise<void>;
  adjustScore: (
    matchId: number,
    team: "home" | "away",
    delta: 1 | -1,
  ) => Promise<void>;
  replacePlayerOnTeam: (
    teamId: number,
    outPlayerId: number,
    inPlayerId: number,
  ) => Promise<void>;
  addPlayerToTeam: (teamId: number, playerId: number) => Promise<void>;
  onEndMatch: () => Promise<void>;
};

function StatInput({
  value,
  onChange,
  disabled,
  loading = false,
}: {
  value: number;
  onChange: (diff: number) => void;
  disabled: boolean;
  loading?: boolean;
}) {
  return (
    <Box
      sx={(theme) => ({
        display: "flex",
        alignItems: "center",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        bgcolor: alpha(theme.palette.action.active, 0.04),
        width: "fit-content",
        overflow: "hidden",
        position: "relative",
      })}
    >
      <IconButton
        size="small"
        onClick={() => onChange(-1)}
        disabled={disabled || value <= 0 || loading}
        sx={{
          borderRadius: 0,
          p: 0.5,
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <RemoveIcon fontSize="small" />
      </IconButton>

      <Box
        sx={{
          width: 32,
          height: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.paper",
          borderLeft: 1,
          borderRight: 1,
          borderColor: "divider",
        }}
      >
        {loading ? (
          <CircularProgress size={16} />
        ) : (
          <Typography variant="body2" fontWeight="bold">
            {value}
          </Typography>
        )}
      </Box>

      <IconButton
        size="small"
        onClick={() => onChange(1)}
        disabled={disabled || loading}
        sx={{
          borderRadius: 0,
          p: 0.5,
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <AddIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

export default function ActiveMatchDashboard(props: Props) {
  const { t } = useTranslation();
  const {
    match,
    homeTeamName,
    awayTeamName,
    homePlayers,
    awayPlayers,
    orgPlayerIdToUserId,
    userIdToName,
    statsMap,
    benchPlayers,
    finished,
    updating,
    selectMenu,
    setSelectMenu,
    playersPerTeam,
    recordEvent,
    deleteEventAndRefresh,
    adjustScore,
    replacePlayerOnTeam,
    addPlayerToTeam,
    onEndMatch,
  } = props;

  const [loadingStats, setLoadingStats] = useState<Record<string, boolean>>({});

  // Combine players for the list? Or show two sections?
  // The design shows a single list. Let's try to combine but maybe indicate team.
  // Actually, for a single match view, usually you want to see both teams.
  // I'll render a single table with a "Team" column or just grouping.
  // Let's group by team in the table to be clear.

  type DashboardRowItem = {
    player_id: number;
    team_id?: number;
    side: "home" | "away";
    teamId: number;
    isEmpty: boolean;
  };

  const generateTeamList = (
    players: TeamPlayer[],
    side: "home" | "away",
    teamId: number,
  ): DashboardRowItem[] => {
    const list: DashboardRowItem[] = players.map((p) => ({
      ...p,
      side,
      teamId,
      isEmpty: false,
    }));
    if (playersPerTeam && players.length < playersPerTeam) {
      const missing = playersPerTeam - players.length;
      for (let i = 0; i < missing; i++) {
        list.push({
          player_id: -1 * (i + 1 + (side === "home" ? 0 : 100)),
          side,
          teamId,
          isEmpty: true,
        });
      }
    }
    return list;
  };

  const allPlayersInMatch = [
    ...generateTeamList(homePlayers, "home", match.home_team_id),
    ...generateTeamList(awayPlayers, "away", match.away_team_id),
  ];

  const getPlayerName = (pid: number) => {
    const uid = orgPlayerIdToUserId[pid];
    return uid && userIdToName[uid] ? userIdToName[uid] : `Player #${pid}`;
  };

  // Handle substitution selection
  const handleSubClick = (teamId: number, playerId: number) => {
    if (finished) return;
    if (
      selectMenu?.teamId === teamId &&
      selectMenu?.forPlayerId === playerId &&
      selectMenu?.type === "replace"
    ) {
      setSelectMenu(null);
    } else {
      setSelectMenu({ teamId, forPlayerId: playerId, type: "replace" });
    }
  };

  const handleAddClick = (teamId: number, placeholderId: number) => {
    if (finished) return;
    if (
      selectMenu?.teamId === teamId &&
      selectMenu?.forPlayerId === placeholderId &&
      selectMenu?.type === "add"
    ) {
      setSelectMenu(null);
    } else {
      setSelectMenu({ teamId, forPlayerId: placeholderId, type: "add" });
    }
  };

  const handleStatChange = async (
    playerId: number,
    type: "goal" | "assist" | "own_goal",
    diff: number,
    side: "home" | "away",
  ) => {
    if (diff === 0) return;
    const loadingKey = `${playerId}-${type}`;
    if (loadingStats[loadingKey]) return;

    setLoadingStats((prev) => ({ ...prev, [loadingKey]: true }));
    try {
      const absDiff = Math.abs(diff);
      for (let i = 0; i < absDiff; i++) {
        if (diff > 0) {
          await recordEvent(match.id, playerId, type);
          if (type === "goal") {
            await adjustScore(match.id, side, 1);
          } else if (type === "own_goal") {
            await adjustScore(match.id, side === "home" ? "away" : "home", 1);
          }
        } else {
          await deleteEventAndRefresh(match.id, playerId, type);
          if (type === "goal") {
            await adjustScore(match.id, side, -1);
          } else if (type === "own_goal") {
            await adjustScore(match.id, side === "home" ? "away" : "home", -1);
          }
        }
      }
    } finally {
      setLoadingStats((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  return (
    <Stack spacing={2} sx={{ height: "100%" }}>
      {/* Header / Scoreboard */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          bgcolor: "primary.main",
          color: "white",
          borderRadius: 2,
          border: "none",
        }}
      >
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          {t("peladas.matches.history_item_title", {
            sequence: match.sequence,
            teamName: homeTeamName,
          })}
        </Typography>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mt: 1, px: 4 }}
        >
          <Typography variant="h5" fontWeight="bold">
            {homeTeamName}
          </Typography>
          <Typography variant="h3" fontWeight="bold">
            {match.home_score ?? 0} x {match.away_score ?? 0}
          </Typography>
          <Typography variant="h5" fontWeight="bold">
            {awayTeamName}
          </Typography>
        </Stack>
      </Paper>

      {/* Player Data Entry */}
      <Paper
        variant="outlined"
        sx={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ p: 2, pb: 1 }}
        >
          <Box />{" "}
          {/* Spacer to push button to right if we don't have a title, or we can keep title if we want, but user said remove text */}
          {!finished ? (
            <Button
              variant="contained"
              color="secondary"
              onClick={onEndMatch}
              disabled={updating}
            >
              {t("peladas.dashboard.button.end_match")}
            </Button>
          ) : (
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: "bold" }}
            >
              {t("peladas.dashboard.status.finished")}
            </Typography>
          )}
        </Stack>
        <TableContainer sx={{ flex: 1, overflowY: "auto" }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t("common.player")}</TableCell>
                <TableCell align="center">{t("common.sub")}</TableCell>
                <TableCell align="center">{t("common.goals")}</TableCell>
                <TableCell align="center">{t("common.assists")}</TableCell>
                <TableCell align="center">{t("common.own_goals")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allPlayersInMatch.map((tp) => {
                const stats = statsMap[tp.player_id] || {
                  goals: 0,
                  assists: 0,
                  ownGoals: 0,
                };
                const isSubMenuOpen =
                  selectMenu?.teamId === tp.teamId &&
                  selectMenu?.forPlayerId === tp.player_id;

                if (tp.isEmpty) {
                  return (
                    <TableRow key={`${tp.side}-empty-${tp.player_id}`} hover>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box
                            sx={{
                              width: 4,
                              height: 24,
                              bgcolor:
                                tp.side === "home"
                                  ? "primary.main"
                                  : "away.main",
                              borderRadius: 1,
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
                            <Typography
                              variant="caption"
                              display="block"
                              sx={{ mb: 1 }}
                            >
                              {t("peladas.dashboard.add_player")}
                            </Typography>
                            {benchPlayers.length === 0 && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
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
                                onClick={() =>
                                  addPlayerToTeam(tp.teamId, bp.id)
                                }
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
                              onClick={() => setSelectMenu(null)}
                            >
                              {t("common.cancel")}
                            </Box>
                          </Paper>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleAddClick(tp.teamId, tp.player_id)
                          }
                          disabled={finished}
                        >
                          <PersonAddIcon
                            color={isSubMenuOpen ? "primary" : "inherit"}
                          />
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
                  <TableRow key={`${tp.side}-${tp.player_id}`} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box
                          sx={{
                            width: 4,
                            height: 24,
                            bgcolor:
                              tp.side === "home" ? "primary.main" : "away.main",
                            borderRadius: 1,
                          }}
                        />
                        <Typography variant="body2">
                          {getPlayerName(tp.player_id)}
                        </Typography>
                      </Stack>
                      {/* Sub Menu Overlay or Inline */}
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
                          <Typography
                            variant="caption"
                            display="block"
                            sx={{ mb: 1 }}
                          >
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
                              onClick={() =>
                                replacePlayerOnTeam(
                                  tp.teamId,
                                  tp.player_id,
                                  bp.id,
                                )
                              }
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
                            onClick={() => setSelectMenu(null)}
                          >
                            {t("common.cancel")}
                          </Box>
                        </Paper>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleSubClick(tp.teamId, tp.player_id)}
                        disabled={finished}
                      >
                        <SwapHorizIcon
                          color={isSubMenuOpen ? "primary" : "inherit"}
                        />
                      </IconButton>
                    </TableCell>
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <StatInput
                          value={stats.goals}
                          disabled={finished || updating}
                          loading={loadingStats[`${tp.player_id}-goal`]}
                          onChange={(diff) =>
                            handleStatChange(
                              tp.player_id,
                              "goal",
                              diff,
                              tp.side,
                            )
                          }
                        />
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <StatInput
                          value={stats.assists}
                          disabled={finished || updating}
                          loading={loadingStats[`${tp.player_id}-assist`]}
                          onChange={(diff) =>
                            handleStatChange(
                              tp.player_id,
                              "assist",
                              diff,
                              tp.side,
                            )
                          }
                        />
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <StatInput
                          value={stats.ownGoals}
                          disabled={finished || updating}
                          loading={loadingStats[`${tp.player_id}-own_goal`]}
                          onChange={(diff) =>
                            handleStatChange(
                              tp.player_id,
                              "own_goal",
                              diff,
                              tp.side,
                            )
                          }
                        />
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  );
}
