import {
  Paper,
  Stack,
  Box,
  Button,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import React, { type Dispatch, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { type TeamPlayer, type Player } from "../../../shared/api/endpoints";
import MatchPlayerRow, { type DashboardRowItem } from "./MatchPlayerRow";

export type SelectMenuState = {
  teamId: number;
  forPlayerId?: number;
  type: "replace" | "add";
} | null;

interface MatchControlTableProps {
  homePlayers: TeamPlayer[];
  awayPlayers: TeamPlayer[];
  homeTeamId: number;
  awayTeamId: number;
  orgPlayerIdToUserId: Record<number, number>;
  userIdToName: Record<number, string>;
  statsMap: Record<
    number,
    { goals: number; assists: number; ownGoals: number }
  >;
  benchPlayers: Player[];
  finished: boolean;
  isMatchFinished: boolean;
  isPeladaClosed: boolean;
  isEditing: boolean;
  onToggleEdit: () => void;
  updating: boolean;
  selectMenu: SelectMenuState;
  setSelectMenu: Dispatch<SetStateAction<SelectMenuState>>;
  playersPerTeam?: number | null;
  loadingStats: Record<string, boolean>;
  onStatChange: (
    playerId: number,
    type: "goal" | "assist" | "own_goal",
    diff: number,
    side: "home" | "away",
  ) => void;
  onReplacePlayer: (teamId: number, outId: number, inId: number) => void;
  onAddPlayer: (teamId: number, playerId: number) => void;
  onEndMatch: () => void;
}

export default function MatchControlTable({
  homePlayers,
  awayPlayers,
  homeTeamId,
  awayTeamId,
  orgPlayerIdToUserId,
  userIdToName,
  statsMap,
  benchPlayers,
  finished,
  isMatchFinished,
  isPeladaClosed,
  isEditing,
  onToggleEdit,
  updating,
  selectMenu,
  setSelectMenu,
  playersPerTeam,
  loadingStats,
  onStatChange,
  onReplacePlayer,
  onAddPlayer,
  onEndMatch,
}: MatchControlTableProps) {
  const { t } = useTranslation();

  const generateTeamList = (
    players: TeamPlayer[],
    side: "home" | "away",
    teamId: number,
  ): DashboardRowItem[] => {
    // Sort players: Goalkeepers first
    const sortedPlayers = [...players].sort((a, b) => {
      if (a.is_goalkeeper && !b.is_goalkeeper) return -1;
      if (!a.is_goalkeeper && b.is_goalkeeper) return 1;
      return 0;
    });

    const list: DashboardRowItem[] = sortedPlayers.map((p) => ({
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
    ...generateTeamList(homePlayers, "home", homeTeamId),
    ...generateTeamList(awayPlayers, "away", awayTeamId),
  ];

  const getPlayerName = (pid: number) => {
    const uid = orgPlayerIdToUserId[pid];
    return uid && userIdToName[uid] ? userIdToName[uid] : `Player #${pid}`;
  };

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

  return (
    <Paper
      variant="outlined"
      sx={{
        flex: 1,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        ...(isEditing && { borderColor: "warning.main", borderWidth: 2 }),
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ p: 2, pb: 1 }}
      >
        <Box />
        {!isMatchFinished ? (
          <Button
            variant="contained"
            color="secondary"
            onClick={onEndMatch}
            disabled={updating}
            data-testid="end-match-button"
          >
            {t("peladas.dashboard.button.end_match")}
          </Button>
        ) : (
          <Stack direction="row" spacing={2} alignItems="center">
            {isEditing ? (
              <Button
                variant="contained"
                color="warning"
                onClick={onToggleEdit}
                data-testid="finish-editing-button"
              >
                {t("peladas.dashboard.button.finish_editing")}
              </Button>
            ) : (
              <>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ fontWeight: "bold" }}
                  data-testid="match-status-text"
                >
                  {t("peladas.dashboard.status.finished")}
                </Typography>
                {!isPeladaClosed && (
                  <Button
                    variant="outlined"
                    color="warning"
                    size="small"
                    onClick={onToggleEdit}
                    data-testid="edit-match-button"
                  >
                    {t("peladas.dashboard.button.edit_match")}
                  </Button>
                )}
              </>
            )}
          </Stack>
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
            {allPlayersInMatch.map((tp, index) => {
              const stats = statsMap[tp.player_id] || {
                goals: 0,
                assists: 0,
                ownGoals: 0,
              };
              const isSubMenuOpen =
                selectMenu?.teamId === tp.teamId &&
                selectMenu?.forPlayerId === tp.player_id;

              const isFirstAway =
                tp.side === "away" &&
                (index === 0 || allPlayersInMatch[index - 1].side === "home");

              return (
                <React.Fragment key={`${tp.side}-${tp.player_id}`}>
                  {isFirstAway && index > 0 && (
                    <TableRow sx={{ bgcolor: "action.hover" }}>
                      <TableCell
                        colSpan={5}
                        sx={{ py: 0.5, textAlign: "center" }}
                      >
                        <Typography
                          variant="overline"
                          color="text.secondary"
                          sx={{ fontWeight: "bold", letterSpacing: 2 }}
                        >
                          VS
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  <MatchPlayerRow
                    item={tp}
                    stats={stats}
                    playerName={getPlayerName(tp.player_id)}
                    isSubMenuOpen={isSubMenuOpen}
                    finished={finished}
                    updating={updating}
                    loadingGoals={loadingStats[`${tp.player_id}-goal`]}
                    loadingAssists={loadingStats[`${tp.player_id}-assist`]}
                    loadingOwnGoals={loadingStats[`${tp.player_id}-own_goal`]}
                    benchPlayers={benchPlayers}
                    onStatChange={(type, diff) =>
                      onStatChange(tp.player_id, type, diff, tp.side)
                    }
                    onSubClick={() => handleSubClick(tp.teamId, tp.player_id)}
                    onAddClick={() => handleAddClick(tp.teamId, tp.player_id)}
                    onCloseMenu={() => setSelectMenu(null)}
                    onReplace={(inId) =>
                      onReplacePlayer(tp.teamId, tp.player_id, inId)
                    }
                    onAdd={(inId) => onAddPlayer(tp.teamId, inId)}
                    getPlayerName={getPlayerName}
                  />
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
