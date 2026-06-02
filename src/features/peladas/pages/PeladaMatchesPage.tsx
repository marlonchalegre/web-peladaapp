import { useParams, Link as RouterLink } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import {
  Paper,
  Button,
  Box,
  Typography,
  Alert,
  Stack,
  Container,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import ActiveMatchDashboard from "../components/ActiveMatchDashboard";
import MatchReportSummary from "../components/MatchReportSummary";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../shared/components/Loading";
import { usePeladaMatches } from "../hooks/usePeladaMatches";
import StandingsPanel from "../components/StandingsPanel";
import PlayerStatsPanel from "../components/PlayerStatsPanel";
import PeladaTimeline from "../components/PeladaTimeline";
import { useAuth } from "../../../app/providers/AuthContext";
import { api } from "../../../shared/api/client";
import { createApi, type MatchEvent } from "../../../shared/api/endpoints";
import BreadcrumbNav from "../../../shared/components/BreadcrumbNav";
import AssessmentIcon from "@mui/icons-material/Assessment";
import RateReviewIcon from "@mui/icons-material/RateReview";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import HistoryIcon from "@mui/icons-material/History";
import StopIcon from "@mui/icons-material/Stop";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import GroupIcon from "@mui/icons-material/Group";
import { formatPeladaSummary } from "../utils/formatSummary";
import {
  generateExportText,
  generateAnnouncementText,
  type PlayerWithUser,
} from "../utils/exportUtils";
import GlobalSessionTimer from "../components/GlobalSessionTimer";
import { usePeladaTimer } from "../hooks/usePeladaTimer";
import PrettyConfirmDialog from "../../../shared/components/PrettyConfirmDialog";
import OfflineSyncManager from "../components/OfflineSyncManager";

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
    selectedMatchId,
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
  const [selectedScorerId, setSelectedScorerId] = useState<string>("");
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>("");

  const getPlayerName = (playerId: string) => {
    const userId = orgPlayerIdToUserId[playerId];
    return userId && userIdToName[userId]
      ? userIdToName[userId]
      : `Player #${playerId}`;
  };

  const currentAssistEvent = useMemo(() => {
    if (!editEventDialogOpen || editEventDialogOpen.event_type !== "goal")
      return null;
    const scorerTeamId = orgPlayerIdToTeamId[editEventDialogOpen.player_id];
    return matchEvents.find(
      (e) =>
        e.match_id === editEventDialogOpen.match_id &&
        e.event_type === "assist" &&
        ((e.parent_event_id && e.parent_event_id === editEventDialogOpen.id) ||
          (!e.parent_event_id &&
            e.session_time_ms === editEventDialogOpen.session_time_ms &&
            e.match_time_ms === editEventDialogOpen.match_time_ms &&
            (!scorerTeamId ||
              orgPlayerIdToTeamId[e.player_id] === scorerTeamId))),
    );
  }, [editEventDialogOpen, matchEvents, orgPlayerIdToTeamId]);

  useEffect(() => {
    if (editEventDialogOpen) {
      setSelectedScorerId(editEventDialogOpen.player_id);
      setSelectedAssistantId(
        currentAssistEvent ? currentAssistEvent.player_id : "none",
      );
    } else {
      setSelectedScorerId("");
      setSelectedAssistantId("");
    }
  }, [editEventDialogOpen, currentAssistEvent]);

  const editEventMatch = useMemo(() => {
    if (!editEventDialogOpen) return null;
    return matches.find((m) => m.id === editEventDialogOpen.match_id) || null;
  }, [editEventDialogOpen, matches]);

  const editScorerOptions = useMemo(() => {
    if (!editEventMatch || !editEventDialogOpen) return [];
    const scorerTeamId = orgPlayerIdToTeamId[editEventDialogOpen.player_id];
    if (!scorerTeamId) {
      const lu = lineupsByMatch[editEventMatch.id] || {};
      const homeTeamPlayers =
        lu[editEventMatch.home_team_id] ||
        teamPlayers[editEventMatch.home_team_id] ||
        [];
      const awayTeamPlayers =
        lu[editEventMatch.away_team_id] ||
        teamPlayers[editEventMatch.away_team_id] ||
        [];
      return [...homeTeamPlayers, ...awayTeamPlayers];
    }
    const lu = lineupsByMatch[editEventMatch.id] || {};
    return lu[scorerTeamId] || teamPlayers[scorerTeamId] || [];
  }, [
    editEventMatch,
    editEventDialogOpen,
    teamPlayers,
    lineupsByMatch,
    orgPlayerIdToTeamId,
  ]);

  const editAssistantOptions = useMemo(() => {
    if (!editEventMatch || !selectedScorerId) return [];
    const scorerTeamId = orgPlayerIdToTeamId[selectedScorerId];
    if (!scorerTeamId) return [];
    const lu = lineupsByMatch[editEventMatch.id] || {};
    const teamPlayersList = lu[scorerTeamId] || teamPlayers[scorerTeamId] || [];
    return teamPlayersList.filter((p) => p.player_id !== selectedScorerId);
  }, [
    editEventMatch,
    selectedScorerId,
    teamPlayers,
    lineupsByMatch,
    orgPlayerIdToTeamId,
  ]);

  const handleScorerChange = (newScorerId: string) => {
    setSelectedScorerId(newScorerId);
    const oldTeamId = selectedScorerId
      ? orgPlayerIdToTeamId[selectedScorerId]
      : null;
    const newTeamId = newScorerId ? orgPlayerIdToTeamId[newScorerId] : null;
    if (newScorerId === selectedAssistantId || oldTeamId !== newTeamId) {
      setSelectedAssistantId("none");
    }
  };

  const handleSaveEditEvent = async () => {
    if (!editEventDialogOpen) return;
    try {
      await updateEvent(
        editEventDialogOpen.match_id,
        editEventDialogOpen.id!,
        selectedScorerId,
        selectedAssistantId === "none" ? null : selectedAssistantId,
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
        deleteEventConfirmOpen.event_type as "goal" | "assist" | "own_goal",
        deleteEventConfirmOpen.id,
      );
      setDeleteEventConfirmOpen(null);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (pelada?.organization_id && user && !isAdmin) {
      const endpoints = createApi(api);
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
      setActiveTab(2); // Performance tab
    } catch {
      // Error already handled in useMatchActions
    }
  };

  const selectedMatch = matches.find((m) => m.id === selectedMatchId) || null;

  const peladaTimer = usePeladaTimer(
    pelada?.timer_started_at,
    pelada?.timer_accumulated_ms,
    pelada?.timer_status,
    isPeladaClosed,
  );

  const matchTimer = usePeladaTimer(
    selectedMatch?.timer_started_at,
    selectedMatch?.timer_accumulated_ms,
    selectedMatch?.timer_status,
    (selectedMatch?.status || "").toLowerCase() === "finished",
  );

  const handleCopyResults = async () => {
    const text = formatPeladaSummary(
      pelada?.scheduled_at || null,
      standings,
      playerStats,
    );

    try {
      await navigator.clipboard.writeText(text);
      alert(t("peladas.matches.summary_copied"));
    } catch (err) {
      console.error("Error copying to clipboard:", err);
    }
  };

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
    try {
      await navigator.clipboard.writeText(text);
      alert(t("common.actions.copy_success"));
    } catch (err) {
      console.error("Error copying to clipboard:", err);
    }
  };

  const handleCopyAnnouncement = async () => {
    const text = generateAnnouncementText(teams, getFullTeamPlayers());
    try {
      await navigator.clipboard.writeText(text);
      alert(t("common.actions.copy_success"));
    } catch (err) {
      console.error("Error copying to clipboard:", err);
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

  if (loading) return <Loading message={t("peladas.matches.loading")} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100%" }}>
      <Container
        maxWidth="lg"
        sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1, sm: 2 } }}
        disableGutters
      >
        <Box sx={{ px: { xs: 1.5, sm: 0 } }}>
          <BreadcrumbNav
            items={[
              {
                label: pelada?.organization_name || t("common.organization"),
                path: `/organizations/${pelada?.organization_id}`,
              },
              {
                label: t("peladas.detail.title"),
                path: `/peladas/${peladaId}`,
              },
              { label: t("peladas.detail.button.view_matches") },
            ]}
          />
        </Box>

        <OfflineSyncManager
          peladaId={peladaId}
          onSyncComplete={() => refreshStats()}
        />

        <Box
          sx={{
            mb: 3,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          {/* Left spacer for desktop to keep timer centered */}
          <Box sx={{ flex: 1, display: { xs: "none", md: "block" } }} />

          {/* Integrated Session Timer (Centered) */}
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            {pelada && (
              <GlobalSessionTimer
                pelada={pelada}
                isAdmin={isAdmin}
                onStartPelada={startPeladaTimer}
                onPausePelada={pausePeladaTimer}
                onOpenResetConfirm={() => handleResetClick("session")}
              />
            )}
          </Box>

          <Stack
            direction="row"
            spacing={1}
            sx={{
              flexWrap: "wrap",
              flex: 1,
              justifyContent: { xs: "center", md: "flex-end" },
              width: { xs: "100%", md: "auto" },
              gap: 1,
            }}
          >
            <Button
              variant="outlined"
              onClick={handleShareClick}
              size="small"
              data-testid="share-dropdown-button"
              sx={{
                minWidth: { xs: "40px", sm: "auto" },
                px: { xs: 0, sm: 2 },
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textTransform: "none",
              }}
            >
              <Box
                component="span"
                sx={{ display: { xs: "none", sm: "inline" } }}
              >
                {t("common.export")}
              </Box>
              <KeyboardArrowDownIcon sx={{ ml: { xs: 0, sm: 1 } }} />
            </Button>
            <Menu
              anchorEl={shareMenuAnchor}
              open={Boolean(shareMenuAnchor)}
              onClose={handleShareClose}
            >
              <MenuItem
                onClick={() => {
                  handleCopyResults();
                  handleShareClose();
                }}
              >
                <ListItemIcon>
                  <AssessmentIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>
                  {t("peladas.matches.share_summary")}
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
                    {t("peladas.detail.button.copy_announcement")}
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
                    {t("peladas.detail.button.copy_teams")}
                  </ListItemText>
                </MenuItem>,
              ]}
            </Menu>

            {pelada?.status === "voting" && (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<RateReviewIcon />}
                component={RouterLink}
                to={`/peladas/${peladaId}/voting`}
                size="small"
              >
                {t("peladas.detail.button.vote")}
              </Button>
            )}
          </Stack>
        </Box>

        {/* Main Content Tabs */}
        <Box sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab icon={<SportsSoccerIcon />} label="Dashboard" />
            <Tab
              icon={<FormatListNumberedIcon />}
              label={t("peladas.panel.standings.title")}
            />
            <Tab
              icon={<AssessmentIcon />}
              label={t("peladas.panel.stats.title")}
            />
            <Tab icon={<HistoryIcon />} label={t("peladas.timeline.title")} />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ minHeight: 400 }} id="pelada-matches-tabs-content">
          {activeTab === 0 &&
            (selectedMatch && activeMatchData && pelada ? (
              <ActiveMatchDashboard
                match={selectedMatch}
                pelada={pelada}
                homeTeamName={teamNameById[selectedMatch.home_team_id]}
                awayTeamName={teamNameById[selectedMatch.away_team_id]}
                homePlayers={activeMatchData.homePlayers}
                awayPlayers={activeMatchData.awayPlayers}
                orgPlayerIdToUserId={orgPlayerIdToUserId}
                userIdToName={userIdToName}
                orgPlayerIdToPlayer={orgPlayerIdToPlayer}
                statsMap={currentMatchStats}
                benchPlayers={activeMatchData.benchPlayers}
                finished={activeMatchData.finished}
                isAdmin={isAdmin}
                updating={!!updatingScore[selectedMatch.id]}
                selectMenu={selectMenu}
                setSelectMenu={setSelectMenu}
                playersPerTeam={pelada?.players_per_team}
                onStartMatch={async (mid) => {
                  if (pelada?.timer_status !== "running") {
                    await startPeladaTimer();
                  }
                  await startMatchTimer(mid);
                }}
                onPauseMatch={pauseMatchTimer}
                onResetMatch={resetMatchTimer}
                onOpenResetConfirm={handleResetClick}
                recordEvent={(mid, pid, type, st, mt, assistantId) =>
                  recordEvent(
                    mid,
                    pid,
                    type,
                    st ?? peladaTimer.elapsedMs,
                    mt ?? matchTimer.elapsedMs,
                    assistantId,
                  )
                }
                deleteEventAndRefresh={(mid, pid, type) =>
                  deleteEventAndRefresh(mid, pid, type)
                }
                adjustScore={adjustScore}
                replacePlayerOnTeam={(teamId, outId, inId) =>
                  replacePlayerOnMatchTeam(
                    selectedMatch.id,
                    teamId,
                    outId,
                    inId,
                  )
                }
                addPlayerToTeam={(teamId, playerId) =>
                  addPlayerToTeam(selectedMatch.id, teamId, playerId)
                }
                onEndMatch={() => setEndMatchConfirmOpen(selectedMatch.id)}
                matches={matches}
                onSelectMatch={setSelectedMatchId}
                teamNameById={teamNameById}
              />
            ) : (
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
            ))}
          {activeTab === 1 && (
            <Paper sx={{ borderRadius: 4, overflow: "hidden", p: 2 }}>
              <StandingsPanel
                standings={standings}
                showHighlights={isPeladaClosed}
              />
              {isAdmin && !isPeladaClosed && (
                <Box
                  sx={{
                    mt: 4,
                    pt: 2,
                    borderTop: "1px solid",
                    borderColor: "divider",
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
                    Ao encerrar a pelada, todas as partidas serão finalizadas e
                    a classificação será consolidada.
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
                </Box>
              )}
            </Paper>
          )}
          {activeTab === 2 && (
            <Paper sx={{ borderRadius: 4, overflow: "hidden" }}>
              <PlayerStatsPanel
                playerStats={playerStats}
                onToggleSort={togglePlayerSort}
                showHighlights={isPeladaClosed}
              />
            </Paper>
          )}
          {activeTab === 3 && (
            <Box sx={{ p: 2 }}>
              <PeladaTimeline
                events={matchEvents}
                userIdToName={userIdToName}
                orgPlayerIdToUserId={orgPlayerIdToUserId}
                teamNameById={teamNameById}
                matches={matches}
                orgPlayerIdToTeamId={orgPlayerIdToTeamId}
                isAdmin={isAdmin}
                onEditClick={(event) => setEditEventDialogOpen(event)}
                onDeleteClick={(event) => setDeleteEventConfirmOpen(event)}
              />
            </Box>
          )}{" "}
        </Box>

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
            teamNameById={teamNameById}
            nextMatch={nextScheduledMatch}
            onProceedToNext={proceedToNextMatch}
          />
        )}
      </Container>
      {/* Pretty Confirm Dialogs */}
      <PrettyConfirmDialog
        open={Boolean(resetConfirmOpen)}
        title={t("common.confirm")}
        description={
          resetConfirmOpen?.type === "session"
            ? "Tem certeza que deseja zerar o cronômetro da sessão? Isso não pode ser desfeito."
            : "Tem certeza que deseja zerar o cronômetro desta partida?"
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
        description="Tem certeza que deseja deletar este evento? Se for um gol, a assistência associada também será deletada."
        onConfirm={handleConfirmDeleteEvent}
        onClose={() => setDeleteEventConfirmOpen(null)}
        severity="error"
      />
      {/* Edit Event Dialog */}
      <Dialog
        open={Boolean(editEventDialogOpen)}
        onClose={() => setEditEventDialogOpen(null)}
        fullWidth
        maxWidth="xs"
        data-testid="edit-event-dialog"
      >
        <DialogTitle sx={{ fontWeight: "bold" }}>
          {editEventDialogOpen?.event_type === "own_goal"
            ? t("peladas.timeline.edit_own_goal", "Edit Own Goal")
            : t("peladas.timeline.edit_goal", "Edit Goal & Assist")}
        </DialogTitle>
        <DialogContent
          sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 3 }}
        >
          {/* Scorer Select */}
          <FormControl fullWidth size="small" sx={{ mt: 1 }}>
            <InputLabel id="edit-scorer-label">
              {editEventDialogOpen?.event_type === "own_goal"
                ? t("common.player")
                : t("common.goal")}
            </InputLabel>
            <Select
              labelId="edit-scorer-label"
              value={selectedScorerId}
              label={
                editEventDialogOpen?.event_type === "own_goal"
                  ? t("common.player")
                  : t("common.goal")
              }
              onChange={(e) => handleScorerChange(e.target.value as string)}
              data-testid="edit-scorer-select"
            >
              {editScorerOptions.map((player) => {
                const name =
                  orgPlayerIdToPlayer[player.player_id]?.user_name ||
                  getPlayerName(player.player_id);
                const sideLabel = editEventMatch
                  ? player.team_id === editEventMatch.home_team_id
                    ? `(${teamNameById[editEventMatch.home_team_id] || "Home"})`
                    : `(${teamNameById[editEventMatch.away_team_id] || "Away"})`
                  : "";
                return (
                  <MenuItem key={player.player_id} value={player.player_id}>
                    {name} {sideLabel}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {/* Assistant Select (Only for Goal events) */}
          {editEventDialogOpen?.event_type === "goal" && (
            <FormControl fullWidth size="small">
              <InputLabel id="edit-assistant-label">
                {t("common.assist")}
              </InputLabel>
              <Select
                labelId="edit-assistant-label"
                value={selectedAssistantId}
                label={t("common.assist")}
                onChange={(e) =>
                  setSelectedAssistantId(e.target.value as string)
                }
                data-testid="edit-assistant-select"
              >
                <MenuItem value="none">
                  <em>{t("common.without_assistance")}</em>
                </MenuItem>
                {editAssistantOptions.map((player) => {
                  const name =
                    orgPlayerIdToPlayer[player.player_id]?.user_name ||
                    getPlayerName(player.player_id);
                  return (
                    <MenuItem key={player.player_id} value={player.player_id}>
                      {name}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setEditEventDialogOpen(null)}
            variant="outlined"
            color="inherit"
          >
            {t("common.actions.cancel")}
          </Button>
          <Button
            onClick={handleSaveEditEvent}
            variant="contained"
            color="primary"
            disabled={!selectedScorerId}
            data-testid="save-event-edit-button"
          >
            {t("common.actions.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
