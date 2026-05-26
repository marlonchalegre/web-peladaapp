import { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../../shared/api/client";
import {
  createApi,
  type Pelada,
  type Player,
  type User,
  type AttendanceStatus,
  type Transaction,
} from "../../../shared/api/endpoints";
import { useAuth } from "../../../app/providers/AuthContext";

const MEMBER_TYPE_PRIORITY: Record<string, number> = {
  mensalista: 0,
  mensalista_temporario: 0,
  diarista: 1,
  diarista_temporario: 1,
  convidado: 2,
};

/**
 * Sorts players by their member type priority (mensalista > diarista > convidado)
 * and then by their attendance update time (FIFO - First In First Out).
 * If update time is missing, it falls back to alphabetical sort by name.
 */
function sortPlayersByAttendanceTime(
  players: PlayerWithUser[],
): PlayerWithUser[] {
  return [...players].sort((a, b) => {
    // 1. Member type priority
    const priorityA = MEMBER_TYPE_PRIORITY[a.member_type || ""] ?? 3;
    const priorityB = MEMBER_TYPE_PRIORITY[b.member_type || ""] ?? 3;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // 2. FIFO (attendance_updated_at)
    if (a.attendance_updated_at && b.attendance_updated_at) {
      return a.attendance_updated_at.localeCompare(b.attendance_updated_at);
    }
    if (a.attendance_updated_at) return -1;
    if (b.attendance_updated_at) return 1;

    // 3. Alphabetical
    const nameA = a.user?.name || "";
    const nameB = b.user?.name || "";
    return nameA.localeCompare(nameB);
  });
}

const endpoints = createApi(api);

import { useOrganizationFinance } from "../../../shared/hooks/useOrganizationFinance";

export type PlayerWithUser = Player & {
  user: User;
  attendance_status?: AttendanceStatus;
  attendance_updated_at?: string;
};

export function useAttendance(peladaId: string) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [pelada, setPelada] = useState<Pelada | null>(null);
  const [players, setPlayers] = useState<PlayerWithUser[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingPlayers, setUpdatingPlayers] = useState<Set<string>>(
    new Set(),
  );
  const [peladaTransactions, setPeladaTransactions] = useState<Transaction[]>(
    [],
  );

  const { organizationFinance, loadingFinance } = useOrganizationFinance(
    pelada?.organization_id,
  );

  const fetchData = useCallback(
    async (background = false) => {
      if (!peladaId || !user) return;
      try {
        if (!background) setLoading(true);
        const data = await endpoints.getPeladaFullDetails(peladaId);
        setPelada(data.pelada);
        setPlayers(data.available_players);
        setPeladaTransactions(data.pelada_transactions || []);

        const userIsAdmin =
          user.admin_orgs?.includes(data.pelada.organization_id) ?? false;
        setIsAdmin(userIsAdmin);

        // Redirect based on status if not in attendance
        if (data.pelada.status !== "attendance") {
          const status = data.pelada.status || "";
          const isMatchesPage = location.pathname.endsWith("/matches");

          if (status === "running") {
            navigate(`/peladas/${peladaId}/matches`);
          } else if (status === "voting" && !isMatchesPage) {
            navigate(`/peladas/${peladaId}/voting`);
          } else if (status === "closed" && !isMatchesPage) {
            navigate(`/peladas/${peladaId}/results`);
          } else if (!isMatchesPage) {
            navigate(`/peladas/${peladaId}`);
          }
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : t("peladas.attendance.error.load_failed");
        setError(message);
      } finally {
        if (!background) setLoading(false);
      }
    },
    [peladaId, user, navigate, t, location.pathname],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateAttendance = async (
    status: AttendanceStatus,
    targetPlayerId?: string,
  ) => {
    // Determine the ID to track for loading state
    const currentPlayerAsPlayer = players.find(
      (p) => String(p.user_id) === String(user?.id),
    );
    const idToTrack = targetPlayerId ?? currentPlayerAsPlayer?.id;

    if (idToTrack) {
      setUpdatingPlayers((prev) => new Set(prev).add(idToTrack));
    }

    try {
      await endpoints.updateAttendance(peladaId, status, targetPlayerId);
      await fetchData(true);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("peladas.attendance.error.update_failed");
      setError(message);
    } finally {
      if (idToTrack) {
        setUpdatingPlayers((prev) => {
          const next = new Set(prev);
          next.delete(idToTrack);
          return next;
        });
      }
    }
  };

  const handleCloseAttendance = async () => {
    try {
      await endpoints.closeAttendance(peladaId);
      navigate(`/peladas/${peladaId}`);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("peladas.attendance.error.close_failed");
      setError(message);
    }
  };

  const handleAddPlayersFromOrg = async (playerIds: string[]) => {
    try {
      setLoading(true);
      await Promise.all(
        playerIds.map((pid) =>
          api.post(`/api/peladas/${peladaId}/players`, { player_id: pid }),
        ),
      );
      await fetchData(true);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("peladas.available.error.add_failed");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (playerId: string, amount?: number) => {
    if (!pelada) return;
    try {
      setUpdatingPlayers((prev) => new Set(prev).add(playerId));

      // Payment: add new transaction
      const finalAmount = amount ?? organizationFinance?.diarista_price ?? 0;
      const peladaDate = pelada.scheduled_at
        ? new Date(pelada.scheduled_at).toLocaleDateString(
            t("common.locale", "pt-BR"),
          )
        : peladaId;

      await endpoints.addTransaction(pelada.organization_id, {
        player_id: playerId,
        pelada_id: peladaId,
        amount: finalAmount,
        type: "income",
        category: "diarista_fee",
        description: `Pagamento Pelada ${peladaDate}`,
        payment_date: new Date().toISOString().split("T")[0],
      });
      await fetchData(true);
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error
          ? err.message
          : t("organizations.management.finance.transactions.error.add_failed");
      setError(message);
    } finally {
      setUpdatingPlayers((prev) => {
        const next = new Set(prev);
        next.delete(playerId);
        return next;
      });
    }
  };

  const handleReversePayment = async (playerId: string) => {
    if (!pelada) return;
    try {
      setUpdatingPlayers((prev) => new Set(prev).add(playerId));

      const existingTx = peladaTransactions.find(
        (t) =>
          t.player_id === playerId &&
          t.type === "income" &&
          t.category === "diarista_fee" &&
          t.status === "paid",
      );

      if (existingTx) {
        await endpoints.reverseTransaction(
          pelada.organization_id,
          existingTx.id,
        );
        await fetchData(true);
      }
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error
          ? err.message
          : t(
              "organizations.management.finance.transactions.error.reverse_failed",
            );
      setError(message);
    } finally {
      setUpdatingPlayers((prev) => {
        const next = new Set(prev);
        next.delete(playerId);
        return next;
      });
    }
  };

  const confirmed = sortPlayersByAttendanceTime(
    players.filter((p) => p.attendance_status === "confirmed"),
  );
  const waitlist = sortPlayersByAttendanceTime(
    players.filter((p) => p.attendance_status === "waitlist"),
  );
  const declined = sortPlayersByAttendanceTime(
    players.filter((p) => p.attendance_status === "declined"),
  );
  const pending = sortPlayersByAttendanceTime(
    players.filter(
      (p) => !p.attendance_status || p.attendance_status === "pending",
    ),
  );

  const currentPlayerAsPlayer = players.find(
    (p) => String(p.user_id) === String(user?.id),
  );
  const isUpdatingSelf = currentPlayerAsPlayer
    ? updatingPlayers.has(currentPlayerAsPlayer.id)
    : false;

  return {
    pelada,
    players,
    confirmed,
    waitlist,
    declined,
    pending,
    totalPlayers: players.length,
    isAdmin,
    loading,
    error,
    updatingPlayers,
    currentPlayerAsPlayer,
    isUpdatingSelf,
    peladaTransactions,
    organizationFinance,
    loadingFinance,
    handleUpdateAttendance,
    handleCloseAttendance,
    handleAddPlayersFromOrg,
    handleMarkPaid,
    handleReversePayment,
  };
}
