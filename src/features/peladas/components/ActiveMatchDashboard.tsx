import {
  Stack,
  Box,
  Typography,
  Button,
  Grid,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  Chip,
  Avatar,
  useTheme,
} from "@mui/material";
import {
  type Dispatch,
  type SetStateAction,
  useState,
  useMemo,
  useCallback,
} from "react";
import type {
  Match,
  TeamPlayer,
  Player,
  Pelada,
  Transaction,
  OrganizationFinance,
} from "../../../shared/api/endpoints";
import MatchScoreHero from "./MatchScoreHero";
import MatchPlayerCard from "./MatchPlayerCard";
import HistoryIcon from "@mui/icons-material/History";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import { useTranslation } from "react-i18next";
import PlayerSelectMenu from "./PlayerSelectMenu";

export type SelectMenuState = {
  teamId: number;
  forPlayerId?: number;
  type: "replace" | "add";
} | null;

type Props = {
  match: Match;
  pelada: Pelada;
  homeTeamName: string;
  awayTeamName: string;
  homePlayers: TeamPlayer[];
  awayPlayers: TeamPlayer[];
  orgPlayerIdToUserId: Record<number, number>;
  userIdToName: Record<number, string>;
  orgPlayerIdToPlayer: Record<number, Player>;
  statsMap: Record<
    number,
    { goals: number; assists: number; ownGoals: number }
  >;
  benchPlayers: Player[];
  finished: boolean;
  isAdmin: boolean;
  updating: boolean;
  selectMenu: SelectMenuState;
  setSelectMenu: Dispatch<SetStateAction<SelectMenuState>>;
  playersPerTeam?: number | null;
  // Timer Actions
  onStartMatch: (id: number) => Promise<void>;
  onPauseMatch: (id: number) => Promise<void>;
  onResetMatch: (id: number) => Promise<void>;
  onOpenResetConfirm: (type: "session" | "match") => void;
  // Data Actions
  recordEvent: (
    matchId: number,
    playerId: number,
    type: "assist" | "goal" | "own_goal",
    sessionTimeMs?: number,
    matchTimeMs?: number,
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
  onEndMatch: () => void;
  // History Drawer
  matches: Match[];
  onSelectMatch: (id: number) => void;
  teamNameById: Record<number, string>;
  peladaTransactions?: Transaction[];
  organizationFinance?: OrganizationFinance;
  onMarkPaid?: (playerId: number, amount: number) => void;
};

export default function ActiveMatchDashboard(props: Props) {
  const {
    match,
    pelada,
    homeTeamName,
    awayTeamName,
    homePlayers,
    awayPlayers,
    orgPlayerIdToUserId,
    userIdToName,
    orgPlayerIdToPlayer,
    statsMap,
    benchPlayers,
    finished,
    isAdmin,
    updating,
    selectMenu,
    setSelectMenu,
    playersPerTeam,
    onStartMatch,
    onPauseMatch,
    onOpenResetConfirm,
    recordEvent,
    deleteEventAndRefresh,
    adjustScore,
    replacePlayerOnTeam,
    addPlayerToTeam,
    onEndMatch,
    matches,
    onSelectMatch,
    teamNameById,
    peladaTransactions = [],
    organizationFinance,
    onMarkPaid,
  } = props;

  const { t } = useTranslation();
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const effectiveFinished = finished && !isEditing;

  const getPlayerName = useCallback(
    (pid: number) => {
      const uid = orgPlayerIdToUserId[pid];
      return uid && userIdToName[uid] ? userIdToName[uid] : `Player #${pid}`;
    },
    [orgPlayerIdToUserId, userIdToName],
  );

  const nextMatchId = useMemo(() => {
    if (matches.some((m) => m.status === "running")) return null;
    return matches.find((m) => m.status === "scheduled")?.id || null;
  }, [matches]);

  const handleStatChange = (
    playerId: number,
    type: "goal" | "assist" | "own_goal",
    diff: number,
    side: "home" | "away",
  ) => {
    if (diff === 0) return;

    const absDiff = Math.abs(diff);
    for (let i = 0; i < absDiff; i++) {
      if (diff > 0) {
        recordEvent(match.id, playerId, type, undefined, undefined);
        if (type === "goal") {
          adjustScore(match.id, side, 1);
        } else if (type === "own_goal") {
          adjustScore(match.id, side === "home" ? "away" : "home", 1);
        }
      } else {
        deleteEventAndRefresh(match.id, playerId, type);
        if (type === "goal") {
          adjustScore(match.id, side, -1);
        } else if (type === "own_goal") {
          adjustScore(match.id, side === "home" ? "away" : "home", -1);
        }
      }
    }
  };

  const targetCount = useMemo(() => {
    return Math.max(
      Number(playersPerTeam || 0),
      homePlayers.length,
      awayPlayers.length,
    );
  }, [playersPerTeam, homePlayers.length, awayPlayers.length]);

  const generateTeamList = useCallback(
    (players: TeamPlayer[], side: "home" | "away", teamId: number) => {
      // Sort by position then name
      const sortedPlayers = [...players].sort((a, b) => {
        const playerA = orgPlayerIdToPlayer[a.player_id];
        const playerB = orgPlayerIdToPlayer[b.player_id];

        const posA = playerA?.position_id || 99;
        const posB = playerB?.position_id || 99;

        if (posA !== posB) return posA - posB;

        const nameA = getPlayerName(a.player_id).toLowerCase();
        const nameB = getPlayerName(b.player_id).toLowerCase();
        return nameA.localeCompare(nameB);
      });

      const list = sortedPlayers.map((p) => ({
        ...p,
        side,
        teamId,
        isEmpty: false,
      }));
      if (targetCount > 0 && players.length < targetCount) {
        const missing = targetCount - players.length;
        for (let i = 0; i < missing; i++) {
          list.push({
            player_id: -1 * (i + 1 + (side === "home" ? 0 : 100)),
            team_id: teamId,
            is_goalkeeper: false,
            side,
            teamId,
            isEmpty: true,
          });
        }
      }
      return list;
    },
    [orgPlayerIdToPlayer, getPlayerName, targetCount],
  );

  const homeList = useMemo(
    () => generateTeamList(homePlayers, "home", match.home_team_id),
    [homePlayers, match.home_team_id, generateTeamList],
  );
  const awayList = useMemo(
    () => generateTeamList(awayPlayers, "away", match.away_team_id),
    [awayPlayers, match.away_team_id, generateTeamList],
  );

  return (
    <Box sx={{ pb: 8 }}>
      <Stack spacing={2}>
        {/* Top Actions Row */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Button
              onClick={() => setHistoryOpen(true)}
              size="small"
              variant="outlined"
              startIcon={<HistoryIcon />}
              data-testid="toggle-history-drawer"
              sx={{
                textTransform: "none",
                borderRadius: 1.5,
                fontWeight: "bold",
                minWidth: "auto",
                px: 1,
              }}
            >
              {t("peladas.dashboard.button.history")}
            </Button>
          </Stack>

          {isAdmin && finished && (
            <Button
              startIcon={isEditing ? <CheckCircleIcon /> : <EditIcon />}
              color={isEditing ? "success" : "warning"}
              variant={isEditing ? "contained" : "outlined"}
              onClick={() => setIsEditing(!isEditing)}
              size="small"
              sx={{ textTransform: "none", borderRadius: 2 }}
              data-testid={
                isEditing ? "finish-editing-button" : "edit-match-button"
              }
            >
              {isEditing
                ? t("peladas.dashboard.button.finish_editing")
                : t("peladas.dashboard.button.edit_match")}
            </Button>
          )}
        </Stack>

        {/* Hero Scoreboard */}
        <MatchScoreHero
          match={match}
          pelada={pelada}
          homeTeamName={homeTeamName}
          awayTeamName={awayTeamName}
          isAdmin={isAdmin}
          onStartMatch={onStartMatch}
          onPauseMatch={onPauseMatch}
          onOpenResetConfirm={onOpenResetConfirm}
          onEndMatch={onEndMatch}
          updating={updating}
        />

        {/* Players Section */}
        <Grid container spacing={2}>
          {/* Home Team */}
          <Grid size={{ xs: 12, sm: 6 }} data-testid="home-team-match-section">
            <Box
              sx={{
                mb: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
                pl: 1,
              }}
            >
              <Box
                sx={{
                  width: 4,
                  height: 16,
                  bgcolor: theme.palette.home.main,
                  borderRadius: 1,
                }}
              />
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                color="text.secondary"
              >
                {homeTeamName.toUpperCase()}
              </Typography>
            </Box>
            <Stack spacing={1}>
              {homeList.map((p) => {
                const isPaid = peladaTransactions.some(
                  (t: Transaction) =>
                    t.player_id === p.player_id &&
                    t.type === "income" &&
                    t.category === "diarista_fee" &&
                    t.status === "paid",
                );
                return (
                  <MatchPlayerCard
                    key={p.player_id}
                    player={p}
                    playerName={getPlayerName(p.player_id)}
                    playerData={orgPlayerIdToPlayer[p.player_id]}
                    stats={
                      statsMap[p.player_id] || {
                        goals: 0,
                        assists: 0,
                        ownGoals: 0,
                      }
                    }
                    finished={effectiveFinished}
                    isAdmin={isAdmin}
                    onStatChange={(type, diff, side) =>
                      handleStatChange(p.player_id, type, diff, side)
                    }
                    onSubClick={() =>
                      setSelectMenu({
                        teamId: p.teamId,
                        forPlayerId: p.player_id,
                        type: p.isEmpty ? "add" : "replace",
                      })
                    }
                    isPaid={isPaid}
                    onMarkPaid={
                      onMarkPaid
                        ? () =>
                            onMarkPaid(
                              p.player_id,
                              organizationFinance?.diarista_price || 0,
                            )
                        : undefined
                    }
                  />
                );
              })}
            </Stack>
          </Grid>

          {/* Away Team */}
          <Grid size={{ xs: 12, sm: 6 }} data-testid="away-team-match-section">
            <Box
              sx={{
                mb: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
                pl: 1,
              }}
            >
              <Box
                sx={{
                  width: 4,
                  height: 16,
                  bgcolor: theme.palette.away.main,
                  borderRadius: 1,
                }}
              />
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                color="text.secondary"
              >
                {awayTeamName.toUpperCase()}
              </Typography>
            </Box>
            <Stack spacing={1}>
              {awayList.map((p) => {
                const isPaid = peladaTransactions.some(
                  (t: Transaction) =>
                    t.player_id === p.player_id &&
                    t.type === "income" &&
                    t.category === "diarista_fee" &&
                    t.status === "paid",
                );
                return (
                  <MatchPlayerCard
                    key={p.player_id}
                    player={p}
                    playerName={getPlayerName(p.player_id)}
                    playerData={orgPlayerIdToPlayer[p.player_id]}
                    stats={
                      statsMap[p.player_id] || {
                        goals: 0,
                        assists: 0,
                        ownGoals: 0,
                      }
                    }
                    finished={effectiveFinished}
                    isAdmin={isAdmin}
                    onStatChange={(type, diff, side) =>
                      handleStatChange(p.player_id, type, diff, side)
                    }
                    onSubClick={() =>
                      setSelectMenu({
                        teamId: p.teamId,
                        forPlayerId: p.player_id,
                        type: p.isEmpty ? "add" : "replace",
                      })
                    }
                    isPaid={isPaid}
                    onMarkPaid={
                      onMarkPaid
                        ? () =>
                            onMarkPaid(
                              p.player_id,
                              organizationFinance?.diarista_price || 0,
                            )
                        : undefined
                    }
                  />
                );
              })}
            </Stack>
          </Grid>
        </Grid>
      </Stack>

      {/* Substitute Selector */}
      {selectMenu && (
        <PlayerSelectMenu
          teamId={selectMenu.teamId}
          benchPlayers={benchPlayers}
          onClose={() => setSelectMenu(null)}
          onSelect={(pid) => {
            if (selectMenu.type === "add") {
              addPlayerToTeam(selectMenu.teamId, pid);
            } else {
              replacePlayerOnTeam(
                selectMenu.teamId,
                selectMenu.forPlayerId!,
                pid,
              );
            }
          }}
          getPlayerName={getPlayerName}
        />
      )}

      {/* History Drawer */}
      <Drawer
        anchor="left"
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        data-testid="history-drawer"
      >
        <Box sx={{ width: 320, p: 2 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, px: 1 }}>
            {t("peladas.matches.history_title")}
          </Typography>
          <List sx={{ px: 0 }}>
            {matches.map((m) => {
              const isSelected = match.id === m.id;
              const isNext = m.id === nextMatchId;
              const status = isNext ? "next" : m.status;

              const statusColor =
                status === "finished"
                  ? "success"
                  : status === "running"
                    ? "primary"
                    : status === "next"
                      ? "info"
                      : "default";

              return (
                <ListItem key={m.id} disablePadding sx={{ mb: 1.5 }}>
                  <ListItemButton
                    selected={isSelected}
                    onClick={() => {
                      onSelectMatch(m.id);
                      setHistoryOpen(false);
                    }}
                    sx={{
                      borderRadius: 3,
                      border: "1px solid",
                      borderColor: isSelected
                        ? "primary.main"
                        : isNext
                          ? "info.light"
                          : "divider",
                      bgcolor: isSelected
                        ? "primary.lighter"
                        : isNext
                          ? "info.lighter"
                          : "transparent",
                      flexDirection: "column",
                      alignItems: "stretch",
                      gap: 1,
                      p: 1.5,
                      "&:hover": {
                        bgcolor: isSelected
                          ? "primary.lighter"
                          : isNext
                            ? "info.lighter"
                            : "action.hover",
                      },
                    }}
                    data-testid={`match-history-item-${m.sequence}`}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 0.5,
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            fontSize: "0.75rem",
                            bgcolor: isSelected
                              ? "primary.main"
                              : isNext
                                ? "info.main"
                                : "text.secondary",
                            fontWeight: "bold",
                          }}
                        >
                          {m.sequence}
                        </Avatar>
                        <Typography
                          variant="caption"
                          fontWeight="bold"
                          color={
                            isSelected
                              ? "primary.main"
                              : isNext
                                ? "info.main"
                                : "text.secondary"
                          }
                        >
                          {t("peladas.matches.match_label", {
                            seq: m.sequence,
                          }).toUpperCase()}
                        </Typography>
                      </Stack>
                      <Chip
                        label={t(`peladas.matches.status.${status}`)}
                        size="small"
                        color={statusColor}
                        variant={
                          status === "running" || status === "next"
                            ? "filled"
                            : "outlined"
                        }
                        sx={{
                          height: 20,
                          fontSize: "0.65rem",
                          fontWeight: "bold",
                          textTransform: "uppercase",
                        }}
                      />
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          flex: 1,
                          textAlign: "right",
                          fontWeight: m.home_score > m.away_score ? 800 : 500,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {teamNameById[m.home_team_id] || "Home"}
                      </Typography>

                      <Box
                        sx={{
                          px: 1.5,
                          py: 0.25,
                          borderRadius: 1,
                          bgcolor: "action.selected",
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          minWidth: 60,
                          justifyContent: "center",
                        }}
                      >
                        <Typography variant="body2" fontWeight="900">
                          {m.home_score}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.disabled"
                          fontWeight="bold"
                        >
                          x
                        </Typography>
                        <Typography variant="body2" fontWeight="900">
                          {m.away_score}
                        </Typography>
                      </Box>

                      <Typography
                        variant="body2"
                        sx={{
                          flex: 1,
                          textAlign: "left",
                          fontWeight: m.away_score > m.home_score ? 800 : 500,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {teamNameById[m.away_team_id] || "Away"}
                      </Typography>
                    </Box>
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>
    </Box>
  );
}
