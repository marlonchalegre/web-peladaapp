import { useParams } from "react-router-dom";
import { useState, useEffect, useMemo, type DragEvent } from "react";
import { Container, Alert, Box, Grid } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../shared/components/Loading";
import TeamsSection from "../components/TeamsSection";
import AvailablePlayersPanel from "../components/AvailablePlayersPanel";
import FixedGoalkeepersSection from "../components/FixedGoalkeepersSection";
import { usePeladaDetail } from "../hooks/usePeladaDetail";
import { useAuth } from "../../../app/providers/AuthContext";
import { api } from "../../../shared/api/client";
import {
  createApi,
  type Player,
  type User,
} from "../../../shared/api/endpoints";
import PeladaDetailHeader from "../components/PeladaDetailHeader";
import StartPeladaDialog from "../components/StartPeladaDialog";
import SwapPlayerDialog from "../components/SwapPlayerDialog";
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
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const [confirmStartWithScheduleOpen, setConfirmStartWithScheduleOpen] =
    useState(false);

  const {
    pelada,
    teams,
    teamPlayers,
    availablePlayers,
    benchPlayers,
    homeGk,
    awayGk,
    votingInfo,
    scores,
    error,
    processing,
    changingStatus,
    live,
    startDialogOpen,
    setStartDialogOpen,
    matchesPerTeam,
    setMatchesPerTeam,
    onDragStartPlayer,
    dropToBench,
    dropToTeam,
    dropToFixedGk,
    removeFixedGk,
    handleRandomizeTeams,
    handleBeginPelada,
    handleCreateTeam,
    handleDeleteTeam,
    handlePerformSwap: handlePerformSwapHook,
    handleToggleFixedGoalkeepers,
    handleUpdatePlayersPerTeam,
    handleAddPlayersFromOrg,
    handleMarkPaid,
    handleReversePayment,
    allPlayerIdsInPelada,
    peladaTransactions,
    organizationFinance,
  } = usePeladaDetail(peladaId);

  const [pendingSwap, setPendingSwap] = useState<{
    incomingPlayer: Player & { user: User };
    targetTeamId: number;
    sourceTeamId: number | null;
  } | null>(null);

  const handleMoveToTeam = (playerId: number, targetTeamId: number) => {
    const targetTeamPlayers = teamPlayers[targetTeamId] || [];
    const maxPlayers = pelada?.players_per_team || 5;

    // Find if player is in a team already
    let sourceTeamId: number | null = null;
    for (const tid in teamPlayers) {
      if (teamPlayers[tid].some((p) => p.id === playerId)) {
        sourceTeamId = Number(tid);
        break;
      }
    }

    if (
      targetTeamPlayers.length >= maxPlayers &&
      sourceTeamId !== targetTeamId
    ) {
      const incoming =
        availablePlayers.find((p) => p.id === playerId) ||
        Object.values(teamPlayers)
          .flat()
          .find((p) => p.id === playerId);

      if (incoming) {
        setPendingSwap({
          incomingPlayer: incoming as Player & { user: User },
          targetTeamId,
          sourceTeamId,
        });
        return;
      }
    }

    // Mock the DragEvent since dropToTeam expects it
    const mockEvent = {
      preventDefault: () => {},
      dataTransfer: {
        getData: () => JSON.stringify({ playerId, sourceTeamId }),
      },
    } as unknown as DragEvent<HTMLElement>;

    dropToTeam(mockEvent, targetTeamId);
  };

  const handleDropToTeam = async (
    e: DragEvent<HTMLElement>,
    targetTeamId: number,
  ) => {
    e.preventDefault();
    const dataText = e.dataTransfer.getData("application/json");
    if (!dataText) return;

    try {
      const { playerId, sourceTeamId } = JSON.parse(dataText);
      const targetTeamPlayers = teamPlayers[targetTeamId] || [];
      const maxPlayers = pelada?.players_per_team || 5;

      if (
        targetTeamPlayers.length >= maxPlayers &&
        sourceTeamId !== targetTeamId
      ) {
        const incoming =
          availablePlayers.find((p) => p.id === playerId) ||
          Object.values(teamPlayers)
            .flat()
            .find((p) => p.id === playerId);

        if (incoming) {
          setPendingSwap({
            incomingPlayer: incoming as Player & { user: User },
            targetTeamId,
            sourceTeamId,
          });
          return;
        }
      }
    } catch (err) {
      console.error("Failed to parse drag data", err);
    }

    await dropToTeam(e, targetTeamId);
  };

  const handleSendToBench = (playerId: number) => {
    // Find which team the player is in
    let sourceTeamId: number | null = null;
    for (const tid in teamPlayers) {
      if (teamPlayers[tid].some((p) => p.id === playerId)) {
        sourceTeamId = Number(tid);
        break;
      }
    }

    if (sourceTeamId === null) return;

    const mockEvent = {
      preventDefault: () => {},
      dataTransfer: {
        getData: () => JSON.stringify({ playerId, sourceTeamId }),
      },
    } as unknown as DragEvent<HTMLElement>;

    dropToBench(mockEvent);
  };

  const handleMoveToFixedGk = (playerId: number, side: "home" | "away") => {
    // Find where player is currently (team or bench)
    let sourceTeamId: number | null = null;
    for (const tid in teamPlayers) {
      if (teamPlayers[tid].some((p) => p.id === playerId)) {
        sourceTeamId = Number(tid);
        break;
      }
    }

    const mockEvent = {
      preventDefault: () => {},
      dataTransfer: {
        getData: () => JSON.stringify({ playerId, sourceTeamId }),
      },
    } as unknown as DragEvent<HTMLElement>;

    dropToFixedGk(mockEvent, side);
  };

  const [isReverseDialogOpen, setIsReverseDialogOpen] = useState(false);
  const [playerToReverse, setPlayerToReverse] = useState<number | null>(null);

  const handlePerformSwap = async (playerToReplaceId: number) => {
    if (!pendingSwap) return;
    const { incomingPlayer, targetTeamId, sourceTeamId } = pendingSwap;

    await handlePerformSwapHook(
      incomingPlayer.id,
      targetTeamId,
      sourceTeamId,
      playerToReplaceId,
    );
    setPendingSwap(null);
  };

  const handleConfirmReverse = () => {
    if (playerToReverse !== null) {
      handleReversePayment(playerToReverse);
      setPlayerToReverse(null);
    }
    setIsReverseDialogOpen(false);
  };

  const onReverseClick = (playerId: number) => {
    setPlayerToReverse(playerId);
    setIsReverseDialogOpen(true);
  };

  // Derived admin status
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
        .catch((err) => console.error("Failed to check admin status", err));
    }
  }, [pelada?.organization_id, user, isAdmin]);

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
      // alert(t("common.actions.copy_success", "Copied to clipboard!"));
    }
  };

  const handleCopyAnnouncement = async () => {
    const text = generateAnnouncementText(teams, teamPlayers);
    const success = await copyToClipboard(text);
    if (success) {
      // alert(t("common.actions.copy_success", "Copied to clipboard!"));
    }
  };

  return (
    <Container
      maxWidth="xl"
      sx={{ pt: 2, pb: 4, px: { xs: 1, sm: 2 } }}
      disableGutters
    >
      <Box sx={{ px: { xs: 1, sm: 0 }, mb: 1 }}>
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
        onUpdatePlayersPerTeam={handleUpdatePlayersPerTeam}
        onRandomizeTeams={handleRandomizeTeams}
        playersPerTeam={pelada.players_per_team || 5}
        changingStatus={changingStatus}
        processing={processing}
        isAdminOverride={isAdmin}
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
        {/* Teams & GKs Section */}
        <Grid size={{ xs: 12 }}>
          {pelada.fixed_goalkeepers && (
            <FixedGoalkeepersSection
              homeGk={homeGk}
              awayGk={awayGk}
              onDrop={dropToFixedGk}
              onRemove={removeFixedGk}
              locked={pelada.status !== "open"}
              isAdminOverride={isAdmin}
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
            dropToTeam={handleDropToTeam}
            onMoveToTeam={handleMoveToTeam}
            onSendToBench={handleSendToBench}
            onMoveToFixedGk={handleMoveToFixedGk}
            scores={scores}
            isAdminOverride={isAdmin}
            hasFixedGoalkeepers={!!pelada.fixed_goalkeepers}
            peladaTransactions={peladaTransactions}
            organizationFinance={organizationFinance || undefined}
            onMarkPaid={handleMarkPaid}
            onReversePayment={onReverseClick}
          />
        </Grid>

        {/* Bench Section at the bottom */}
        <Grid size={{ xs: 12 }}>
          <AvailablePlayersPanel
            players={benchPlayers}
            scores={scores}
            onDropToBench={dropToBench}
            onDragStartPlayer={(e, pid) => onDragStartPlayer(e, pid, null)}
            onAddPlayersFromOrg={handleAddPlayersFromOrg}
            organizationId={pelada.organization_id}
            allPlayerIdsInPelada={allPlayerIdsInPelada}
            locked={(pelada.status !== "open" && !isAdmin) || processing}
            isAdmin={isAdmin}
            peladaTransactions={peladaTransactions}
            organizationFinance={organizationFinance || undefined}
            onMarkPaid={handleMarkPaid}
            onReversePayment={onReverseClick}
            teams={teams}
            onMoveToTeam={handleMoveToTeam}
            onMoveToFixedGk={handleMoveToFixedGk}
            hasFixedGoalkeepers={!!pelada.fixed_goalkeepers}
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
        onClose={() => setConfirmStartWithScheduleOpen(false)}
        onConfirm={handleBeginPelada}
        title={t("peladas.admin.start.title")}
        description={t("peladas.admin.start.confirm")}
      />

      <PrettyConfirmDialog
        open={isReverseDialogOpen}
        onClose={() => {
          setIsReverseDialogOpen(false);
          setPlayerToReverse(null);
        }}
        onConfirm={handleConfirmReverse}
        title={t("finance.reversal.title")}
        description={t("finance.reversal.confirm", {
          amount: 0,
        })}
        severity="warning"
      />

      <SwapPlayerDialog
        open={!!pendingSwap}
        onClose={() => setPendingSwap(null)}
        incomingPlayer={pendingSwap?.incomingPlayer || null}
        targetTeamName={
          teams.find((t) => t.id === pendingSwap?.targetTeamId)?.name || ""
        }
        targetTeamPlayers={
          pendingSwap ? teamPlayers[pendingSwap.targetTeamId] || [] : []
        }
        onSwap={handlePerformSwap}
      />
    </Container>
  );
}
