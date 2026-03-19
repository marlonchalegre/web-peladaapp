import { useState, useEffect, useCallback } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Typography,
  Box,
} from "@mui/material";
import { useNetwork } from "../../../shared/hooks/useNetwork";
import {
  getOfflineQueue,
  dequeueAction,
  type OfflineAction,
} from "../utils/offlineQueue";
import { api } from "../../../shared/api/client";
import { createApi } from "../../../shared/api/endpoints";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import SyncIcon from "@mui/icons-material/Sync";

const endpoints = createApi(api);

interface OfflineSyncManagerProps {
  peladaId: number;
  onSyncComplete: () => void;
}

export default function OfflineSyncManager({
  peladaId,
  onSyncComplete,
}: OfflineSyncManagerProps) {
  const isOnline = useNetwork();
  const [queue, setQueue] = useState<OfflineAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const loadQueue = useCallback(() => {
    setQueue(getOfflineQueue(peladaId));
  }, [peladaId]);

  useEffect(() => {
    loadQueue();
    const handleQueueChange = () => loadQueue();
    window.addEventListener("offlineQueueChanged", handleQueueChange);
    return () =>
      window.removeEventListener("offlineQueueChanged", handleQueueChange);
  }, [loadQueue]);

  const processQueue = async () => {
    if (queue.length === 0 || !isOnline || isSyncing) return;

    setIsSyncing(true);
    setSyncError(null);

    // Snapshot the current queue to process
    const currentQueue = [...queue];

    try {
      for (const action of currentQueue) {
        // Execute the action based on its type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = action.payload as any;
        switch (action.type) {
          case "ADJUST_SCORE":
            await endpoints.updateMatchScore(
              p.matchId,
              p.newHome,
              p.newAway,
              p.status,
            );
            break;
          case "RECORD_EVENT":
            await endpoints.createMatchEvent(
              p.matchId,
              p.playerId,
              p.type,
              p.sessionTimeMs,
              p.matchTimeMs,
            );
            break;
          case "DELETE_EVENT":
            await endpoints.deleteMatchEvent(p.matchId, p.playerId, p.type);
            break;
          case "ADD_PLAYER_TO_TEAM":
            await endpoints.addMatchLineupPlayer(
              p.matchId,
              p.teamId,
              p.playerId,
            );
            break;
          case "REPLACE_PLAYER":
            await endpoints.replaceMatchLineupPlayer(
              p.matchId,
              p.teamId,
              p.outPlayerId,
              p.inPlayerId,
            );
            break;
          case "CLOSE_PELADA":
            await endpoints.closePelada(p.peladaId);
            break;
          case "END_MATCH":
            await endpoints.updateMatchScore(
              p.matchId,
              p.homeScore,
              p.awayScore,
              "finished",
            );
            break;
          case "START_PELADA_TIMER":
            await endpoints.startPeladaTimer(p.peladaId);
            break;
          case "PAUSE_PELADA_TIMER":
            await endpoints.pausePeladaTimer(p.peladaId);
            break;
          case "RESET_PELADA_TIMER":
            await endpoints.resetPeladaTimer(p.peladaId);
            break;
          case "START_MATCH_TIMER":
            await endpoints.startMatchTimer(p.matchId);
            break;
          case "PAUSE_MATCH_TIMER":
            await endpoints.pauseMatchTimer(p.matchId);
            break;
          case "RESET_MATCH_TIMER":
            await endpoints.resetMatchTimer(p.matchId);
            break;
        }

        // Remove from local storage queue upon success
        dequeueAction(peladaId, action.id);
      }

      // All successful
      onSyncComplete();
    } catch (error: unknown) {
      console.error("Sync failed:", error);
      // If it's a network error, stop syncing, but don't show a big error, just wait.
      // If it's a server error (e.g., 400), show error.
      if (
        error instanceof Error &&
        error.message &&
        error.message.includes("Failed to fetch")
      ) {
        setSyncError("Conexão perdida durante a sincronização.");
      } else {
        setSyncError(
          error instanceof Error
            ? error.message
            : "Erro ao sincronizar. Operação cancelada.",
        );
      }
    } finally {
      setIsSyncing(false);
      loadQueue(); // Refresh queue state
    }
  };

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && queue.length > 0 && !isSyncing) {
      processQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]); // Intentionally omitting queue/isSyncing to only trigger on online edge

  if (queue.length === 0 && isOnline) {
    return null; // Nothing to show
  }

  return (
    <Box sx={{ mb: 2 }}>
      {!isOnline && (
        <Alert
          severity="warning"
          icon={<CloudOffIcon />}
          sx={{ mb: queue.length > 0 ? 1 : 0 }}
          data-testid="offline-banner"
        >
          Modo Offline ativo. As alterações serão salvas localmente e
          sincronizadas quando a conexão retornar.
        </Alert>
      )}

      {queue.length > 0 && (
        <Alert
          severity={syncError ? "error" : "info"}
          data-testid="pending-actions-alert"
          action={
            isOnline ? (
              <Button
                color="inherit"
                size="small"
                onClick={processQueue}
                disabled={isSyncing}
                startIcon={
                  isSyncing ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <SyncIcon />
                  )
                }
              >
                {isSyncing ? "Sincronizando..." : "Sincronizar Agora"}
              </Button>
            ) : undefined
          }
        >
          <Typography variant="body2" data-testid="pending-actions-count">
            <strong>{queue.length}</strong>{" "}
            {queue.length === 1 ? "ação pendente" : "ações pendentes"} de
            sincronização.
            {syncError && ` Erro: ${syncError}`}
          </Typography>
        </Alert>
      )}
    </Box>
  );
}
