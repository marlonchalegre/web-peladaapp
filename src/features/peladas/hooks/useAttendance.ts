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
import { sortPlayersByPosition } from "../utils/playerUtils";

const endpoints = createApi(api);

export type PlayerWithUser = Player & {
  user: User;
  attendance_status?: AttendanceStatus;
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

  const confirmed = sortPlayersByPosition(
    players.filter((p) => p.attendance_status === "confirmed"),
  );
  const declined = sortPlayersByPosition(
    players.filter((p) => p.attendance_status === "declined"),
  );
  const pending = sortPlayersByPosition(
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
