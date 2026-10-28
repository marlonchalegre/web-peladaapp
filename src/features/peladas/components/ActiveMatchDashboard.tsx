import { useState, useMemo, useCallback } from "react";
import {
  Box,
  Button,
  Paper,
  Portal,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
  alpha,
} from "@mui/material";
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
import MatchEventSheets, {
  type EventSheetState,
  type GoalSheetState,
  type OnFieldTeamPlayer,
} from "./MatchEventSheets";
import MatchHistoryDrawer from "./MatchHistoryDrawer";
import {
  LiveStandingsCard,
  MatchSupportRow,
  NextMatchCard,
} from "./ActiveMatchSidebarWidgets";
import {
  comparePlayersByPosition,
  resolvePlayerName,
} from "../utils/playerUtils";
import type { StandingRow } from "../utils/standingsUtils";
import { usePeladaTimer } from "../hooks/usePeladaTimer";

export type SelectMenuState = {
  teamId: string;
  forPlayerId?: string;
  type: "replace" | "add";
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
  activeTab?: number;
  onNavigateToLive?: () => void;
  onNavigateToTimeline?: () => void;
  onNavigateToStandings?: () => void;
  onNavigateToSupportTab?: () => void;
  playerTeamMap?: Record<string, string>;
  timelineComponent?: React.ReactNode;
  standingsComponent?: React.ReactNode;
  supportComponent?: React.ReactNode;
};

