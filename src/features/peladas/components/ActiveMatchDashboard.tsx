import { useState, useMemo, useCallback } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  Portal,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  alpha,
} from "@mui/material";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import { useTranslation } from "react-i18next";
import type {
  Match,
  TeamPlayer,
  Player,
  Pelada,
  MatchEvent,
  MatchEventType,
} from "../../../shared/api/endpoints";
import MatchScoreHero from "./MatchScoreHero";
import MatchPlayerCard from "./MatchPlayerCard";
import PlayerSelectMenu from "./PlayerSelectMenu";
import { POSITION_ORDER, resolvePlayerName } from "../utils/playerUtils";
import type { StandingRow } from "../utils/standingsUtils";
import { usePeladaTimer } from "../hooks/usePeladaTimer";

export type SelectMenuState = {
  teamId: string;
  forPlayerId?: string;
  type: "replace" | "add";
} | null;

type GoalSheetState = {
  side: "home" | "away";
  step: "scorer" | "assist" | "own_goal";
  scorerId?: string;
} | null;

type EventSheetState = {
  step: "type" | "player";
  type?: MatchEventType;
} | null;

type Props = {
  match: Match;
  pelada: Pelada;
  homeTeamName: string;
  awayTeamName: string;
  homePlayers: TeamPlayer[];
  awayPlayers: TeamPlayer[];
  orgPlayerIdToUserId: Record<string, string>;
  userIdToName: Record<string, string>;
  orgPlayerIdToPlayer: Record<string, Player>;
  statsMap: Record<
    string,
    { goals: number; assists: number; ownGoals: number }
  >;
  benchPlayers: Player[];
  finished: boolean;
  isAdmin: boolean;
  updating: boolean;
  selectMenu: SelectMenuState;
  setSelectMenu: React.Dispatch<React.SetStateAction<SelectMenuState>>;
  playersPerTeam?: number | null;
  standings: StandingRow[];
  matchEvents: MatchEvent[];
  // Timer actions
  onStartMatch: (id: string) => Promise<void>;
  onPauseMatch: (id: string) => Promise<void>;
  onOpenResetConfirm: (type: "session" | "match") => void;
  recordEvent: (
    matchId: string,
    playerId: string,
    type: MatchEventType,
    sessionTimeMs?: number,
    matchTimeMs?: number,
    assistantId?: string,
    teamId?: string,
  ) => Promise<void>;
  deleteEventAndRefresh: (
    matchId: string,
    playerId: string,
    type: MatchEventType,
    eventId?: string,
  ) => Promise<void>;
  adjustScore?: (
    matchId: string,
    team: "home" | "away",
    delta: 1 | -1,
  ) => Promise<void>;
  replacePlayerOnTeam: (
    teamId: string,
    outPlayerId: string,
    inPlayerId: string,
  ) => Promise<void>;
  addPlayerToTeam: (teamId: string, playerId: string) => Promise<void>;
  onEndMatch: () => void;
  // History
  matches: Match[];
  onSelectMatch: (id: string) => void;
  teamNameById: Record<string, string>;
  // Tab navigation
  onNavigateToTimeline?: () => void;
  onNavigateToStandings?: () => void;
  onNavigateToSupportTab?: () => void;
  playerTeamMap?: Record<string, string>;
};

const bottomSheetPaperSx = {
  borderRadius: { xs: "24px 24px 0 0", sm: "20px" },
  bgcolor: "background.paper",
  m: 0,
  width: "100%",
  maxWidth: { xs: "100%", sm: "460px" },
  position: { xs: "fixed", sm: "relative" } as const,
  bottom: { xs: 0, sm: "auto" },
  left: { xs: 0, sm: "auto" },
  right: { xs: 0, sm: "auto" },
  boxShadow: {
    xs: "0 -8px 30px rgba(0,0,0,0.2)",
    sm: "0 20px 50px rgba(0,0,0,0.3)",
  },
};

