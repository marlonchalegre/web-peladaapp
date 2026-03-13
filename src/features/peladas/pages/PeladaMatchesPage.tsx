import { useParams, Link as RouterLink } from "react-router-dom";
import { useState, useEffect } from "react";
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
import { createApi } from "../../../shared/api/endpoints";
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
} from "../utils/exportUtils";
import GlobalSessionTimer from "../components/GlobalSessionTimer";
import { usePeladaTimer } from "../hooks/usePeladaTimer";
import PrettyConfirmDialog from "../../../shared/components/PrettyConfirmDialog";

export default function PeladaMatchesPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const peladaId = Number(id);
  const { user } = useAuth();
  const [actuallyIsAdmin, setActuallyIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [resetConfirmOpen, setResetConfirmOpen] = useState<{
    type: "session" | "match";
  } | null>(null);

  // Confirmation Dialog States
  const [endMatchConfirmOpen, setEndMatchConfirmOpen] = useState<number | null>(
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
  } = usePeladaMatches(peladaId);

  useEffect(() => {
    if (pelada?.organization_id && user) {
      const endpoints = createApi(api);
      endpoints
        .listAdminsByOrganization(pelada.organization_id)
        .then((admins) => {
          setActuallyIsAdmin(admins.some((a) => a.user_id === user.id));
        })
        .catch((e) => console.error("Failed to check admin status", e));
    }
  }, [pelada?.organization_id, user]);

  const isAdmin =
    pelada?.is_admin ||
    actuallyIsAdmin ||
    (user?.admin_orgs?.includes(pelada?.organization_id || -1) ?? false);

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
    const full: Record<number, any[]> = {};
    for (const [teamId, players] of Object.entries(teamPlayers)) {
      full[Number(teamId)] = players.map((p) => {
        const orgPlayer = orgPlayerIdToPlayer[p.player_id];
        if (!orgPlayer) return null;
        
        // Map flat properties from Player to the nested User object expected by exportUtils
        return {
          ...orgPlayer,
          is_goalkeeper: p.is_goalkeeper,
          user: {
            id: orgPlayer.user_id,
            name: orgPlayer.user_name || userIdToName[orgPlayer.user_id] || "Unknown",
            username: orgPlayer.user_username || "",
            email: orgPlayer.user_email || "",
            position: orgPlayer.position_id 
              ? ["goalkeeper", "defender", "midfielder", "striker"][orgPlayer.position_id - 1]
              : undefined
          }
        };
      }).filter(Boolean);
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
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <BreadcrumbNav
          items={[
            {
              label: pelada?.organization_name || t("common.organization"),
              path: `/organizations/${pelada?.organization_id}`,
            },
            {
              label: t("peladas.detail.title", { id: peladaId }),
              path: `/peladas/${peladaId}`,
            },
            { label: t("peladas.detail.button.view_matches") },
          ]}
        />

        <Box
          sx={{
            mb: 2,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr auto 1fr" },
            alignItems: "center",
            gap: 2,
          }}
        >
          {/* Left spacer for desktop */}
          <Box sx={{ display: { xs: "none", sm: "block" } }} />

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
            sx={{ justifyContent: { xs: "center", sm: "flex-end" } }}
          >
            <Button
              variant="outlined"
              onClick={handleShareClick}
              endIcon={<KeyboardArrowDownIcon />}
              size="small"
              data-testid="share-dropdown-button"
            >
              {t("common.export")}
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
                <ListItemText>{t("peladas.matches.share_summary")}</ListItemText>
              </MenuItem>
              {pelada?.status !== "closed" && (
                <>
                  <MenuItem
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
                  </MenuItem>
                  <MenuItem
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
                  </MenuItem>
                </>
              )}
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
                recordEvent={(mid, pid, type, st, mt) =>
                  recordEvent(
                    mid,
                    pid,
                    type,
                    st ?? peladaTimer.elapsedMs,
                    mt ?? matchTimer.elapsedMs,
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
                <Typography variant="h5" color="text.secondary">
                  {t("peladas.matches.select_match_hint")}
                </Typography>
              </Paper>
            ))}

          {activeTab === 1 && (
            <Paper sx={{ borderRadius: 4, overflow: "hidden", p: 2 }}>
              <StandingsPanel standings={standings} />
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
                    color="text.secondary"
                    sx={{ mb: 2 }}
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
              />
            </Paper>
          )}

          {activeTab === 3 && (
            <Paper sx={{ p: 2, borderRadius: 4 }}>
              <PeladaTimeline
                events={matchEvents}
                matches={matches}
                userIdToName={userIdToName}
                orgPlayerIdToUserId={orgPlayerIdToUserId}
                teamNameById={teamNameById}
              />
            </Paper>
          )}
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
        onConfirm={executeClosePelada}
        onClose={() => setClosePeladaConfirmOpen(false)}
        severity="error"
      />
    </Box>
  );
}