export const MATCH_MIRROR_STORAGE_KEY = "pelada_match_mirror_sides";

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
    activeTab = 0,
    onNavigateToLive,
    onNavigateToTimeline,
    onNavigateToStandings,
    onNavigateToSupportTab,
    playerTeamMap,
    timelineComponent,
    standingsComponent,
    supportComponent,
  } = props;

  const { t } = useTranslation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [historyOpen, setHistoryOpen] = useState(false);

  const [goalSheet, setGoalSheet] = useState<GoalSheetState>(null);
  const [eventSheet, setEventSheet] = useState<EventSheetState>(null);

  const [isMirrored, setIsMirrored] = useState<boolean>(() => {
    try {
      return localStorage.getItem(MATCH_MIRROR_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const handleToggleMirror = useCallback(() => {
    setIsMirrored((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(MATCH_MIRROR_STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const leftSide = isMirrored ? "away" : "home";
  const rightSide = isMirrored ? "home" : "away";

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

  const clockLabel = matchTimer.formattedTime.substring(3);

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
    (
      players: TeamPlayer[],
      side: "home" | "away",
      teamId: string,
    ): OnFieldTeamPlayer[] => {
      const sortedPlayers = [...players].sort((a, b) =>
        comparePlayersByPosition(
          {
            ...orgPlayerIdToPlayer[a.player_id],
            is_goalkeeper: a.is_goalkeeper,
            name: getPlayerName(a.player_id),
          },
          {
            ...orgPlayerIdToPlayer[b.player_id],
            is_goalkeeper: b.is_goalkeeper,
            name: getPlayerName(b.player_id),
          },
        ),
      );

      const list: OnFieldTeamPlayer[] = sortedPlayers.map((p) => ({
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

  const currentMatch = useMemo(() => {
    if (
      (pelada?.status || "").toLowerCase() === "closed" ||
      matches.length === 0
    ) {
      return null;
    }
    const running = matches.find((m) => m.status === "running");
    if (running) return running;
    return (
      matches
        .filter((m) => m.status === "scheduled")
        .sort((a, b) => a.sequence - b.sequence)[0] || null
    );
  }, [matches, pelada?.status]);

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

  const renderGoalButton = (side: "home" | "away", isMobile = false) => {
    const isHome = side === "home";
    const name = isHome ? homeTeamName : awayTeamName;
    const color = isHome ? "home" : "away";

    return (
      <Button
        key={side}
        onClick={() => setGoalSheet({ side, step: "scorer" })}
        data-testid={`goal-button-${side}`}
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          gap: isMobile ? 0 : "12px",
          border: 0,
          borderRadius: "16px",
          bgcolor: `${color}.main`,
          color: `${color}.contrastText`,
          py: isMobile ? "18px" : "17px",
          pb: isMobile ? "20px" : "17px",
          cursor: "pointer",
          boxShadow: (theme) => `0 4px 0 ${theme.palette[color].dark}`,
          "&:hover": { bgcolor: `${color}.dark` },
          "&:active": {
            transform: "translateY(3px)",
            boxShadow: (theme) => `0 1px 0 ${theme.palette[color].dark}`,
          },
        }}
      >
        <Typography
          component="span"
          sx={{
            fontFamily: "'Anton', sans-serif",
            fontWeight: 400,
            fontSize: isMobile ? "30px" : "26px",
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
            fontSize: isMobile ? "10px" : "11px",
            lineHeight: 1,
            letterSpacing: "0.14em",
            color: `${color}.light`,
            mt: isMobile ? "6px" : 0,
          }}
        >
          {name.toUpperCase()}
        </Typography>
      </Button>
    );
  };

  const getSideTeamName = (side: "home" | "away") =>
    side === "home" ? homeTeamName : awayTeamName;
  const getSideScore = (side: "home" | "away") =>
    side === "home" ? match.home_score : match.away_score;

  const bannerFirstTeam = getSideTeamName(leftSide);
  const bannerFirstScore = getSideScore(leftSide);
  const bannerSecondTeam = getSideTeamName(rightSide);
  const bannerSecondScore = getSideScore(rightSide);

  const liveMatchBanner = (
    <Paper
      elevation={0}
      sx={{
        p: { xs: "10px 14px", sm: "12px 18px" },
        borderRadius: "14px",
        border: (theme) => `1.5px solid ${theme.palette.divider}`,
        bgcolor: "background.paper",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 1.5,
        boxShadow: (theme) => theme.customShadows?.subtle || "none",
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <Box
          sx={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            bgcolor:
              matchTimer.status === "running"
                ? "success.main"
                : "text.secondary",
          }}
        />
        <Typography
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 800,
            fontSize: { xs: "11px", sm: "12px" },
            letterSpacing: ".06em",
            textTransform: "uppercase",
            color: "text.primary",
          }}
        >
          {t("peladas.matches.current_match", "PARTIDA EM ANDAMENTO")}:{" "}
          {bannerFirstTeam} ({bannerFirstScore}) × ({bannerSecondScore}){" "}
          {bannerSecondTeam}
          {clockLabel ? ` · ${clockLabel}` : ""}
        </Typography>
      </Stack>

      {onNavigateToLive && (
        <Button
          onClick={onNavigateToLive}
          variant="outlined"
          size="small"
          data-testid="return-to-live-btn"
          sx={{
            borderRadius: "9px",
            borderColor: "primary.main",
            color: "primary.main",
            fontFamily: "Archivo, sans-serif",
            fontWeight: 800,
            fontSize: "11px",
            letterSpacing: ".04em",
            px: 1.75,
            py: "5px",
            "&:hover": { bgcolor: "action.hover", borderColor: "primary.dark" },
          }}
        >
          ← {t("peladas.matches.back_to_live", "VOLTAR AO JOGO")}
        </Button>
      )}
    </Paper>
  );

  const tabButtons = (withEnd: boolean) => (
    <Box
      data-testid="tab-buttons"
      sx={{
        display: "flex",
        gap: "8px",
        mt: withEnd ? "18px" : isDesktop ? 0 : "12px",
      }}
    >
      {activeTab !== 0 && onNavigateToLive ? (
        <Button
          onClick={onNavigateToLive}
          data-testid="go-to-live-button"
          sx={{
            flex: 1,
            border: (theme) => `1.5px solid ${theme.palette.primary.main}`,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            borderRadius: "11px",
            py: withEnd ? "12px" : "11px",
            fontFamily: "Archivo, sans-serif",
            fontWeight: 800,
            fontSize: withEnd ? "11px" : "10.5px",
            lineHeight: 1,
            letterSpacing: "0.05em",
            "&:hover": { borderColor: "primary.dark", bgcolor: "primary.dark" },
          }}
        >
          {t("peladas.dashboard.live_state.live_button", "AO VIVO")}
        </Button>
      ) : onNavigateToStandings ? (
        <Button
          onClick={onNavigateToStandings}
          data-testid="go-to-standings-button"
          sx={{
            flex: 1,
            border: (theme) => `1.5px solid ${theme.palette.divider}`,
            bgcolor: activeTab === 1 ? "action.selected" : "background.paper",
            color: activeTab === 1 ? "text.primary" : "text.secondary",
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
      ) : null}
      {activeTab === 2 && onNavigateToStandings ? (
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
      ) : onNavigateToTimeline ? (
        <Button
          onClick={onNavigateToTimeline}
          data-testid="go-to-timeline-button"
          sx={{
            flex: 1,
            border: (theme) => `1.5px solid ${theme.palette.divider}`,
            bgcolor: activeTab === 2 ? "action.selected" : "background.paper",
            color: activeTab === 2 ? "text.primary" : "text.secondary",
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
      ) : null}
      {withEnd && isAdmin && !effectiveFinished && (
        <Button
          onClick={onEndMatch}
          data-testid="end-match-button"
          sx={{
            flex: 1,
            border: (theme) => `1.5px solid ${theme.palette.secondary.main}`,
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
              bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.1),
            },
          }}
        >
          {t("peladas.dashboard.live_state.end_match", "ENCERRAR")}
        </Button>
      )}
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
              minWidth: 0,
            }}
          >
            {(!activeTab || activeTab === 0) && (
              <>
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
                  isMirrored={isMirrored}
                  onToggleMirror={handleToggleMirror}
                />

                {canRecord && (
                  <Box sx={{ display: "flex", gap: "14px", flexShrink: 0 }}>
                    {renderGoalButton(leftSide, false)}
                    {renderGoalButton(rightSide, false)}

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
                        border: (theme) =>
                          `1.5px solid ${alpha(theme.palette.text.primary, 0.22)}`,
                        borderRadius: "16px",
                        bgcolor: "background.paper",
                        color: "text.primary",
                        py: "14px",
                        cursor: "pointer",
                        boxShadow: (theme) =>
                          theme.customShadows?.card ||
                          "0 2px 8px rgba(0,0,0,0.1)",
                        "&:hover": {
                          borderColor: "primary.main",
                          bgcolor: "action.hover",
                          boxShadow: (theme) =>
                            theme.customShadows?.cardHover || "none",
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

                <Box
                  sx={{
                    flex: 1,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "14px",
                    minHeight: 0,
                  }}
                >
                  {teamSection(leftSide)}
                  {teamSection(rightSide)}
                </Box>
              </>
            )}

            {activeTab !== 0 && (
              <>
                {liveMatchBanner}
                {activeTab === 1 && standingsComponent}
                {activeTab === 2 && timelineComponent}
                {activeTab === 3 && supportComponent}
              </>
            )}
          </Box>

          {/* Coluna Direita */}
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
            <LiveStandingsCard
              standings={standings}
              homeTeamId={match.home_team_id}
              awayTeamId={match.away_team_id}
              homeTeamName={homeTeamName}
              awayTeamName={awayTeamName}
            />
            <NextMatchCard
              nextMatch={nextMatch}
              teamNameById={teamNameById}
              isDesktop
            />
            <MatchSupportRow
              match={match}
              getPlayerName={getPlayerName}
              isDesktop
              onNavigateToSupportTab={onNavigateToSupportTab}
            />
            {tabButtons(false)}
          </Box>
        </Box>
      ) : (
        /* ---------- Mobile (referência 1a) ---------- */
        <Box sx={{ pb: 0 }}>
          {!activeTab || activeTab === 0 ? (
            <>
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
                isMirrored={isMirrored}
                onToggleMirror={handleToggleMirror}
              />

              <Box sx={{ p: "16px", pb: canRecord ? "190px" : "16px" }}>
                <NextMatchCard
                  nextMatch={nextMatch}
                  teamNameById={teamNameById}
                  isDesktop={false}
                />
                <MatchSupportRow
                  match={match}
                  getPlayerName={getPlayerName}
                  isDesktop={false}
                  onNavigateToSupportTab={onNavigateToSupportTab}
                />

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

                  {teamSection(leftSide)}
                  <Box sx={{ mt: "16px" }}>{teamSection(rightSide)}</Box>
                </Box>

                {tabButtons(false)}
              </Box>

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
                        mb: "10px",
                        border: (theme) =>
                          `1.5px solid ${alpha(theme.palette.text.primary, 0.22)}`,
                        bgcolor: "background.paper",
                        color: "text.primary",
                        borderRadius: "14px",
                        py: "13px",
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 800,
                        fontSize: "12px",
                        lineHeight: 1,
                        letterSpacing: "0.08em",
                        cursor: "pointer",
                        boxShadow: (theme) =>
                          theme.customShadows?.card ||
                          "0 2px 8px rgba(0,0,0,0.1)",
                        "&:hover": {
                          borderColor: "primary.main",
                          bgcolor: "action.hover",
                          boxShadow: (theme) =>
                            theme.customShadows?.cardHover || "none",
                        },
                      }}
                    >
                      ＋{" "}
                      {t(
                        "peladas.dashboard.live_state.other_event",
                        "OUTRO LANCE",
                      )}{" "}
                      · DRIBLE, CHUTE, FALTA…
                    </Button>
                    <Box sx={{ display: "flex", gap: "10px" }}>
                      {renderGoalButton(leftSide, true)}
                      {renderGoalButton(rightSide, true)}
                    </Box>
                  </Box>
                </Portal>
              )}
            </>
          ) : (
            <Box
              sx={{
                p: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {liveMatchBanner}
              {activeTab === 1 && standingsComponent}
              {activeTab === 2 && timelineComponent}
              {activeTab === 3 && supportComponent}
            </Box>
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

      <MatchEventSheets
        match={match}
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
        homeList={homeList}
        awayList={awayList}
        allOnFieldPlayers={allOnFieldPlayers}
        orgPlayerIdToPlayer={orgPlayerIdToPlayer}
        getPlayerName={getPlayerName}
        clockLabel={clockLabel}
        playerTeamMap={playerTeamMap}
        goalSheet={goalSheet}
        setGoalSheet={setGoalSheet}
        eventSheet={eventSheet}
        setEventSheet={setEventSheet}
        recordEvent={recordEvent}
        adjustScore={adjustScore}
      />

      <MatchHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        matches={matches}
        selectedMatchId={match.id}
        currentMatchId={currentMatch?.id}
        teamNameById={teamNameById}
        onSelectMatch={onSelectMatch}
      />
    </Box>
  );
}