const EVENT_TYPES: {
  type: MatchEventType;
  label: string;
}[] = [
  { type: "drible", label: "Drible" },
  { type: "chute", label: "Chute" },
  { type: "falta", label: "Falta" },
  { type: "furada", label: "Furada" },
  { type: "defesa", label: "Defesaça" },
  { type: "vish", label: "Vish" },
];

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
    standings,
    onStartMatch,
    onPauseMatch,
    onOpenResetConfirm,
    recordEvent,
    adjustScore,
    replacePlayerOnTeam,
    addPlayerToTeam,
    onEndMatch,
    matches,
    onSelectMatch,
    teamNameById,
    onNavigateToTimeline,
    onNavigateToStandings,
    onNavigateToSupportTab,
    playerTeamMap,
  } = props;

  const { t } = useTranslation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [historyOpen, setHistoryOpen] = useState(false);

  const [goalSheet, setGoalSheet] = useState<GoalSheetState>(null);
  const [eventSheet, setEventSheet] = useState<EventSheetState>(null);

  const [isEditing, setIsEditing] = useState(false);
  const finishedMatch = (match.status || "").toLowerCase() === "finished";
  const isMatchFinished = finished || finishedMatch;
  const effectiveFinished = isEditing ? false : isMatchFinished;

  const matchTimer = usePeladaTimer(
    match.timer_started_at,
    match.timer_accumulated_ms,
    match.timer_status,
    finishedMatch,
    () => onStartMatch(match.id),
    () => onPauseMatch(match.id),
  );

  const sessionTimer = usePeladaTimer(
    pelada.timer_started_at,
    pelada.timer_accumulated_ms,
    pelada.timer_status,
    (pelada.status || "").toLowerCase() === "closed",
  );

  const clockLabel = matchTimer.formattedTime.substring(3);
  const sessionLabel = `${t("peladas.dashboard.live_state.session", "SESSÃO")} ${sessionTimer.formattedTime.substring(0, 5)}`;

  const getPlayerName = useCallback(
    (pid: string) =>
      resolvePlayerName(
        pid,
        orgPlayerIdToPlayer,
        orgPlayerIdToUserId,
        userIdToName,
        `Player #${pid.slice(0, 6)}`,
      ),
    [orgPlayerIdToPlayer, orgPlayerIdToUserId, userIdToName],
  );

  const canRecord = isAdmin && !effectiveFinished;

  /* ---------- lineup ---------- */

  const targetCount = useMemo(() => {
    let base = Number(playersPerTeam || 0);
    if (pelada.fixed_goalkeepers && base > 0) {
      base += 1;
    }
    return Math.max(base, homePlayers.length, awayPlayers.length);
  }, [
    playersPerTeam,
    pelada.fixed_goalkeepers,
    homePlayers.length,
    awayPlayers.length,
  ]);

  const generateTeamList = useCallback(
    (players: TeamPlayer[], side: "home" | "away", teamId: string) => {
      const sortedPlayers = [...players].sort((a, b) => {
        const playerA = orgPlayerIdToPlayer[a.player_id];
        const playerB = orgPlayerIdToPlayer[b.player_id];

        if (a.is_goalkeeper && !b.is_goalkeeper) return -1;
        if (!a.is_goalkeeper && b.is_goalkeeper) return 1;

        const getPosStr = (p?: Player) =>
          (p?.position || p?.user_position || "").toLowerCase();

        const posA = POSITION_ORDER[getPosStr(playerA)] ?? 99;
        const posB = POSITION_ORDER[getPosStr(playerB)] ?? 99;

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
            player_id: String(-1 * (i + 1 + (side === "home" ? 0 : 100))),
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

  const allOnFieldPlayers = useMemo(
    () => [...homeList, ...awayList].filter((p) => !p.isEmpty),
    [homeList, awayList],
  );

  const nextMatch = useMemo(() => {
    return (
      matches
        .filter((m) => m.status === "scheduled" && m.sequence > match.sequence)
        .sort((a, b) => a.sequence - b.sequence)[0] || null
    );
  }, [matches, match.sequence]);

  /* ---------- live standings (all teams) ---------- */

  const liveMatchTable = useMemo(() => {
    return standings.map((row, index) => {
      const games = row.wins + row.draws + row.losses;
      const v = row.wins;
      const e = row.draws;
      const d = row.losses;
      const sg = row.goalsFor - row.goalsAgainst;
      const p = row.points ?? v * 3 + e;

      let color: string;
      if (row.teamId === match.home_team_id) {
        color = "home.main";
      } else if (row.teamId === match.away_team_id) {
        color = "away.main";
      } else {
        const palette = [
          "primary.main",
          "matchEvents.vish",
          "gold.main",
          "matchEvents.chute",
        ];
        color = palette[index % palette.length];
      }

      const teamName =
        row.teamId === match.home_team_id
          ? homeTeamName || row.name
          : row.teamId === match.away_team_id
            ? awayTeamName || row.name
            : row.name;

      return {
        teamId: row.teamId,
        position: index + 1,
        name: teamName,
        color,
        record: `${games}J · ${v}V ${e}E ${d}D`,
        sgLabel: (sg > 0 ? "+" : "") + sg,
        p,
        isPlaying:
          row.teamId === match.home_team_id ||
          row.teamId === match.away_team_id,
      };
    });
  }, [
    standings,
    match.home_team_id,
    match.away_team_id,
    homeTeamName,
    awayTeamName,
  ]);

  /* ---------- flows ---------- */

  const goalSideList = goalSheet?.side === "home" ? homeList : awayList;
  const goalSideName = goalSheet?.side === "home" ? homeTeamName : awayTeamName;
  const defendingSideList = goalSheet?.side === "home" ? awayList : homeList;
  const defendingSideName =
    goalSheet?.side === "home" ? awayTeamName : homeTeamName;

  const assistantOptions = useMemo(() => {
    if (!goalSheet || goalSheet.step !== "assist" || !goalSheet.scorerId)
      return [];
    const list = goalSheet.side === "home" ? homeList : awayList;
    return list.filter((p) => p.player_id !== goalSheet.scorerId);
  }, [goalSheet, homeList, awayList]);

  const commitGoal = async (assistantId?: string) => {
    if (!goalSheet?.scorerId) return;
    const { scorerId, side } = goalSheet;
    setGoalSheet(null);
    const scorerTeamId =
      side === "home" ? match.home_team_id : match.away_team_id;
    await recordEvent(
      match.id,
      scorerId,
      "goal",
      undefined,
      undefined,
      assistantId,
      scorerTeamId,
    );
  };

  const commitOwnGoal = async (playerId: string) => {
    if (!goalSheet) return;
    const side = goalSheet.side;
    const defendingTeamId =
      side === "home" ? match.away_team_id : match.home_team_id;
    setGoalSheet(null);
    if (!defendingTeamId) return;

    await recordEvent(
      match.id,
      playerId,
      "own_goal",
      undefined,
      undefined,
      undefined,
      defendingTeamId,
    );
  };

  const handleSkipOwnGoal = async () => {
    if (!goalSheet) return;
    const side = goalSheet.side;
    setGoalSheet(null);
    if (adjustScore) {
      await adjustScore(match.id, side, 1);
    }
  };

  const handleConfirmEvent = async (playerId: string) => {
    if (!eventSheet?.type) return;
    setEventSheet(null);
    await recordEvent(
      match.id,
      playerId,
      eventSheet.type,
      undefined,
      undefined,
      undefined,
      playerTeamMap?.[playerId],
    );
  };

  /* ---------- sections ---------- */

  const teamSection = (side: "home" | "away") => {
    const list = side === "home" ? homeList : awayList;
    const name = side === "home" ? homeTeamName : awayTeamName;
    const color = side === "home" ? "home.main" : "away.main";
    return (
      <Box data-testid={`${side}-team-match-section`} sx={{ minWidth: 0 }}>
        {isDesktop ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              mb: "8px",
            }}
          >
            <Box
              sx={{
                width: 3,
                height: 14,
                borderRadius: "2px",
                bgcolor: color,
                flexShrink: 0,
              }}
            />
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "10px",
                lineHeight: 1,
                letterSpacing: "0.14em",
                color: "text.secondary",
              }}
            >
              {name.toUpperCase()}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              mt: side === "away" ? "16px" : 0,
              mb: "9px",
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: color,
                flexShrink: 0,
              }}
            />
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "10px",
                lineHeight: 1,
                letterSpacing: "0.12em",
                color: color,
              }}
            >
              {name.toUpperCase()}
            </Typography>
          </Box>
        )}
        <Stack spacing={isDesktop ? "8px" : "7px"}>
          {list.map((p) => (
            <MatchPlayerCard
              key={p.player_id}
              player={p}
              playerName={getPlayerName(p.player_id)}
              playerData={orgPlayerIdToPlayer[p.player_id]}
              stats={
                statsMap[p.player_id] || { goals: 0, assists: 0, ownGoals: 0 }
              }
              finished={effectiveFinished}
              isAdmin={isAdmin}
              variant={isDesktop ? "desktop" : "mobile"}
              onSubClick={() =>
                setSelectMenu({
                  teamId: p.teamId,
                  forPlayerId: p.player_id,
                  type: p.isEmpty ? "add" : "replace",
                })
              }
            />
          ))}
        </Stack>
      </Box>
    );
  };

  const liveStandingsCard = (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: (theme) => `1.5px solid ${theme.palette.divider}`,
        borderRadius: "13px",
        px: "13px",
        py: "12px",
      }}
      data-testid="live-standings-card"
    >
      <Typography
        sx={{
          fontFamily: "Archivo, sans-serif",
          fontWeight: 800,
          fontSize: "9.5px",
          lineHeight: 1,
          letterSpacing: "0.14em",
          color: "text.secondary",
          mb: "9px",
        }}
      >
        {t(
          "peladas.dashboard.live_state.live_standings",
          "CLASSIFICAÇÃO AO VIVO",
        )}
      </Typography>
      {liveMatchTable.map((row) => (
        <Box
          key={row.teamId}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            py: "7px",
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "11px",
              lineHeight: 1,
              color: "text.secondary",
              width: "18px",
              flexShrink: 0,
            }}
          >
            {row.position}º
          </Typography>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: row.color,
              flexShrink: 0,
            }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              noWrap
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: row.isPlaying ? 900 : 700,
                fontSize: "12px",
                lineHeight: 1,
                color: "text.primary",
                textTransform: "uppercase",
              }}
            >
              {row.name}
            </Typography>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontSize: "9.5px",
                fontWeight: 600,
                lineHeight: 1,
                color: "text.secondary",
                mt: "3px",
              }}
            >
              {row.record} · SG {row.sgLabel}
            </Typography>
          </Box>
          <Typography
            sx={{
              fontFamily: "'Anton', sans-serif",
              fontSize: "20px",
              lineHeight: 1,
              color: "text.primary",
            }}
          >
            {row.p}
          </Typography>
        </Box>
      ))}
    </Box>
  );

  const nextMatchSection = () => {
    if (!nextMatch) return null;
    const homeName = teamNameById[nextMatch.home_team_id] || "TIME 3";
    const awayName = teamNameById[nextMatch.away_team_id] || "TIME 4";
    if (isDesktop) {
      return (
        <Box
          sx={{
            p: "12px 14px",
            bgcolor: "background.paper",
            border: (theme) => `1.5px solid ${theme.palette.divider}`,
            borderRadius: "13px",
          }}
          data-testid="next-match-card"
        >
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "9.5px",
              lineHeight: 1,
              letterSpacing: "0.14em",
              color: "text.secondary",
            }}
          >
            {t("peladas.dashboard.summary.next_up", "A SEGUIR")}
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              mt: "8px",
            }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: "home.main",
                border: "1px solid rgba(0,0,0,0.15)",
                flexShrink: 0,
              }}
            />
            <Typography
              noWrap
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "13px",
                lineHeight: 1,
                color: "text.primary",
              }}
            >
              {homeName.toUpperCase()}
            </Typography>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "10px",
                lineHeight: 1,
                letterSpacing: "0.08em",
                color: "text.secondary",
              }}
            >
              LARANJA
            </Typography>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 600,
                fontSize: "11px",
                lineHeight: 1,
                color: "text.secondary",
              }}
            >
              vs
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              mt: "6px",
            }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: "away.main",
                border: "1px solid rgba(0,0,0,0.15)",
                flexShrink: 0,
              }}
            />
            <Typography
              noWrap
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "13px",
                lineHeight: 1,
                color: "text.primary",
              }}
            >
              {awayName.toUpperCase()}
            </Typography>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "10px",
                lineHeight: 1,
                letterSpacing: "0.08em",
                color: "text.secondary",
              }}
            >
              AZUL
            </Typography>
          </Box>
        </Box>
      );
    }
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          mt: 0,
          mb: "8px",
          p: "12px 14px",
          bgcolor: "action.hover",
          borderRadius: "13px",
        }}
        data-testid="next-match-card"
      >
        <Typography
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 800,
            fontSize: "10px",
            lineHeight: 1,
            letterSpacing: "0.14em",
            color: "text.secondary",
          }}
        >
          {t("peladas.dashboard.summary.next_up", "A SEGUIR")}
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            flex: 1,
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              bgcolor: "home.main",
              border: "1px solid rgba(0,0,0,0.15)",
              flexShrink: 0,
            }}
          />
          <Typography
            noWrap
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "12.5px",
              lineHeight: 1,
              color: "text.primary",
            }}
          >
            {homeName}
          </Typography>
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 600,
              fontSize: "11px",
              lineHeight: 1,
              color: "text.secondary",
            }}
          >
            vs
          </Typography>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              bgcolor: "away.main",
              border: "1px solid rgba(0,0,0,0.15)",
              flexShrink: 0,
            }}
          />
          <Typography
            noWrap
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "12.5px",
              lineHeight: 1,
              color: "text.primary",
            }}
          >
            {awayName}
          </Typography>
        </Box>
      </Box>
    );
  };

  const tabButtons = (withEnd: boolean) => (
    <Box sx={{ display: "flex", gap: "8px", mt: withEnd ? "18px" : 0 }}>
      {onNavigateToStandings && (
        <Button
          onClick={onNavigateToStandings}
          data-testid="go-to-standings-button"
          sx={{
            flex: 1,
            border: (theme) => `1.5px solid ${theme.palette.divider}`,
            bgcolor: "background.paper",
            color: "text.secondary",
            borderRadius: "11px",
            py: withEnd ? "12px" : "11px",
            fontFamily: "Archivo, sans-serif",
            fontWeight: 800,
            fontSize: withEnd ? "11px" : "10.5px",
            lineHeight: 1,
            letterSpacing: "0.05em",
            "&:hover": { borderColor: "text.primary", color: "text.primary" },
          }}
        >
          {t("peladas.dashboard.live_state.table_button", "TABELA")}
        </Button>
      )}
      {onNavigateToTimeline && (
        <Button
          onClick={onNavigateToTimeline}
          data-testid="go-to-timeline-button"
          sx={{
            flex: 1,
            border: (theme) => `1.5px solid ${theme.palette.divider}`,
            bgcolor: "background.paper",
            color: "text.secondary",
            borderRadius: "11px",
            py: withEnd ? "12px" : "11px",
            fontFamily: "Archivo, sans-serif",
            fontWeight: 800,
            fontSize: withEnd ? "11px" : "10.5px",
            lineHeight: 1,
            letterSpacing: "0.05em",
            "&:hover": { borderColor: "text.primary", color: "text.primary" },
          }}
        >
          {t("peladas.dashboard.live_state.sumula_button", "SÚMULA")}
        </Button>
      )}
      {withEnd && isAdmin && !effectiveFinished && (
        <Button
          onClick={onEndMatch}
          data-testid="end-match-button"
          sx={{
            flex: 1,
            border: (theme) =>
              `1.5px solid ${theme.palette.mode === "dark" ? theme.palette.secondary.dark : theme.palette.secondary.light}`,
            bgcolor: "background.paper",
            color: "secondary.main",
            borderRadius: "11px",
            py: "12px",
            fontFamily: "Archivo, sans-serif",
            fontWeight: 800,
            fontSize: "11px",
            lineHeight: 1,
            letterSpacing: "0.05em",
            "&:hover": {
              borderColor: "secondary.main",
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(224, 108, 80, 0.12)"
                  : "secondary.light",
            },
          }}
        >
          {t("peladas.dashboard.live_state.end_match", "ENCERRAR")}
        </Button>
      )}
    </Box>
  );

  const supportRow = () => {
    const cam = match.support_camera_player_id
      ? getPlayerName(match.support_camera_player_id)
      : null;
    const stats = match.support_stats_player_id
      ? getPlayerName(match.support_stats_player_id)
      : null;
    const unassigned = t(
      "peladas.matches.support_lineup.unassigned",
      "Não definido",
    );
    const camTitle = t("peladas.matches.support_lineup.camera_short", "Câmera");
    const statsTitle = t(
      "peladas.matches.support_lineup.stats_short",
      "Súmula",
    );
    const escalaLink = onNavigateToSupportTab && (
      <Button
        onClick={onNavigateToSupportTab}
        data-testid="view-full-support-schedule"
        sx={{
          minWidth: 0,
          p: 0,
          fontFamily: "Archivo, sans-serif",
          fontWeight: 700,
          fontSize: "11.5px",
          lineHeight: 1,
          color: "primary.main",
          "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
        }}
      >
        {t("peladas.support_lineup.view_escalation", "Escala")}
      </Button>
    );

    if (isDesktop) {
      return (
        <Box
          sx={{
            p: "12px 14px",
            border: (theme) => `1.5px dashed ${theme.palette.divider}`,
            borderRadius: "13px",
          }}
          data-testid="active-match-support-lineup-card"
        >
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "9.5px",
              lineHeight: 1,
              letterSpacing: "0.14em",
              color: "text.secondary",
            }}
          >
            {t("peladas.dashboard.live_state.support_label", "SUPORTE")}
          </Typography>
          <Box
            sx={{
              mt: "7px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <Box
              data-testid="support-camera-person"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                minWidth: 0,
              }}
            >
              <Tooltip title={camTitle}>
                <VideocamOutlinedIcon
                  data-testid="support-camera-icon"
                  aria-label={camTitle}
                  sx={{ fontSize: 16, color: "text.secondary", flexShrink: 0 }}
                />
              </Tooltip>
              <Typography
                noWrap
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 600,
                  fontSize: "12px",
                  lineHeight: 1.2,
                  color: "text.secondary",
                }}
              >
                {cam || unassigned}
              </Typography>
            </Box>

            <Box
              data-testid="support-stats-person"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                minWidth: 0,
              }}
            >
              <Tooltip title={statsTitle}>
                <AssignmentOutlinedIcon
                  data-testid="support-stats-icon"
                  aria-label={statsTitle}
                  sx={{ fontSize: 16, color: "text.secondary", flexShrink: 0 }}
                />
              </Tooltip>
              <Typography
                noWrap
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 600,
                  fontSize: "12px",
                  lineHeight: 1.2,
                  color: "text.secondary",
                }}
              >
                {stats || unassigned}
              </Typography>
            </Box>
          </Box>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          mt: 0,
          mb: "12px",
          p: "12px 14px",
          border: (theme) => `1.5px dashed ${theme.palette.divider}`,
          borderRadius: "13px",
        }}
        data-testid="active-match-support-lineup-card"
      >
        <Typography
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 800,
            fontSize: "10px",
            lineHeight: 1,
            letterSpacing: "0.14em",
            color: "text.secondary",
            flexShrink: 0,
          }}
        >
          {t("peladas.dashboard.live_state.support_label", "SUPORTE")}
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <Box
            data-testid="support-camera-person"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            <Tooltip title={camTitle}>
              <VideocamOutlinedIcon
                data-testid="support-camera-icon"
                aria-label={camTitle}
                sx={{ fontSize: 15, color: "text.secondary", flexShrink: 0 }}
              />
            </Tooltip>
            <Typography
              noWrap
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 600,
                fontSize: "11.5px",
                lineHeight: 1.2,
                color: "text.secondary",
              }}
            >
              {cam || unassigned}
            </Typography>
          </Box>

          <Box
            data-testid="support-stats-person"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            <Tooltip title={statsTitle}>
              <AssignmentOutlinedIcon
                data-testid="support-stats-icon"
                aria-label={statsTitle}
                sx={{ fontSize: 15, color: "text.secondary", flexShrink: 0 }}
              />
            </Tooltip>
            <Typography
              noWrap
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 600,
                fontSize: "11.5px",
                lineHeight: 1.2,
                color: "text.secondary",
              }}
            >
              {stats || unassigned}
            </Typography>
          </Box>
        </Box>

        {escalaLink}
      </Box>
    );
  };

  const eventTypesGrid = (
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
      {EVENT_TYPES.map((ev) => (
        <Button
          key={ev.type}
          onClick={() => setEventSheet({ step: "player", type: ev.type })}
          data-testid={`event-type-card-${ev.type}`}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
            border: (theme) => `1.5px solid ${theme.palette.divider}`,
            bgcolor: "background.paper",
            borderRadius: "14px",
            p: "15px 13px",
            cursor: "pointer",
            textAlign: "left",
            "&:hover": {
              borderColor: "primary.main",
              bgcolor: "action.hover",
            },
          }}
        >
          <Box
            sx={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              bgcolor: (theme) => theme.palette.matchEvents[ev.type],
              flexShrink: 0,
            }}
          />
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "13.5px",
              lineHeight: 1,
              color: "text.primary",
            }}
          >
            {t(`common.${ev.type}`, ev.label)}
          </Typography>
        </Button>
      ))}
    </Box>
  );

  const positionLabel = (p: { player_id: string; is_goalkeeper?: boolean }) => {
    if (p.is_goalkeeper) return "GOL";
    const data = orgPlayerIdToPlayer[p.player_id];
    const pos = (
      data?.position ||
      data?.user_position ||
      "player"
    ).toLowerCase();
    const short: Record<string, string> = {
      goalkeeper: "GOL",
      defender: "ZAG",
      midfielder: "MEI",
      striker: "ATA",
    };
    return short[pos] || pos.toUpperCase();
  };

  const playersGrid = (
    players: (TeamPlayer & { isEmpty?: boolean; side: "home" | "away" })[],
    onPick: (playerId: string) => void,
    testidPrefix: "goal" | "assistant" | "event" | "own_goal",
    showTeamTag: boolean,
  ) => (
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
      {players.map((p) => {
        const name = getPlayerName(p.player_id);
        const isHome = p.side === "home";
        return (
          <Button
            key={`${p.side}-${p.player_id}`}
            onClick={() => onPick(p.player_id)}
            data-testid={`${testidPrefix}-player-item-${p.player_id}`}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "4px",
              border: (theme) => `1.5px solid ${theme.palette.divider}`,
              bgcolor: "background.paper",
              borderRadius: "14px",
              p: "13px 12px",
              cursor: "pointer",
              textAlign: "left",
              "&:hover": {
                borderColor: "primary.main",
                bgcolor: "action.hover",
              },
            }}
          >
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "13px",
                lineHeight: 1.15,
                color: "text.primary",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "100%",
              }}
            >
              {name}
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: "7px",
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "9.5px",
                lineHeight: 1,
                letterSpacing: "0.08em",
                color: "text.secondary",
              }}
            >
              <span>{positionLabel(p)}</span>
              {showTeamTag && <span>{isHome ? "LARANJA" : "AZUL"}</span>}
            </Box>
          </Button>
        );
      })}
    </Box>
  );

  return (
    <Box sx={{ bgcolor: "background.default" }}>
      {isDesktop ? (
        /* ---------- Desktop / tablet largo (referência 1b) ---------- */
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 316px",
            minHeight: 0,
          }}
        >
          {/* Coluna Esquerda: Placar + 3 botões + Escalações lado a lado */}
          <Box
            sx={{
              padding: "22px 22px 22px 26px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              minHeight: 0,
            }}
          >
            {/* Placar Hero dentro da coluna esquerda */}
            <MatchScoreHero
              match={match}
              pelada={pelada}
              homeTeamName={homeTeamName}
              awayTeamName={awayTeamName}
              isAdmin={isAdmin}
              totalMatches={matches.length}
              standings={standings}
              clockLabel={clockLabel}
              running={matchTimer.status === "running"}
              sessionLabel={sessionLabel}
              homeOnFieldCount={homePlayers.length}
              awayOnFieldCount={awayPlayers.length}
              onToggleHistory={() => setHistoryOpen(true)}
              onToggleRun={() => {
                if (matchTimer.status === "running") matchTimer.pause?.();
                else matchTimer.start?.();
              }}
              onOpenResetConfirm={onOpenResetConfirm}
              onEndMatch={onEndMatch}
              updating={updating}
              finished={isMatchFinished}
              isEditing={isEditing}
              onToggleEdit={() => setIsEditing(!isEditing)}
            />

            {/* Linha com os 3 botões de ação: GOL TIME 1, GOL TIME 2, OUTRO LANCE */}
            {canRecord && (
              <Box sx={{ display: "flex", gap: "14px", flexShrink: 0 }}>
                <Button
                  onClick={() => setGoalSheet({ side: "home", step: "scorer" })}
                  data-testid="goal-button-home"
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                    border: 0,
                    borderRadius: "16px",
                    bgcolor: "home.main",
                    color: "home.contrastText",
                    py: "17px",
                    cursor: "pointer",
                    boxShadow: (theme) => `0 4px 0 ${theme.palette.home.dark}`,
                    "&:hover": { bgcolor: "home.dark" },
                    "&:active": {
                      transform: "translateY(3px)",
                      boxShadow: (theme) =>
                        `0 1px 0 ${theme.palette.home.dark}`,
                    },
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: "'Anton', sans-serif",
                      fontWeight: 400,
                      fontSize: "26px",
                      lineHeight: 1,
                      letterSpacing: "0.04em",
                    }}
                  >
                    GOL
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: "11px",
                      lineHeight: 1,
                      letterSpacing: "0.14em",
                      color: "home.light",
                    }}
                  >
                    {homeTeamName.toUpperCase()}
                  </Typography>
                </Button>

                <Button
                  onClick={() => setGoalSheet({ side: "away", step: "scorer" })}
                  data-testid="goal-button-away"
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                    border: 0,
                    borderRadius: "16px",
                    bgcolor: "away.main",
                    color: "away.contrastText",
                    py: "17px",
                    cursor: "pointer",
                    boxShadow: (theme) => `0 4px 0 ${theme.palette.away.dark}`,
                    "&:hover": { bgcolor: "away.dark" },
                    "&:active": {
                      transform: "translateY(3px)",
                      boxShadow: (theme) =>
                        `0 1px 0 ${theme.palette.away.dark}`,
                    },
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: "'Anton', sans-serif",
                      fontWeight: 400,
                      fontSize: "26px",
                      lineHeight: 1,
                      letterSpacing: "0.04em",
                    }}
                  >
                    GOL
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: "11px",
                      lineHeight: 1,
                      letterSpacing: "0.14em",
                      color: "away.light",
                    }}
                  >
                    {awayTeamName.toUpperCase()}
                  </Typography>
                </Button>

                <Button
                  onClick={() => setEventSheet({ step: "type" })}
                  data-testid="record-event-inline-button"
                  sx={{
                    flexShrink: 0,
                    width: 210,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "5px",
                    border: (theme) => `1.5px solid ${theme.palette.divider}`,
                    borderRadius: "16px",
                    bgcolor: "background.paper",
                    color: "text.primary",
                    py: "14px",
                    cursor: "pointer",
                    "&:hover": {
                      borderColor: "primary.main",
                      bgcolor: "action.hover",
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: "13px",
                      lineHeight: 1,
                      letterSpacing: "0.06em",
                    }}
                  >
                    ＋{" "}
                    {t(
                      "peladas.dashboard.live_state.other_event",
                      "OUTRO LANCE",
                    )}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 600,
                      fontSize: "9.5px",
                      lineHeight: 1,
                      letterSpacing: "0.06em",
                      color: "text.secondary",
                    }}
                  >
                    DRIBLE · CHUTE · FALTA · DEFESAÇA
                  </Typography>
                </Button>
              </Box>
            )}

            {/* Escalações dos dois times em duas colunas */}
            <Box
              sx={{
                flex: 1,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "14px",
                minHeight: 0,
              }}
            >
              {teamSection("home")}
              {teamSection("away")}
            </Box>
          </Box>

          {/* Coluna Direita: Classificação ao vivo + Linha do tempo + A seguir + Suporte + Botões Tabela/Súmula */}
          <Box
            sx={{
              borderLeft: (theme) => `1.5px solid ${theme.palette.divider}`,
              bgcolor: "background.default",
              p: "22px 22px 22px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              minHeight: 0,
            }}
          >
            {/* Card Classificação ao vivo */}
            {liveStandingsCard}

            {/* A Seguir */}
            {nextMatchSection()}

            {/* Suporte */}
            {supportRow()}

            {/* Botões Tabela & Súmula */}
            {tabButtons(false)}
          </Box>
        </Box>
      ) : (
        /* ---------- Mobile (referência 1a) ---------- */
        <Box sx={{ pb: 0 }}>
          {/* Header Placar Mobile */}
          <MatchScoreHero
            match={match}
            pelada={pelada}
            homeTeamName={homeTeamName}
            awayTeamName={awayTeamName}
            isAdmin={isAdmin}
            totalMatches={matches.length}
            standings={standings}
            clockLabel={clockLabel}
            running={matchTimer.status === "running"}
            sessionLabel={sessionLabel}
            homeOnFieldCount={homePlayers.length}
            awayOnFieldCount={awayPlayers.length}
            onToggleHistory={() => setHistoryOpen(true)}
            onToggleRun={() => {
              if (matchTimer.status === "running") matchTimer.pause?.();
              else matchTimer.start?.();
            }}
            onOpenResetConfirm={onOpenResetConfirm}
            onEndMatch={onEndMatch}
            updating={updating}
            finished={isMatchFinished}
            isEditing={isEditing}
            onToggleEdit={() => setIsEditing(!isEditing)}
          />

          {/* Área de conteúdo rolável */}
          <Box sx={{ p: "16px", pb: canRecord ? "190px" : "16px" }}>
            {nextMatchSection()}

            {supportRow()}

            <Box
              sx={{
                bgcolor: "background.paper",
                border: (theme) => `1.5px solid ${theme.palette.divider}`,
                borderRadius: "15px",
                p: "14px",
              }}
              data-testid="on-field-card"
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  mb: "12px",
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 800,
                    fontSize: "10px",
                    lineHeight: 1,
                    letterSpacing: "0.16em",
                    color: "text.secondary",
                  }}
                >
                  {t("peladas.dashboard.live_state.on_field", "EM CAMPO")}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontSize: "10px",
                    fontWeight: 600,
                    lineHeight: 1,
                    color: "text.secondary",
                  }}
                >
                  {t(
                    "peladas.dashboard.live_state.swap_hint",
                    "toque em ⇄ para substituir",
                  )}
                </Typography>
              </Box>

              {teamSection("home")}
              {teamSection("away")}
            </Box>

            {onNavigateToTimeline && (
              <Button
                onClick={onNavigateToTimeline}
                data-testid="go-to-timeline-button"
                sx={{
                  width: "100%",
                  mt: "12px",
                  border: (theme) => `1.5px dashed ${theme.palette.divider}`,
                  bgcolor: "transparent",
                  color: "primary.main",
                  borderRadius: "12px",
                  py: "11px",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: "10.5px",
                  lineHeight: 1,
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: "action.hover",
                  },
                }}
              >
                {t(
                  "peladas.dashboard.live_state.view_timeline",
                  "VER LINHA DO TEMPO COMPLETA",
                )}
              </Button>
            )}

            {tabButtons(false)}
          </Box>

          {/* Barra inferior fixa para o polegar */}
          {canRecord && (
            <Portal>
              <Box
                sx={{
                  position: "fixed",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1100,
                  p: "14px 16px 26px",
                  background: (theme) =>
                    `linear-gradient(180deg, ${alpha(theme.palette.background.default, 0)} 0%, ${theme.palette.background.default} 34%)`,
                }}
                data-testid="live-action-bar"
              >
                <Button
                  onClick={() => setEventSheet({ step: "type" })}
                  data-testid="record-event-inline-button"
                  sx={{
                    width: "100%",
                    mb: "9px",
                    border: (theme) => `1.5px solid ${theme.palette.divider}`,
                    bgcolor: "background.paper",
                    color: "text.primary",
                    borderRadius: "13px",
                    py: "13px",
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 800,
                    fontSize: "11.5px",
                    lineHeight: 1,
                    letterSpacing: "0.08em",
                    cursor: "pointer",
                    "&:hover": {
                      borderColor: "primary.main",
                      bgcolor: "action.hover",
                    },
                  }}
                >
                  ＋{" "}
                  {t("peladas.dashboard.live_state.other_event", "OUTRO LANCE")}{" "}
                  · DRIBLE, CHUTE, FALTA…
                </Button>
                <Box sx={{ display: "flex", gap: "10px" }}>
                  <Button
                    onClick={() =>
                      setGoalSheet({ side: "home", step: "scorer" })
                    }
                    data-testid="goal-button-home"
                    sx={{
                      flex: 1,
                      border: 0,
                      borderRadius: "16px",
                      bgcolor: "home.main",
                      color: "home.contrastText",
                      py: "18px",
                      pb: "20px",
                      cursor: "pointer",
                      boxShadow: (theme) =>
                        `0 4px 0 ${theme.palette.home.dark}`,
                      "&:hover": { bgcolor: "home.dark" },
                      "&:active": {
                        transform: "translateY(3px)",
                        boxShadow: (theme) =>
                          `0 1px 0 ${theme.palette.home.dark}`,
                      },
                    }}
                  >
                    <Box sx={{ display: "block", textAlign: "center" }}>
                      <Typography
                        component="span"
                        sx={{
                          display: "block",
                          fontFamily: "'Anton', sans-serif",
                          fontWeight: 400,
                          fontSize: "30px",
                          lineHeight: 1,
                          letterSpacing: "0.04em",
                        }}
                      >
                        GOL
                      </Typography>
                      <Typography
                        component="span"
                        sx={{
                          display: "block",
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: 800,
                          fontSize: "10px",
                          lineHeight: 1,
                          letterSpacing: "0.14em",
                          color: "home.light",
                          mt: "6px",
                        }}
                      >
                        {homeTeamName.toUpperCase()}
                      </Typography>
                    </Box>
                  </Button>

                  <Button
                    onClick={() =>
                      setGoalSheet({ side: "away", step: "scorer" })
                    }
                    data-testid="goal-button-away"
                    sx={{
                      flex: 1,
                      border: 0,
                      borderRadius: "16px",
                      bgcolor: "away.main",
                      color: "away.contrastText",
                      py: "18px",
                      pb: "20px",
                      cursor: "pointer",
                      boxShadow: (theme) =>
                        `0 4px 0 ${theme.palette.away.dark}`,
                      "&:hover": { bgcolor: "away.dark" },
                      "&:active": {
                        transform: "translateY(3px)",
                        boxShadow: (theme) =>
                          `0 1px 0 ${theme.palette.away.dark}`,
                      },
                    }}
                  >
                    <Box sx={{ display: "block", textAlign: "center" }}>
                      <Typography
                        component="span"
                        sx={{
                          display: "block",
                          fontFamily: "'Anton', sans-serif",
                          fontWeight: 400,
                          fontSize: "30px",
                          lineHeight: 1,
                          letterSpacing: "0.04em",
                        }}
                      >
                        GOL
                      </Typography>
                      <Typography
                        component="span"
                        sx={{
                          display: "block",
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: 800,
                          fontSize: "10px",
                          lineHeight: 1,
                          letterSpacing: "0.14em",
                          color: "away.light",
                          mt: "6px",
                        }}
                      >
                        {awayTeamName.toUpperCase()}
                      </Typography>
                    </Box>
                  </Button>
                </Box>
              </Box>
            </Portal>
          )}
        </Box>
      )}

      {/* Seletor de Substituição */}
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

      {/* Goal Sheet: scorer -> assist / own_goal */}
      <Dialog
        open={Boolean(goalSheet)}
        onClose={() => setGoalSheet(null)}
        slotProps={{ paper: { sx: bottomSheetPaperSx } }}
        data-testid={
          goalSheet?.step === "assist"
            ? "assist-select-dialog"
            : goalSheet?.step === "own_goal"
              ? "own-goal-select-dialog"
              : "goal-select-dialog"
        }
      >
        <DialogContent sx={{ p: { xs: "20px 18px 26px", sm: "22px" } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              mb: "14px",
            }}
          >
            <Box
              sx={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                bgcolor:
                  goalSheet?.step === "own_goal"
                    ? "secondary.main"
                    : goalSheet?.side === "away"
                      ? "away.main"
                      : "home.main",
                flexShrink: 0,
              }}
            />
            <Typography
              sx={{
                flex: 1,
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "10px",
                lineHeight: 1,
                letterSpacing: "0.16em",
                color: "text.secondary",
              }}
            >
              {goalSheet?.step === "own_goal"
                ? `GOL CONTRA A FAVOR DO ${goalSideName.toUpperCase()} · ${clockLabel}`
                : `GOL DO ${goalSideName.toUpperCase()} · ${clockLabel}`}
            </Typography>
            <IconButton
              onClick={() => setGoalSheet(null)}
              aria-label={t("common.close")}
              sx={{
                border: "1.5px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                color: "text.secondary",
                width: 30,
                height: 30,
                borderRadius: "10px",
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "13px",
                lineHeight: 1,
                p: 0,
                "&:hover": {
                  borderColor: "error.main",
                  color: "error.main",
                },
              }}
            >
              ✕
            </IconButton>
          </Box>

          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: { xs: "21px", sm: "22px" },
              lineHeight: 1.2,
              color: "text.primary",
              mb: "14px",
            }}
            data-testid="goal-sheet-question"
          >
            {goalSheet?.step === "scorer"
              ? t("peladas.matches.who_scored", "Quem marcou?")
              : goalSheet?.step === "assist"
                ? t("peladas.matches.who_assisted", "Quem deu a assistência?")
                : t(
                    "peladas.matches.who_scored_own_goal",
                    "Quem fez o gol contra?",
                  )}
          </Typography>

          {goalSheet?.step === "scorer" ? (
            <>
              {playersGrid(
                goalSideList.filter((p) => !p.isEmpty),
                (pid) => {
                  if (goalSheet) {
                    setGoalSheet({
                      side: goalSheet.side,
                      step: "assist",
                      scorerId: pid,
                    });
                  }
                },
                "goal",
                false,
              )}
              <Button
                onClick={() => {
                  if (goalSheet) {
                    setGoalSheet({
                      side: goalSheet.side,
                      step: "own_goal",
                    });
                  }
                }}
                data-testid="own-goal-option"
                sx={{
                  width: "100%",
                  mt: "12px",
                  border: 0,
                  borderRadius: "13px",
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  py: "15px",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: "12.5px",
                  lineHeight: 1,
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "primary.dark" },
                }}
              >
                {t("peladas.matches.own_goal_btn", "GOL CONTRA")}
              </Button>
              <Button
                onClick={handleSkipOwnGoal}
                data-testid="own-goal-skip-option"
                sx={{
                  width: "100%",
                  mt: "6px",
                  borderRadius: "13px",
                  bgcolor: "transparent",
                  color: "text.secondary",
                  py: "10px",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "11px",
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                {t("peladas.matches.goal_unidentified", "GOL NÃO IDENTIFICADO")}
              </Button>
            </>
          ) : goalSheet?.step === "assist" ? (
            <>
              {playersGrid(
                assistantOptions,
                (pid) => commitGoal(pid),
                "assistant",
                false,
              )}
              <Button
                onClick={() => commitGoal(undefined)}
                data-testid="without-assistance-option"
                sx={{
                  width: "100%",
                  mt: "12px",
                  border: 0,
                  borderRadius: "13px",
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  py: "15px",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: "12.5px",
                  lineHeight: 1,
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "primary.dark" },
                }}
              >
                SEM ASSISTÊNCIA
              </Button>
            </>
          ) : (
            <>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  mb: "10px",
                }}
              >
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    bgcolor:
                      goalSheet?.side === "home" ? "away.main" : "home.main",
                  }}
                />
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 800,
                    fontSize: "11px",
                    lineHeight: 1,
                    letterSpacing: "0.08em",
                    color: "text.secondary",
                    textTransform: "uppercase",
                  }}
                >
                  {t(
                    "peladas.matches.defending_team_players",
                    "Jogador do {{team}}",
                    { team: defendingSideName },
                  )}
                </Typography>
              </Box>

              {playersGrid(
                defendingSideList.filter((p) => !p.isEmpty),
                (pid) => commitOwnGoal(pid),
                "own_goal",
                false,
              )}

              <Button
                onClick={handleSkipOwnGoal}
                data-testid="unidentified-own-goal-option"
                sx={{
                  width: "100%",
                  mt: "12px",
                  border: 0,
                  borderRadius: "13px",
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  py: "15px",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: "12.5px",
                  lineHeight: 1,
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "primary.dark" },
                }}
              >
                {t(
                  "peladas.matches.own_goal_unidentified",
                  "GOL CONTRA NÃO IDENTIFICADO",
                )}
              </Button>

              <Button
                onClick={() => {
                  if (goalSheet) {
                    setGoalSheet({ side: goalSheet.side, step: "scorer" });
                  }
                }}
                data-testid="back-to-scorer-option"
                sx={{
                  width: "100%",
                  mt: "6px",
                  borderRadius: "13px",
                  bgcolor: "transparent",
                  color: "text.secondary",
                  py: "10px",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "11px",
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                {t("common.back", "VOLTAR")}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Event Sheet: type -> player */}
      <Dialog
        open={Boolean(eventSheet)}
        onClose={() => setEventSheet(null)}
        slotProps={{ paper: { sx: bottomSheetPaperSx } }}
        data-testid="record-event-dialog"
      >
        <DialogContent sx={{ p: { xs: "20px 18px 26px", sm: "22px" } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              mb: "14px",
            }}
          >
            <Box
              sx={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                bgcolor: "text.secondary",
                flexShrink: 0,
              }}
            />
            <Typography
              sx={{
                flex: 1,
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "10px",
                lineHeight: 1,
                letterSpacing: "0.16em",
                color: "text.secondary",
              }}
            >
              {`REGISTRAR LANCE · ${clockLabel}`}
            </Typography>
            <IconButton
              onClick={() => setEventSheet(null)}
              aria-label={t("common.close")}
              sx={{
                border: "1.5px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                color: "text.secondary",
                width: 30,
                height: 30,
                borderRadius: "10px",
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "13px",
                lineHeight: 1,
                p: 0,
                "&:hover": {
                  borderColor: "error.main",
                  color: "error.main",
                },
              }}
            >
              ✕
            </IconButton>
          </Box>

          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: { xs: "21px", sm: "22px" },
              lineHeight: 1.2,
              color: "text.primary",
              mb: "14px",
            }}
          >
            {eventSheet?.step === "type"
              ? "Que lance foi?"
              : "Quem fez o lance?"}
          </Typography>

          {eventSheet?.step === "type" ? (
            eventTypesGrid
          ) : (
            <>
              {playersGrid(
                allOnFieldPlayers,
                handleConfirmEvent,
                "event",
                true,
              )}
              <Button
                onClick={() => setEventSheet({ step: "type" })}
                sx={{
                  width: "100%",
                  mt: "12px",
                  borderRadius: "13px",
                  bgcolor: "transparent",
                  color: "text.secondary",
                  py: "12px",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: "11px",
                  lineHeight: 1,
                  letterSpacing: "0.06em",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                {t("common.back", "VOLTAR")}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* History Drawer */}
      <Drawer
        anchor="left"
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        data-testid="history-drawer"
      >
        <Box sx={{ width: 320, p: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: "bold",
              mb: 3,
              px: 1,
            }}
          >
            {t("peladas.matches.history_title", "Histórico de Partidas")}
          </Typography>
          <List sx={{ px: 0 }}>
            {matches.map((m) => {
              const isSelected = match.id === m.id;
              const isNext = m.id === nextMatch?.id;
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
                        width: "100%",
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: "center" }}
                      >
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
                          color={
                            isSelected
                              ? "primary.main"
                              : isNext
                                ? "info.main"
                                : "text.secondary"
                          }
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: "bold",
                          }}
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
                        width: "100%",
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
                        <Typography variant="body2" sx={{ fontWeight: "900" }}>
                          {m.home_score}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.disabled", fontWeight: "bold" }}
                        >
                          x
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: "900" }}>
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
