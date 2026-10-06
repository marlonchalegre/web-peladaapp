import { useParams, Link as RouterLink } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Paper,
  Button,
  Box,
  Typography,
  Alert,
  Stack,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Grid,
  IconButton,
  type Theme,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import ReplayIcon from "@mui/icons-material/Replay";
import ShareIcon from "@mui/icons-material/Share";
import ActiveMatchDashboard from "../components/ActiveMatchDashboard";
import MatchReportSummary from "../components/MatchReportSummary";
import SupportLineupTab from "../components/SupportLineupTab";
import PeladaTabsBar from "../components/PeladaTabsBar";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../shared/components/Loading";
import { usePeladaMatches } from "../hooks/usePeladaMatches";
import StandingsPanel from "../components/StandingsPanel";
import PlayerStatsPanel from "../components/PlayerStatsPanel";
import PeladaTimeline from "../components/PeladaTimeline";
import EditTimelineEventDialog from "../components/EditTimelineEventDialog";
import { useAuth } from "../../../app/providers/AuthContext";
import { api } from "../../../shared/api/client";
import {
  createApi,
  type MatchEvent,
  type Pelada,
} from "../../../shared/api/endpoints";
import LocationDisplay from "../../../shared/components/LocationDisplay";
import dayjs from "dayjs";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AssignmentIcon from "@mui/icons-material/Assignment";
import RateReviewIcon from "@mui/icons-material/RateReview";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import HistoryIcon from "@mui/icons-material/History";
import StopIcon from "@mui/icons-material/Stop";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import GroupIcon from "@mui/icons-material/Group";
import { formatPeladaSummary } from "../utils/formatSummary";
import {
  generateExportText,
  generateAnnouncementText,
  copyToClipboard,
  type PlayerWithUser,
} from "../utils/exportUtils";
import GlobalSessionTimer from "../components/GlobalSessionTimer";
import { calculateElapsedMs, usePeladaTimer } from "../hooks/usePeladaTimer";
import PrettyConfirmDialog from "../../../shared/components/PrettyConfirmDialog";
import OfflineSyncManager from "../components/OfflineSyncManager";
import DesktopHeader from "../../../shared/components/DesktopHeader";

const endpoints = createApi(api);

const PILL_TABS = [
  {
    id: 0,
    testId: "pill-tab-live",
    labelKey: "peladas.matches.dashboard_tab",
    defaultLabel: "AO VIVO",
    showDot: true,
  },
  {
    id: 1,
    testId: "pill-tab-standings",
    labelKey: "peladas.panel.standings.title",
    defaultLabel: "TABELA",
    showDot: false,
  },
  {
    id: 2,
    testId: "pill-tab-sumula",
    labelKey: "peladas.timeline.title",
    defaultLabel: "SÚMULA",
    showDot: false,
  },
  {
    id: 3,
    testId: "tab-support-lineup",
    labelKey: "peladas.support_lineup.tab_title",
    defaultLabel: "APOIO",
    showDot: false,
  },
] as const;

interface HeaderSessionBadgeProps {
  pelada?: Pelada | null;
  isPeladaClosed: boolean;
  onStartPeladaTimer: () => Promise<void>;
  onPausePeladaTimer: () => Promise<void>;
  isAdmin?: boolean;
  onOpenResetConfirm?: () => void;
}

