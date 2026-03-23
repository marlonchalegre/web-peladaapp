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
} from "../../../shared/api/endpoints";
import { useAuth } from "../../../app/providers/AuthContext";

/**
 * Sorts players by their attendance update time (FIFO - First In First Out).
 * If update time is missing, it falls back to alphabetical sort by name.
 */
function sortPlayersByAttendanceTime(players: PlayerWithUser[]): PlayerWithUser[] {
  return [...players].sort((a, b) => {
    const timeA = a.attendance_updated_at ? new Date(a.attendance_updated_at).getTime() : Infinity;
    const timeB = b.attendance_updated_at ? new Date(b.attendance_updated_at).getTime() : Infinity;

    if (timeA !== timeB) {
      return timeA - timeB;
    }

    // Alphabetical name sort (tie-breaker)
    const nameA = a.user?.name || "";
    const nameB = b.user?.name || "";
    return nameA.localeCompare(nameB);
  });
}

const endpoints = createApi(api);

export type PlayerWithUser = Player & {
  user: User;
  attendance_status?: AttendanceStatus;
  attendance_updated_at?: string;
};

export function useAttendance(peladaId: number) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [pelada, setPelada] = useState<Pelada | null>(null);
  const [players, setPlayers] = useState<PlayerWithUser[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingPlayers, setUpdatingPlayers] = useState<Set<number>>(
    new Set(),
  );

  const fetchData = useCallback(
    async (background = false) => {
      if (!peladaId || !user) return;
      try {
        if (!background) setLoading(true);
        const data = await endpoints.getPeladaFullDetails(peladaId);
        setPelada(data.pelada);
        setPlayers(data.available_players);

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
    targetPlayerId?: number,
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

  const handleAddPlayersFromOrg = async (playerIds: number[]) => {
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
    handleUpdateAttendance,
    handleCloseAttendance,
    handleAddPlayersFromOrg,
  };
}
