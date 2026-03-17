import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Container, Alert, Box } from "@mui/material";
import Grid from "@mui/material/Grid";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../shared/components/Loading";
import TeamsSection from "../components/TeamsSection";
import AvailablePlayersPanel from "../components/AvailablePlayersPanel";
import FixedGoalkeepersSection from "../components/FixedGoalkeepersSection";
import { usePeladaDetail } from "../hooks/usePeladaDetail";
import { useAuth } from "../../../app/providers/AuthContext";
import { api } from "../../../shared/api/client";
import { createApi } from "../../../shared/api/endpoints";
import PeladaDetailHeader from "../components/PeladaDetailHeader";
import StartPeladaDialog from "../components/StartPeladaDialog";
import BreadcrumbNav from "../../../shared/components/BreadcrumbNav";
import PrettyConfirmDialog from "../../../shared/components/PrettyConfirmDialog";
import {
  generateExportText,
  generateAnnouncementText,
  copyToClipboard,
} from "../utils/exportUtils";

export default function PeladaDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const peladaId = Number(id);
  const { user } = useAuth();
  const [actuallyIsAdmin, setActuallyIsAdmin] = useState(false);
  const [confirmStartWithScheduleOpen, setConfirmStartWithScheduleOpen] =
    useState(false);

  const {
    pelada,
    teams,
    teamPlayers,
    benchPlayers,
    homeGk,
    awayGk,
    votingInfo,
    scores,
    error,
    processing,
    changingStatus,
    live,
    stats,
    startDialogOpen,
    setStartDialogOpen,
    matchesPerTeam,
    setMatchesPerTeam,
    onDragStartPlayer,
    dropToBench,
    dropToTeam,
    dropToFixedGk,
    removeFixedGk,
    handleSetGoalkeeper,
    handleRemovePlayer,
    handleRandomizeTeams,
    handleBeginPelada,
    handleCreateTeam,
    handleDeleteTeam,
    handleToggleFixedGoalkeepers,
    handleUpdatePlayersPerTeam,
    handleAddPlayersFromOrg,
    allPlayerIdsInPelada,
  } = usePeladaDetail(peladaId);

  useEffect(() => {
    if (pelada?.organization_id && user) {
      const endpoints = createApi(api);
      endpoints
        .listAdminsByOrganization(pelada.organization_id)
        .then((admins) => {
          if (admins.some((a) => a.user_id === user.id)) {
            setActuallyIsAdmin(true);
          }
        });
    }
  }, [pelada?.organization_id, user]);

  if (error)
    return (
      <Container sx={{ mt: 4, px: { xs: 1, sm: 2 } }} disableGutters>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  if (!pelada) return <Loading message={t("common.loading")} />;

  const handleCopyClipboard = async () => {
    const text = generateExportText(teams, teamPlayers, scores);
    const success = await copyToClipboard(text);
    if (success) {
      alert(t("common.actions.copy_success", "Copied to clipboard!"));
    }
  };

  const handleCopyAnnouncement = async () => {
    const text = generateAnnouncementText(teams, teamPlayers);
    const success = await copyToClipboard(text);
    if (success) {
      alert(t("common.actions.copy_success", "Copied to clipboard!"));
    }
  };

  return (
    <Container
      maxWidth="xl"
      sx={{ pb: 4, px: { xs: 1, sm: 2 } }}
      disableGutters
    >
      <Box sx={{ px: { xs: 1, sm: 0 } }}>
        <BreadcrumbNav
          items={[
            {
              label: pelada.organization_name || t("common.organization"),
              path: `/organizations/${pelada.organization_id}`,
            },
            { label: t("peladas.detail.title", { id: pelada.id }) },
          ]}
        />
      </Box>
      <PeladaDetailHeader
        pelada={pelada}
        votingInfo={votingInfo}
        onStartClick={() => {
          if (pelada.has_schedule_plan) {
            setConfirmStartWithScheduleOpen(true);
          } else {
            setStartDialogOpen(true);
          }
        }}
        onCopyClipboard={handleCopyClipboard}
        onCopyAnnouncement={handleCopyAnnouncement}
        onToggleFixedGk={handleToggleFixedGoalkeepers}
        changingStatus={changingStatus}
        processing={processing}
        isAdminOverride={actuallyIsAdmin}
      />

      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {live}
      </div>

      {pelada.status === "closed" &&
        votingInfo &&
        !votingInfo.can_vote &&
        votingInfo.message && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {votingInfo.message}
          </Alert>
        )}

      {/* Main Layout */}
      <Grid container spacing={4}>
        {/* Left Column: Teams & GKs */}
        <Grid size={{ xs: 12, lg: 9 }}>
          {pelada.fixed_goalkeepers && (
            <FixedGoalkeepersSection
              homeGk={homeGk}
              awayGk={awayGk}
              onDrop={dropToFixedGk}
              onRemove={removeFixedGk}
              locked={pelada.status !== "open"}
              isAdminOverride={actuallyIsAdmin}
              onDragStartPlayer={onDragStartPlayer}
            />
          )}

          <TeamsSection
            teams={teams}
            teamPlayers={teamPlayers}
            playersPerTeam={pelada.players_per_team ?? undefined}
            creatingTeam={processing}
            locked={pelada.status !== "open"}
            onCreateTeam={handleCreateTeam}
            onDeleteTeam={handleDeleteTeam}
            onDragStartPlayer={onDragStartPlayer}
            dropToTeam={dropToTeam}
            onSetGoalkeeper={handleSetGoalkeeper}
            onRemovePlayer={handleRemovePlayer}
            onRandomizeTeams={handleRandomizeTeams}
            onUpdatePlayersPerTeam={handleUpdatePlayersPerTeam}
            scores={scores}
            isAdminOverride={actuallyIsAdmin}
            fixedGoalkeepersEnabled={!!pelada.fixed_goalkeepers}
          />
        </Grid>

        {/* Right Column: Sidebar */}
        <Grid size={{ xs: 12, lg: 3 }}>
          <AvailablePlayersPanel
            players={benchPlayers}
            scores={scores}
            onDropToBench={dropToBench}
            onDragStartPlayer={(e, pid) => onDragStartPlayer(e, pid, null)}
            onAddPlayersFromOrg={handleAddPlayersFromOrg}
            organizationId={pelada.organization_id}
            allPlayerIdsInPelada={allPlayerIdsInPelada}
            locked={
              (pelada.status !== "open" && !actuallyIsAdmin) || processing
            }
            isAdmin={actuallyIsAdmin}
            totalPlayersInPelada={stats.totalPlayers}
            averagePelada={stats.averagePelada}
            balance={stats.balance}
          />
        </Grid>
      </Grid>

      <StartPeladaDialog
        open={startDialogOpen}
        matchesPerTeam={matchesPerTeam}
        onMatchesChange={setMatchesPerTeam}
        onClose={() => setStartDialogOpen(false)}
        onConfirm={handleBeginPelada}
      />

      <PrettyConfirmDialog
        open={confirmStartWithScheduleOpen}
        title={t("common.confirm")}
        description={t("peladas.detail.dialog.start.confirm")}
        onConfirm={handleBeginPelada}
        onClose={() => setConfirmStartWithScheduleOpen(false)}
      />
    </Container>
  );
}
