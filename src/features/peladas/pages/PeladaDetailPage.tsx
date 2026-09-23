import { useParams } from "react-router-dom";
import { useState, useEffect, useMemo, type DragEvent } from "react";
import { Container, Alert, useTheme, useMediaQuery } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../shared/components/Loading";
import { type PlayerWithUser } from "../components/TeamsSection";
import DrawJustificationDialog from "../components/DrawJustificationDialog";
import PeladaTeamsDesktopView from "../components/PeladaTeamsDesktopView";
import PeladaTeamsMobileView from "../components/PeladaTeamsMobileView";
import { usePeladaDetail } from "../hooks/usePeladaDetail";
import { useAuth } from "../../../app/providers/AuthContext";
import { api } from "../../../shared/api/client";
import {
  createApi,
  type Player,
  type User,
} from "../../../shared/api/endpoints";
import StartPeladaDialog from "../components/StartPeladaDialog";
import SwapPlayerDialog from "../components/SwapPlayerDialog";
import PrettyConfirmDialog from "../../../shared/components/PrettyConfirmDialog";
import {
  generateAnnouncementText,
  copyToClipboard,
} from "../utils/exportUtils";

export default function PeladaDetailPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const { id } = useParams();
  const peladaId = id!;
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
    scores,
    error,
    processing,
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
    drawJustification,
    handleBeginPelada,
    handleCreateTeam,
    handleDeleteTeam,
    handlePerformSwap: handlePerformSwapHook,
    handleToggleFixedGoalkeepers,
    handleUpdatePlayersPerTeam,
    handleUpdateNumTeams,
    handleMarkPaid,
    handleReversePayment,
    peladaTransactions,
  } = usePeladaDetail(peladaId);

  const [justificationDialogOpen, setJustificationDialogOpen] = useState(false);

  useEffect(() => {
    if (drawJustification) {
      setJustificationDialogOpen(true);
    }
  }, [drawJustification]);

  const [pendingSwap, setPendingSwap] = useState<{
    incomingPlayer: PlayerWithUser;
    targetTeamId: string;
    sourceTeamId: string | null;
  } | null>(null);

  const handleMoveToTeam = (playerId: string, targetTeamId: string) => {
    const targetTeamPlayers = teamPlayers[targetTeamId] || [];
    const maxPlayers = pelada?.players_per_team || 5;

    // Find if player is in a team already
    let sourceTeamId: string | null = null;
    for (const tid in teamPlayers) {
      if (teamPlayers[tid].some((p) => p.id === playerId)) {
        sourceTeamId = String(tid);
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
    targetTeamId: string,
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

  const handleSendToBench = (playerId: string) => {
    // Find which team the player is in
    let sourceTeamId: string | null = null;
    for (const tid in teamPlayers) {
      if (teamPlayers[tid].some((p) => p.id === playerId)) {
        sourceTeamId = String(tid);
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

  const handleMoveToFixedGk = (playerId: string, side: "home" | "away") => {
    // Find where player is currently (team or bench)
    let sourceTeamId: string | null = null;
    for (const tid in teamPlayers) {
      if (teamPlayers[tid].some((p) => p.id === playerId)) {
        sourceTeamId = String(tid);
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
  const [playerToReverse, setPlayerToReverse] = useState<string | null>(null);

  const handlePerformSwap = async (playerToReplaceId: string) => {
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

  const onReverseClick = (playerId: string) => {
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

  const handleCopyAnnouncement = async () => {
    const text = generateAnnouncementText(teams, teamPlayers);
    const success = await copyToClipboard(text);
    if (success) {
      // alert(t("common.actions.copy_success", "Copied to clipboard!"));
    }
  };

  const handleStartPeladaClick = () => {
    if (pelada.has_schedule_plan) {
      setConfirmStartWithScheduleOpen(true);
    } else {
      setStartDialogOpen(true);
    }
  };

  return (
    <>
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {live}
      </div>

      {isDesktop ? (
        <PeladaTeamsDesktopView
          pelada={pelada}
          teams={teams}
          teamPlayers={teamPlayers}
          benchPlayers={benchPlayers}
          homeGk={homeGk}
          awayGk={awayGk}
          scores={scores}
          isAdmin={isAdmin}
          processing={processing}
          onDragStartPlayer={onDragStartPlayer}
          dropToTeam={handleDropToTeam}
          dropToBench={dropToBench}
          dropToFixedGk={dropToFixedGk}
          removeFixedGk={removeFixedGk}
          onMoveToTeam={handleMoveToTeam}
          onSendToBench={handleSendToBench}
          onMoveToFixedGk={handleMoveToFixedGk}
          onRandomizeTeams={handleRandomizeTeams}
          onUpdatePlayersPerTeam={handleUpdatePlayersPerTeam}
          onUpdateNumTeams={handleUpdateNumTeams}
          drawJustification={drawJustification}
          onOpenJustificationDialog={() => setJustificationDialogOpen(true)}
          onCreateTeam={handleCreateTeam}
          onDeleteTeam={handleDeleteTeam}
          onStartClick={handleStartPeladaClick}
          onCopyAnnouncement={handleCopyAnnouncement}
          onToggleFixedGk={handleToggleFixedGoalkeepers}
          currentUser={user}
          peladaTransactions={peladaTransactions}
          onMarkPaid={handleMarkPaid}
          onReversePayment={onReverseClick}
        />
      ) : (
        <PeladaTeamsMobileView
          pelada={pelada}
          teams={teams}
          teamPlayers={teamPlayers}
          benchPlayers={benchPlayers}
          homeGk={homeGk}
          awayGk={awayGk}
          scores={scores}
          isAdmin={isAdmin}
          processing={processing}
          dropToTeam={handleDropToTeam}
          dropToBench={dropToBench}
          dropToFixedGk={dropToFixedGk}
          onMoveToTeam={handleMoveToTeam}
          onSendToBench={handleSendToBench}
          onMoveToFixedGk={handleMoveToFixedGk}
          onRemoveFixedGk={removeFixedGk}
          onRandomizeTeams={handleRandomizeTeams}
          onUpdatePlayersPerTeam={handleUpdatePlayersPerTeam}
          onUpdateNumTeams={handleUpdateNumTeams}
          drawJustification={drawJustification}
          onOpenJustificationDialog={() => setJustificationDialogOpen(true)}
          onCreateTeam={handleCreateTeam}
          onDeleteTeam={handleDeleteTeam}
          onStartClick={handleStartPeladaClick}
          onCopyAnnouncement={handleCopyAnnouncement}
          onToggleFixedGk={handleToggleFixedGoalkeepers}
          currentUser={user}
          peladaTransactions={peladaTransactions}
          onMarkPaid={handleMarkPaid}
          onReversePayment={onReverseClick}
        />
      )}

      <DrawJustificationDialog
        open={justificationDialogOpen}
        onClose={() => {
          setJustificationDialogOpen(false);
        }}
        justification={drawJustification}
      />

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
    </>
  );
}