function HeaderSessionBadge({
  pelada,
  isPeladaClosed,
  onStartPeladaTimer,
  onPausePeladaTimer,
  isAdmin = false,
  onOpenResetConfirm,
}: HeaderSessionBadgeProps) {
  const { t } = useTranslation();
  const sessionTimer = usePeladaTimer(
    pelada?.timer_started_at,
    pelada?.timer_accumulated_ms,
    pelada?.timer_status,
    isPeladaClosed,
    onStartPeladaTimer,
    onPausePeladaTimer,
  );

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography
        sx={{
          fontFamily: "Archivo, sans-serif",
          fontWeight: 800,
          fontSize: { xs: "11px", sm: "12.5px" },
          lineHeight: 1,
          letterSpacing: ".06em",
          color: "pitch.subtle",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          whiteSpace: "nowrap",
        }}
      >
        <span>{t("peladas.matches.session_label", "SESSÃO")}</span>
        <Box
          component="span"
          data-testid="global-timer-text"
          sx={{
            color: "pitch.contrastText",
            fontWeight: 800,
          }}
        >
          {sessionTimer.formattedTime}
        </Box>
      </Typography>

      {isAdmin && !isPeladaClosed && (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          {sessionTimer.status === "running" ? (
            <IconButton
              size="small"
              onClick={sessionTimer.pause}
              data-testid="pause-global-timer-button"
              aria-label={t("common.pause")}
              sx={{ color: "pitch.contrastText", p: "2px" }}
            >
              <PauseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          ) : (
            <IconButton
              size="small"
              onClick={sessionTimer.start}
              data-testid="start-global-timer-button"
              aria-label={t("common.start")}
              sx={{ color: "pitch.contrastText", p: "2px" }}
            >
              <PlayArrowIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
          {onOpenResetConfirm && (
            <IconButton
              size="small"
              onClick={onOpenResetConfirm}
              data-testid="reset-global-timer-button"
              aria-label={t("common.reset")}
              sx={{ color: "pitch.contrastText", p: "2px" }}
            >
              <ReplayIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
        </Stack>
      )}
    </Box>
  );
}

export default function PeladaMatchesPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const peladaId = id!;
  const { user } = useAuth();
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [resetConfirmOpen, setResetConfirmOpen] = useState<{
    type: "session" | "match";
  } | null>(null);

  // Confirmation Dialog States
  const [endMatchConfirmOpen, setEndMatchConfirmOpen] = useState<string | null>(
    null,
  );
  const [closePeladaConfirmOpen, setClosePeladaConfirmOpen] = useState(false);
  const [shareMenuAnchor, setShareMenuAnchor] = useState<null | HTMLElement>(
    null,
  );

  const handleShareClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setShareMenuAnchor(event.currentTarget);
  };

  const handleShareClose = () => {
    setShareMenuAnchor(null);
  };

  const {
    loading,
    error,
    matches,
    selectedMatch,
    setSelectedMatchId,
    pelada,
    orgPlayerIdToUserId,
    orgPlayerIdToTeamId,
    orgPlayerIdToPlayer,
    userIdToName,
    matchEvents,
    currentMatchStats,
    updatingScore,
    selectMenu,
    setSelectMenu,
    recordEvent,
    deleteEventAndRefresh,
    updateEvent,
    adjustScore,
    replacePlayerOnMatchTeam,
    addPlayerToTeam,
    endMatch,
    executeClosePelada,
    setJustFinishedMatchId,
    proceedToNextMatch,
    // Insights props
    standings,
    playerStats,
    togglePlayerSort,
    teamNameById,
    teams,
    teamPlayers,
    lineupsByMatch,
    attendance,
    // Timers
    justFinishedMatch,
    nextScheduledMatch,
    activeMatchData,
    isPeladaClosed,
    closing,
    // Timer actions
    startPeladaTimer,
    pausePeladaTimer,
    resetPeladaTimer,
    startMatchTimer,
    pauseMatchTimer,
    resetMatchTimer,
    refreshStats,
    generateSupportLineup,
    updateSupportLineup,
    rerollSupportLineup,
    notifySupportLineup,
  } = usePeladaMatches(peladaId);

  const isAdmin = useMemo(() => {
    return !!(
      pelada?.is_admin ||
      isOrgAdmin ||
      (user &&
        pelada?.organization_id &&
        (pelada.creator_id === user.id ||
          user.admin_orgs?.includes(pelada.organization_id)))
    );
  }, [pelada, isOrgAdmin, user]);

  const [deleteEventConfirmOpen, setDeleteEventConfirmOpen] =
    useState<MatchEvent | null>(null);
  const [editEventDialogOpen, setEditEventDialogOpen] =
    useState<MatchEvent | null>(null);
  const editEventMatch = useMemo(() => {
    if (!editEventDialogOpen) return null;
    return matches.find((m) => m.id === editEventDialogOpen.match_id) || null;
  }, [editEventDialogOpen, matches]);

  const handleSaveEditEvent = async (
    scorerId: string,
    assistantId: string | null,
  ) => {
    if (!editEventDialogOpen) return;
    try {
      await updateEvent(
        editEventDialogOpen.match_id,
        editEventDialogOpen.id!,
        scorerId,
        assistantId,
      );
      setEditEventDialogOpen(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmDeleteEvent = async () => {
    if (!deleteEventConfirmOpen) return;
    try {
      await deleteEventAndRefresh(
        deleteEventConfirmOpen.match_id,
        deleteEventConfirmOpen.player_id,
        deleteEventConfirmOpen.event_type,
        deleteEventConfirmOpen.id,
      );
      setDeleteEventConfirmOpen(null);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (pelada?.organization_id && user && !isAdmin) {
      endpoints
        .listAdminsByOrganization(pelada.organization_id)
        .then((admins) => {
          if (admins.some((a) => a.user_id === user.id)) {
            setIsOrgAdmin(true);
          }
        })
        .catch((e) => console.error("Failed to check admin status", e));
    }
  }, [pelada?.organization_id, user, isAdmin]);

  const handleConfirmClosePelada = async () => {
    try {
      await executeClosePelada();
      setClosePeladaConfirmOpen(false);
      setJustFinishedMatchId(null);
      setActiveTab(1); // Standings & Performance tab
    } catch {
      // Error already handled in useMatchActions
    }
  };

  const liveView = !!selectedMatch && !!activeMatchData && !!pelada;

  const handleStartPeladaTimer = async () => {
    const isFinished =
      (selectedMatch?.status || "").toLowerCase() === "finished";
    const shouldStartMatchTimer =
      selectedMatch && !isFinished && selectedMatch.timer_status !== "running";

    if (shouldStartMatchTimer) {
      await Promise.all([
        startPeladaTimer(),
        startMatchTimer(selectedMatch.id),
      ]);
    } else {
      await startPeladaTimer();
    }
  };

  const handleCopyResults = async () => {
    const text = formatPeladaSummary(
      pelada?.scheduled_at || null,
      standings,
      playerStats,
    );

    const success = await copyToClipboard(text);
    if (success) {
      alert(t("peladas.matches.summary_copied"));
    }
  };

  const handleNotifySupportLineup = useCallback(async () => {
    if (pelada?.organization_id) {
      await notifySupportLineup(pelada.organization_id);
    }
  }, [pelada?.organization_id, notifySupportLineup]);

  const getFullTeamPlayers = () => {
    const full: Record<string, PlayerWithUser[]> = {};
    for (const [teamId, players] of Object.entries(teamPlayers)) {
      full[teamId] = players
        .map((p) => {
          const orgPlayer = orgPlayerIdToPlayer[p.player_id];
          if (!orgPlayer) return null;

          // Map flat properties from Player to the nested User object expected by exportUtils
          return {
            ...orgPlayer,
            is_goalkeeper: p.is_goalkeeper,
            user: {
              id: orgPlayer.user_id,
              name:
                orgPlayer.user_name ||
                userIdToName[orgPlayer.user_id] ||
                "Unknown",
              username: orgPlayer.user_username || "",
              email: orgPlayer.user_email || "",
              position: orgPlayer.position
                ? orgPlayer.position.toLowerCase()
                : orgPlayer.user_position
                  ? orgPlayer.user_position.toLowerCase()
                  : "unknown",
            },
          } as PlayerWithUser;
        })
        .filter((p): p is PlayerWithUser => p !== null);
    }
    return full;
  };

  const handleCopyTeams = async () => {
    const text = generateExportText(teams, getFullTeamPlayers(), {});
    const success = await copyToClipboard(text);
    if (success) {
      alert(t("common.actions.copy_success"));
    }
  };

  const handleCopyAnnouncement = async () => {
    const text = generateAnnouncementText(teams, getFullTeamPlayers());
    const success = await copyToClipboard(text);
    if (success) {
      alert(t("common.actions.copy_success"));
    }
  };

  const handleResetClick = (type: "session" | "match") => {
    setResetConfirmOpen({ type });
  };

  const confirmReset = async () => {
    if (!resetConfirmOpen) return;
    if (resetConfirmOpen.type === "session") {
      await resetPeladaTimer();
    } else if (resetConfirmOpen.type === "match" && selectedMatch) {
      await resetMatchTimer(selectedMatch.id);
    }
    setResetConfirmOpen(null);
  };

  if (error) return <Alert severity="error">{error}</Alert>;
  if (loading || !pelada)
    return <Loading message={t("peladas.matches.loading")} />;

  const scheduledDate = pelada?.scheduled_at
    ? dayjs(pelada.scheduled_at)
    : null;
  const dayStr = scheduledDate ? scheduledDate.format("DD") : "";
  const monthStr = scheduledDate
    ? scheduledDate.format("MMM").toUpperCase()
    : "";
  const dateStr = dayStr && monthStr ? `${dayStr}/${monthStr}` : undefined;
  const weekday = scheduledDate
    ? scheduledDate.format("ddd").toUpperCase()
    : "";
  const timeStr = scheduledDate ? scheduledDate.format("HH:mm") : "";
  const locationStr = pelada?.location || "";

  const standingsContent = (
    <Box>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <StandingsPanel
            standings={standings}
            matches={matches}
            showHighlights={isPeladaClosed}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <PlayerStatsPanel
            playerStats={playerStats}
            onToggleSort={togglePlayerSort}
            showHighlights={isPeladaClosed}
          />
        </Grid>
      </Grid>
      {isAdmin && !isPeladaClosed && (
        <Paper
          sx={{
            mt: 3,
            p: 3,
            borderRadius: 4,
            textAlign: "center",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              mb: 2,
            }}
          >
            {t(
              "peladas.matches.close_confirm_desc",
              "Ao encerrar a pelada, todas as partidas serão finalizadas e a classificação será consolidada.",
            )}
          </Typography>
          <Button
            variant="contained"
            color="error"
            startIcon={<StopIcon />}
            onClick={() => setClosePeladaConfirmOpen(true)}
            disabled={closing}
            data-testid="close-pelada-button"
            sx={{ borderRadius: 2, px: 4 }}
          >
            {closing
              ? t("common.sending")
              : t("peladas.matches.button.close_pelada")}
          </Button>
        </Paper>
      )}
    </Box>
  );

  const timelineContent = (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <PeladaTimeline
        events={matchEvents}
        userIdToName={userIdToName}
        orgPlayerIdToUserId={orgPlayerIdToUserId}
        teamNameById={teamNameById}
        matches={matches}
        orgPlayerIdToTeamId={orgPlayerIdToTeamId}
        lineupsByMatch={lineupsByMatch}
        teamPlayers={teamPlayers}
        isAdmin={isAdmin}
        onEditClick={(event) => setEditEventDialogOpen(event)}
        onDeleteClick={(event) => setDeleteEventConfirmOpen(event)}
      />
    </Box>
  );

  const supportContent = (
    <SupportLineupTab
      matches={matches}
      teams={teams}
      teamPlayers={teamPlayers}
      orgPlayerIdToUserId={orgPlayerIdToUserId}
      userIdToName={userIdToName}
      orgPlayerIdToPlayer={orgPlayerIdToPlayer}
      attendance={attendance}
      isAdmin={isAdmin}
      onGenerateAll={generateSupportLineup}
      onUpdateMatch={updateSupportLineup}
      onRerollMatch={rerollSupportLineup}
      onNotifyWhatsApp={
        pelada?.organization_id ? handleNotifySupportLineup : undefined
      }
    />
  );

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {!liveView && (
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <DesktopHeader currentOrgName={pelada?.organization_name} />
        </Box>
      )}
      {!liveView && (
        <PeladaTabsBar
          peladaId={peladaId}
          dateStr={dateStr}
          status={pelada?.status}
          active="matches"
        />
      )}

      {liveView && (
        <Box
          component="header"
          sx={{
            display: "flex",
            flexWrap: { xs: "wrap", lg: "nowrap" },
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "pitch.main",
            color: "pitch.contrastText",
            px: { xs: "12px", sm: "18px", md: "22px" },
            minHeight: { xs: "auto", lg: "64px" },
            width: "100%",
            flexShrink: 0,
            boxSizing: "border-box",
            gap: { xs: 0, lg: 2 },
          }}
        >
          {/* Logo & App Brand */}
          <Box
            sx={{
              order: 1,
              display: "flex",
              alignItems: "center",
              gap: { xs: "10px", md: "18px" },
              height: { xs: "52px", lg: "64px" },
              flexShrink: 0,
            }}
          >
            <Box
              component={RouterLink}
              to="/home"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "9px",
                textDecoration: "none",
                color: "pitch.contrastText",
              }}
            >
              <Box
                component="img"
                src="/logo.png"
                alt={t("navigation.app_name", "MINHA PELADA")}
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "7px",
                  objectFit: "contain",
                  display: "block",
                }}
              />
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: "12.5px",
                  lineHeight: 1,
                  letterSpacing: ".1em",
                  color: "pitch.contrastText",
                  display: { xs: "none", sm: "block" },
                }}
              >
                {t("navigation.app_name", "MINHA PELADA")}
              </Typography>
            </Box>

            <Box
              sx={{
                display: { xs: "none", lg: "flex" },
                gap: "16px",
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "12px",
                color: "pitch.subtle",
              }}
            >
              <Box
                component={RouterLink}
                to="/home"
                sx={{
                  color: "pitch.subtle",
                  textDecoration: "none",
                  "&:hover": { color: "pitch.contrastText" },
                }}
              >
                {t("peladas.matches.breadcrumb_home", "Início")}
              </Box>
              <Box
                component={RouterLink}
                to="/profile"
                sx={{
                  color: "pitch.subtle",
                  textDecoration: "none",
                  "&:hover": { color: "pitch.contrastText" },
                }}
              >
                {t("peladas.matches.breadcrumb_profile", "Minha ficha")}
              </Box>
            </Box>
          </Box>

          {/* Centered Segmented Pill Tabs */}
          <Box
            sx={{
              order: { xs: 3, lg: 2 },
              width: { xs: "100%", lg: "auto" },
              display: "flex",
              justifyContent: "center",
              py: { xs: "6px", lg: 0 },
              borderTop: {
                xs: "1px solid rgba(255,255,255,0.08)",
                lg: "none",
              },
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                bgcolor: "rgba(0,0,0,0.28)",
                borderRadius: "20px",
                p: "3px",
                border: "1px solid rgba(255,255,255,0.08)",
                width: "auto",
                maxWidth: "100%",
                gap: "3px",
                overflowX: "auto",
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": { display: "none" },
              }}
            >
              {PILL_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <Button
                    key={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    size="small"
                    onClick={() => setActiveTab(tab.id)}
                    data-testid={tab.testId}
                    sx={{
                      flexShrink: 0,
                      borderRadius: "16px",
                      px: { xs: "10px", sm: "14px" },
                      py: "5px",
                      minHeight: 0,
                      minWidth: 0,
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: { xs: "11px", sm: "11.5px" },
                      letterSpacing: ".04em",
                      color: isActive ? "pitch.contrastText" : "pitch.subtle",
                      bgcolor: isActive
                        ? "rgba(255,255,255,0.18)"
                        : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      whiteSpace: "nowrap",
                      "&:hover": {
                        bgcolor: isActive
                          ? "rgba(255,255,255,0.24)"
                          : "rgba(255,255,255,0.06)",
                        color: "pitch.contrastText",
                      },
                    }}
                  >
                    {tab.showDot && (
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          bgcolor:
                            selectedMatch &&
                            activeMatchData &&
                            !activeMatchData.finished
                              ? "#4ade80"
                              : "text.disabled",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    {t(tab.labelKey, tab.defaultLabel)}
                  </Button>
                );
              })}
            </Box>
          </Box>

          {/* Right actions: Session Timer & Org badge */}
          <Box
            sx={{
              order: { xs: 2, lg: 3 },
              display: "flex",
              alignItems: "center",
              gap: { xs: "8px", sm: "14px" },
              height: { xs: "52px", lg: "64px" },
              ml: { xs: "auto", lg: 0 },
              flexShrink: 0,
            }}
          >
            {pelada && (
              <HeaderSessionBadge
                pelada={pelada}
                isPeladaClosed={isPeladaClosed}
                onStartPeladaTimer={handleStartPeladaTimer}
                onPausePeladaTimer={pausePeladaTimer}
                isAdmin={isAdmin}
                onOpenResetConfirm={() => handleResetClick("session")}
              />
            )}

            <IconButton
              onClick={handleShareClick}
              data-testid="share-dropdown-button"
              aria-label={t("common.share", "Compartilhar")}
              sx={{
                width: 34,
                height: 34,
                borderRadius: "10px",
                border: "1.5px solid rgba(255,255,255,0.18)",
                bgcolor: "rgba(0,0,0,0.2)",
                color: "pitch.contrastText",
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.1)",
                },
              }}
            >
              <ShareIcon sx={{ fontSize: 18 }} />
            </IconButton>

            {pelada?.status === "voting" && (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<RateReviewIcon sx={{ fontSize: "16px" }} />}
                component={RouterLink}
                to={`/peladas/${peladaId}/voting`}
                size="small"
                sx={{
                  borderRadius: "9px",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: "11px",
                  letterSpacing: ".04em",
                  px: 1.5,
                  py: "6px",
                }}
              >
                {t("peladas.detail.button.vote")}
              </Button>
            )}

            <Box
              component={RouterLink}
              to={
                pelada?.organization_id
                  ? `/organizations/${pelada.organization_id}`
                  : "/home"
              }
              sx={{
                display: { xs: "none", sm: "inline-flex" },
                alignItems: "center",
                padding: "6px 12px",
                border: "1.5px solid rgba(255,255,255,.25)",
                borderRadius: "9px",
                bgcolor: "rgba(255,255,255,.06)",
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "11px",
                lineHeight: 1,
                color: "pitch.contrastText",
                textDecoration: "none",
                whiteSpace: "nowrap",
                "&:hover": {
                  borderColor: "pitch.contrastText",
                  bgcolor: "rgba(255,255,255,.12)",
                },
              }}
            >
              {pelada?.organization_name || "100Fôlego"}
            </Box>
          </Box>
        </Box>
      )}

      <Box
        id="pelada-matches-page-container"
        sx={{
          maxWidth: liveView ? { xs: "100%", md: 1024, lg: 1200 } : 1124,
          mx: "auto",
          width: "100%",
          flex: 1,
          px: liveView ? 0 : { xs: 2, md: 4 },
          pt: liveView ? 0 : { xs: 2.5, md: 3.5 },
          pb: liveView ? 0 : 5,
          boxSizing: "border-box",
        }}
      >
        <OfflineSyncManager
          peladaId={peladaId}
          onSyncComplete={() => refreshStats()}
        />

        {!liveView && (
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 2,
              mb: 3,
            }}
          >
            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "9.5px",
                  letterSpacing: ".16em",
                  color: "text.secondary",
                  textTransform: "uppercase",
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    fontFamily: "inherit",
                    fontWeight: "inherit",
                    fontSize: "inherit",
                    letterSpacing: "inherit",
                    color: "inherit",
                    textTransform: "inherit",
                  }}
                >
                  {pelada?.organization_name || t("common.organization")}
                  {dateStr ? ` · ${weekday} ${dateStr}` : ""}
                  {timeStr ? ` · ${timeStr}` : ""}
                </Typography>
                {locationStr && (
                  <>
                    <Typography
                      component="span"
                      sx={{
                        mx: 0.5,
                        fontFamily: "inherit",
                        fontSize: "inherit",
                        color: "inherit",
                      }}
                    >
                      ·
                    </Typography>
                    <LocationDisplay
                      location={locationStr}
                      textSx={{
                        fontFamily: "inherit",
                        fontWeight: "inherit",
                        fontSize: "inherit",
                        letterSpacing: "inherit",
                        color: "primary.main",
                        textTransform: "inherit",
                      }}
                    />
                  </>
                )}
              </Box>

              <Typography
                variant="h2"
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: { xs: "22px", md: "28px" },
                  color: "text.primary",
                  mt: 0.5,
                  letterSpacing: "-0.01em",
                  lineHeight: 1.2,
                }}
              >
                {activeTab === 2
                  ? t("peladas.matches.title_sumula", "Súmula dos Jogos")
                  : activeTab === 1
                    ? `${t("peladas.panel.standings.title")} & ${t("peladas.panel.stats.title")}`
                    : activeTab === 3
                      ? t(
                          "peladas.support_lineup.tab_title",
                          "Escalação de Apoio",
                        )
                      : t("peladas.matches.dashboard_tab", "Dashboard")}
              </Typography>
            </Box>

            {/* Header Action Tools */}
            <Stack
              direction="row"
              spacing={1.5}
              sx={{
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              {pelada && (
                <GlobalSessionTimer
                  pelada={pelada}
                  isAdmin={isAdmin}
                  onStartPelada={handleStartPeladaTimer}
                  onPausePelada={pausePeladaTimer}
                  onOpenResetConfirm={() => handleResetClick("session")}
                />
              )}

              <Button
                variant="outlined"
                onClick={handleShareClick}
                size="small"
                data-testid="share-dropdown-button"
                sx={{
                  borderRadius: "10px",
                  border: (theme) => `1.5px solid ${theme.palette.divider}`,
                  bgcolor: "background.paper",
                  color: "text.primary",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: "11.5px",
                  letterSpacing: ".04em",
                  textTransform: "none",
                  px: 2,
                  py: 1,
                  display: "flex",
                  alignItems: "center",
                  "&:hover": {
                    borderColor: "text.primary",
                    bgcolor: "action.hover",
                  },
                }}
              >
                <Box
                  component="span"
                  sx={{ display: { xs: "none", sm: "inline" } }}
                >
                  {t("common.export")}
                </Box>
                <KeyboardArrowDownIcon
                  sx={{ ml: { xs: 0, sm: 0.75 }, fontSize: "18px" }}
                />
              </Button>

              {pelada?.status === "voting" && (
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<RateReviewIcon sx={{ fontSize: "16px" }} />}
                  component={RouterLink}
                  to={`/peladas/${peladaId}/voting`}
                  size="small"
                  sx={{
                    borderRadius: "10px",
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 800,
                    fontSize: "11.5px",
                    letterSpacing: ".04em",
                    px: 2,
                    py: 1,
                  }}
                >
                  {t("peladas.detail.button.vote")}
                </Button>
              )}
            </Stack>
          </Box>
        )}

        {/* Main Content Tabs */}
        {!liveView && (
          <Box
            sx={{
              mb: 3,
              borderBottom: (theme) => `1.5px solid ${theme.palette.divider}`,
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: "unset",
                "& .MuiTabs-indicator": {
                  height: "3px",
                  bgcolor: "text.primary",
                  borderRadius: "3px 3px 0 0",
                },
                "& .MuiTabs-flexContainer": {
                  gap: 0.5,
                },
              }}
            >
              <Tab
                icon={<SportsSoccerIcon sx={{ fontSize: "17px" }} />}
                iconPosition="start"
                label={
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                  >
                    <span>
                      {t("peladas.matches.dashboard_tab", "Dashboard")}
                    </span>
                    {selectedMatch &&
                      activeMatchData &&
                      !activeMatchData.finished && (
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            bgcolor: "success.main",
                            display: "inline-block",
                          }}
                        />
                      )}
                  </Box>
                }
                sx={{
                  minHeight: "unset",
                  py: "11px",
                  px: "16px",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: activeTab === 0 ? 800 : 700,
                  fontSize: "11.5px",
                  letterSpacing: ".04em",
                  textTransform: "uppercase",
                  color: activeTab === 0 ? "text.primary" : "text.secondary",
                  "&.Mui-selected": { color: "text.primary" },
                  "&:hover": { color: "text.primary" },
                }}
              />
              <Tab
                icon={<AssessmentIcon sx={{ fontSize: "17px" }} />}
                iconPosition="start"
                label={`${t("peladas.panel.standings.title")} & ${t("peladas.panel.stats.title")}`}
                sx={{
                  minHeight: "unset",
                  py: "11px",
                  px: "16px",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: activeTab === 1 ? 800 : 700,
                  fontSize: "11.5px",
                  letterSpacing: ".04em",
                  textTransform: "uppercase",
                  color: activeTab === 1 ? "text.primary" : "text.secondary",
                  "&.Mui-selected": { color: "text.primary" },
                  "&:hover": { color: "text.primary" },
                }}
              />
              <Tab
                icon={<HistoryIcon sx={{ fontSize: "17px" }} />}
                iconPosition="start"
                label={t("peladas.timeline.title")}
                sx={{
                  minHeight: "unset",
                  py: "11px",
                  px: "16px",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: activeTab === 2 ? 800 : 700,
                  fontSize: "11.5px",
                  letterSpacing: ".04em",
                  textTransform: "uppercase",
                  color: activeTab === 2 ? "text.primary" : "text.secondary",
                  "&.Mui-selected": { color: "text.primary" },
                  "&:hover": { color: "text.primary" },
                }}
              />
              <Tab
                icon={<AssignmentIcon sx={{ fontSize: "17px" }} />}
                iconPosition="start"
                label={t(
                  "peladas.support_lineup.tab_title",
                  "Escalação de Apoio",
                )}
                data-testid="tab-support-lineup"
                sx={{
                  minHeight: "unset",
                  py: "11px",
                  px: "16px",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: activeTab === 3 ? 800 : 700,
                  fontSize: "11.5px",
                  letterSpacing: ".04em",
                  textTransform: "uppercase",
                  color: activeTab === 3 ? "text.primary" : "text.secondary",
                  "&.Mui-selected": { color: "text.primary" },
                  "&:hover": { color: "text.primary" },
                }}
              />
            </Tabs>
          </Box>
        )}

        {/* Tab Content */}
        <Box sx={{ minHeight: 400 }} id="pelada-matches-tabs-content">
          {liveView ? (
            <ActiveMatchDashboard
              match={selectedMatch!}
              pelada={pelada!}
              homeTeamName={teamNameById[selectedMatch!.home_team_id]}
              awayTeamName={teamNameById[selectedMatch!.away_team_id]}
              homePlayers={activeMatchData!.homePlayers}
              awayPlayers={activeMatchData!.awayPlayers}
              orgPlayerIdToUserId={orgPlayerIdToUserId}
              userIdToName={userIdToName}
              orgPlayerIdToPlayer={orgPlayerIdToPlayer}
              statsMap={currentMatchStats}
              benchPlayers={activeMatchData!.benchPlayers}
              finished={activeMatchData!.finished}
              isAdmin={isAdmin}
              updating={!!updatingScore[selectedMatch!.id]}
              selectMenu={selectMenu}
              setSelectMenu={setSelectMenu}
              playersPerTeam={pelada?.players_per_team}
              standings={standings}
              matchEvents={matchEvents}
              activeTab={activeTab}
              onNavigateToLive={() => setActiveTab(0)}
              onNavigateToTimeline={() => setActiveTab(2)}
              onNavigateToStandings={() => setActiveTab(1)}
              onNavigateToSupportTab={() => setActiveTab(3)}
              standingsComponent={standingsContent}
              timelineComponent={timelineContent}
              supportComponent={supportContent}
              onStartMatch={async (mid) => {
                const promises: Promise<unknown>[] = [startMatchTimer(mid)];
                if (pelada?.timer_status !== "running") {
                  promises.push(startPeladaTimer());
                }
                await Promise.all(promises);
              }}
              onPauseMatch={pauseMatchTimer}
              onOpenResetConfirm={handleResetClick}
              recordEvent={(mid, pid, type, st, mt, assistantId, teamId) =>
                recordEvent(
                  mid,
                  pid,
                  type,
                  st ??
                    calculateElapsedMs(
                      pelada?.timer_started_at,
                      pelada?.timer_accumulated_ms,
                      pelada?.timer_status,
                      isPeladaClosed,
                    ),
                  mt ??
                    calculateElapsedMs(
                      selectedMatch!.timer_started_at,
                      selectedMatch!.timer_accumulated_ms,
                      selectedMatch!.timer_status,
                      (selectedMatch!.status || "").toLowerCase() ===
                        "finished",
                    ),
                  assistantId,
                  teamId,
                )
              }
              deleteEventAndRefresh={(mid, pid, type) =>
                deleteEventAndRefresh(mid, pid, type)
              }
              adjustScore={adjustScore}
              replacePlayerOnTeam={(teamId, outId, inId) =>
                replacePlayerOnMatchTeam(selectedMatch!.id, teamId, outId, inId)
              }
              addPlayerToTeam={(teamId, playerId) =>
                addPlayerToTeam(selectedMatch!.id, teamId, playerId)
              }
              onEndMatch={() => setEndMatchConfirmOpen(selectedMatch!.id)}
              matches={matches}
              onSelectMatch={setSelectedMatchId}
              teamNameById={teamNameById}
              playerTeamMap={orgPlayerIdToTeamId}
            />
          ) : (
            <>
              {activeTab === 0 && (
                <Paper sx={{ p: 8, textAlign: "center", borderRadius: 4 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      color: "text.secondary",
                    }}
                  >
                    {t("peladas.matches.select_match_hint")}
                  </Typography>
                </Paper>
              )}
              {activeTab === 1 && standingsContent}
              {activeTab === 2 && timelineContent}
              {activeTab === 3 && supportContent}
            </>
          )}
        </Box>
      </Box>

      <Menu
        anchorEl={shareMenuAnchor}
        open={Boolean(shareMenuAnchor)}
        onClose={handleShareClose}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "12px",
              border: (theme: Theme) => `1.5px solid ${theme.palette.divider}`,
              boxShadow: (theme: Theme) =>
                theme.customShadows?.dropdown || "none",
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            handleCopyResults();
            handleShareClose();
          }}
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 700,
            fontSize: "12px",
          }}
        >
          <ListItemIcon>
            <AssessmentIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "12px",
              }}
            >
              {t("peladas.matches.share_summary")}
            </Typography>
          </ListItemText>
        </MenuItem>
        {pelada?.status !== "closed" && [
          <MenuItem
            key="copy-announcement"
            onClick={() => {
              handleCopyAnnouncement();
              handleShareClose();
            }}
          >
            <ListItemIcon>
              <ContentCopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "12px",
                }}
              >
                {t("peladas.detail.button.copy_announcement")}
              </Typography>
            </ListItemText>
          </MenuItem>,
          <MenuItem
            key="copy-teams"
            onClick={() => {
              handleCopyTeams();
              handleShareClose();
            }}
          >
            <ListItemIcon>
              <GroupIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "12px",
                }}
              >
                {t("peladas.detail.button.copy_teams")}
              </Typography>
            </ListItemText>
          </MenuItem>,
        ]}
      </Menu>

      {justFinishedMatch && (
        <MatchReportSummary
          open={!!justFinishedMatch}
          onClose={() => setJustFinishedMatchId(null)}
          match={justFinishedMatch}
          homeTeamName={teamNameById[justFinishedMatch.home_team_id]}
          awayTeamName={teamNameById[justFinishedMatch.away_team_id]}
          events={matchEvents.filter(
            (e) => e.match_id === justFinishedMatch.id,
          )}
          userIdToName={userIdToName}
          orgPlayerIdToUserId={orgPlayerIdToUserId}
          orgPlayerIdToTeamId={orgPlayerIdToTeamId}
          lineupsByMatch={lineupsByMatch}
          teamPlayers={teamPlayers}
          teamNameById={teamNameById}
          nextMatch={nextScheduledMatch}
          onProceedToNext={proceedToNextMatch}
          onClosePelada={() => setClosePeladaConfirmOpen(true)}
          isPeladaClosed={isPeladaClosed}
          isAdmin={isAdmin}
          closing={closing}
        />
      )}
      {/* Pretty Confirm Dialogs */}
      <PrettyConfirmDialog
        open={Boolean(resetConfirmOpen)}
        title={t("common.confirm")}
        description={
          resetConfirmOpen?.type === "session"
            ? t(
                "peladas.matches.reset_session_confirm",
                "Tem certeza que deseja zerar o cronômetro da sessão? Isso não pode ser desfeito.",
              )
            : t(
                "peladas.matches.reset_match_confirm",
                "Tem certeza que deseja zerar o cronômetro desta partida?",
              )
        }
        onConfirm={confirmReset}
        onClose={() => setResetConfirmOpen(null)}
        severity="warning"
      />
      <PrettyConfirmDialog
        open={Boolean(endMatchConfirmOpen)}
        title={t("common.confirm")}
        description={t("peladas.matches.confirm_end_match")}
        onConfirm={() => endMatchConfirmOpen && endMatch(endMatchConfirmOpen)}
        onClose={() => setEndMatchConfirmOpen(null)}
        severity="error"
      />
      <PrettyConfirmDialog
        open={closePeladaConfirmOpen}
        title={t("common.confirm")}
        description={t("peladas.matches.confirm_close_pelada")}
        onConfirm={handleConfirmClosePelada}
        onClose={() => setClosePeladaConfirmOpen(false)}
        severity="error"
      />
      {/* Delete Event Dialog */}
      <PrettyConfirmDialog
        open={Boolean(deleteEventConfirmOpen)}
        title={t("common.confirm")}
        description={t(
          "peladas.matches.delete_event_confirm",
          "Tem certeza que deseja deletar este evento? Se for um gol, a assistência associada também será deletada.",
        )}
        onConfirm={handleConfirmDeleteEvent}
        onClose={() => setDeleteEventConfirmOpen(null)}
        severity="error"
      />
      {/* Edit Event Dialog */}
      {Boolean(editEventDialogOpen) && (
        <EditTimelineEventDialog
          open={Boolean(editEventDialogOpen)}
          key={editEventDialogOpen?.id}
          event={editEventDialogOpen}
          match={editEventMatch}
          pelada={pelada}
          onClose={() => setEditEventDialogOpen(null)}
          onSave={handleSaveEditEvent}
          orgPlayerIdToPlayer={orgPlayerIdToPlayer}
          orgPlayerIdToUserId={orgPlayerIdToUserId}
          userIdToName={userIdToName}
          teamNameById={teamNameById}
          lineupsByMatch={lineupsByMatch}
          teamPlayers={teamPlayers}
          orgPlayerIdToTeamId={orgPlayerIdToTeamId}
          matchEvents={matchEvents}
          attendance={attendance}
        />
      )}
    </Box>
  );
}
