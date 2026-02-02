import { useParams } from "react-router-dom";
import { Container, Alert } from "@mui/material";
import Grid from "@mui/material/Grid";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../shared/components/Loading";
import TeamsSection from "../components/TeamsSection";
import AvailablePlayersPanel from "../components/AvailablePlayersPanel";
import { usePeladaDetail } from "../hooks/usePeladaDetail";
import PeladaDetailHeader from "../components/PeladaDetailHeader";
import StartPeladaDialog from "../components/StartPeladaDialog";

export default function PeladaDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const peladaId = Number(id);

  const {
    pelada,
    teams,
    teamPlayers,
    benchPlayers,
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
    handleRandomizeTeams,
    handleBeginPelada,
    handleCreateTeam,
    handleDeleteTeam,
  } = usePeladaDetail(peladaId);

  if (error)
    return (
      <Container>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  if (!pelada) return <Loading message={t("common.loading")} />;

  return (
    <Container maxWidth="xl" sx={{ pb: 4 }}>
      <PeladaDetailHeader
        pelada={pelada}
        votingInfo={votingInfo}
        onStartClick={() => setStartDialogOpen(true)}
        changingStatus={changingStatus}
        processing={processing}
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
        {/* Left Column: Teams */}
        <Grid size={{ xs: 12, lg: 9 }}>
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
            onRandomizeTeams={handleRandomizeTeams}
            scores={scores}
          />
        </Grid>

        {/* Right Column: Sidebar */}
        <Grid size={{ xs: 12, lg: 3 }}>
          <AvailablePlayersPanel
            players={benchPlayers}
            scores={scores}
            onDropToBench={dropToBench}
            onDragStartPlayer={(e, pid) => onDragStartPlayer(e, pid, null)}
            locked={pelada.status !== "open" || processing}
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
    </Container>
  );
}
