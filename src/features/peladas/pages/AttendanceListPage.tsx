import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Container,
  Typography,
  Alert,
  Button,
  Stack,
  Box,
  Paper,
  Avatar,
  IconButton,
  Card,
  CardContent,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PendingIcon from "@mui/icons-material/Pending";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import { api } from "../../../shared/api/client";
import {
  createApi,
  type Pelada,
  type Player,
  type User,
  type AttendanceStatus,
} from "../../../shared/api/endpoints";
import { useAuth } from "../../../app/providers/AuthContext";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../shared/components/Loading";

const endpoints = createApi(api);

type PlayerWithUser = Player & {
  user: User;
  attendance_status?: AttendanceStatus;
};

export default function AttendanceListPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const peladaId = Number(id);
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

        // If already open or closed, redirect to detail page
        if (data.pelada.status !== "attendance") {
          navigate(`/peladas/${peladaId}`);
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
    [peladaId, user, navigate, t],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateAttendance = async (
    status: AttendanceStatus,
    targetPlayerId?: number,
  ) => {
    // Determine the ID to track for loading state
    const currentPlayerAsPlayer = players.find((p) => p.user_id === user?.id);
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

  if (loading && !pelada) return <Loading message={t("common.loading")} />;
  if (error)
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  if (!pelada)
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="warning">{t("peladas.error.not_found")}</Alert>
      </Container>
    );

  const confirmed = players.filter((p) => p.attendance_status === "confirmed");
  const declined = players.filter((p) => p.attendance_status === "declined");
  const pending = players.filter(
    (p) => !p.attendance_status || p.attendance_status === "pending",
  );

  const totalPlayers = players.length;

  const currentPlayerAsPlayer = players.find((p) => p.user_id === user?.id);
  const isUpdatingSelf = currentPlayerAsPlayer
    ? updatingPlayers.has(currentPlayerAsPlayer.id)
    : false;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 2 }}>
        <Button
          component={RouterLink}
          to={`/organizations/${pelada.organization_id}`}
          startIcon={<ArrowBackIcon />}
          variant="text"
        >
          {t("common.back_to_org")}
        </Button>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 4,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{ fontWeight: "bold" }}
          >
            {t("peladas.attendance.title")}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t("peladas.attendance.subtitle")}
          </Typography>
        </Box>
        {isAdmin && (
          <Button
            variant="contained"
            size="large"
            startIcon={<GroupAddIcon />}
            onClick={handleCloseAttendance}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              bgcolor: "secondary.main",
              "&:hover": { bgcolor: "secondary.dark" },
              textTransform: "none",
              fontWeight: "bold",
            }}
          >
            {t("peladas.attendance.button.close_list")}
          </Button>
        )}
      </Box>

      {/* Stats Header */}
      <Box sx={{ mb: 4, pb: 4, borderBottom: 1, borderColor: "divider" }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: "bold", letterSpacing: 1 }}
            >
              {t("peladas.attendance.stats.total_players")}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: "bold" }}>
              {totalPlayers}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: "bold", letterSpacing: 1 }}
            >
              {t("peladas.attendance.stats.total_confirmed")}
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: "bold", color: "success.main" }}
            >
              {confirmed.length}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: "bold", letterSpacing: 1 }}
            >
              {t("peladas.attendance.stats.total_declined")}
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: "bold", color: "error.main" }}
            >
              {declined.length}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: "bold", letterSpacing: 1 }}
            >
              {t("peladas.attendance.stats.total_pending")}
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: "bold", color: "text.secondary" }}
            >
              {pending.length}
            </Typography>
          </Grid>
        </Grid>
      </Box>

      {/* Current User Quick Action */}
      {currentPlayerAsPlayer && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 3,
            bgcolor: "background.default",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={2}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                {t("peladas.attendance.user_status.title")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("peladas.attendance.user_status.subtitle")}
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant={
                  currentPlayerAsPlayer.attendance_status === "confirmed"
                    ? "contained"
                    : "outlined"
                }
                color="success"
                startIcon={
                  isUpdatingSelf &&
                  currentPlayerAsPlayer.attendance_status !== "confirmed" ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <CheckCircleIcon />
                  )
                }
                onClick={() => handleUpdateAttendance("confirmed")}
                disabled={isUpdatingSelf}
                sx={{ borderRadius: 2, textTransform: "none" }}
              >
                {t("peladas.attendance.button.confirm")}
              </Button>
              <Button
                variant={
                  currentPlayerAsPlayer.attendance_status === "declined"
                    ? "contained"
                    : "outlined"
                }
                color="error"
                startIcon={
                  isUpdatingSelf &&
                  currentPlayerAsPlayer.attendance_status !== "declined" ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <CancelIcon />
                  )
                }
                onClick={() => handleUpdateAttendance("declined")}
                disabled={isUpdatingSelf}
                sx={{ borderRadius: 2, textTransform: "none" }}
              >
                {t("peladas.attendance.button.decline")}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      <Grid container spacing={3}>
        {/* Confirmed Column */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ mb: 2, display: "flex", alignItems: "center" }}>
            <CheckCircleIcon sx={{ mr: 1, color: "success.main" }} />
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              {t("peladas.attendance.status.confirmed")}{" "}
              <Typography component="span" color="text.secondary">
                ({confirmed.length})
              </Typography>
            </Typography>
          </Box>
          <Stack spacing={2}>
            {confirmed.map((p) => (
              <PlayerAttendanceCard
                key={p.id}
                player={p}
                isAdmin={isAdmin}
                isCurrentUser={p.user_id === user?.id}
                onUpdate={(status) => handleUpdateAttendance(status, p.id)}
                isUpdating={updatingPlayers.has(p.id)}
              />
            ))}
            {confirmed.length === 0 && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontStyle: "italic", textAlign: "center", py: 2 }}
              >
                {t("peladas.attendance.empty.confirmed")}
              </Typography>
            )}
          </Stack>
        </Grid>

        {/* Declined Column */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ mb: 2, display: "flex", alignItems: "center" }}>
            <CancelIcon sx={{ mr: 1, color: "error.main" }} />
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              {t("peladas.attendance.status.declined")}{" "}
              <Typography component="span" color="text.secondary">
                ({declined.length})
              </Typography>
            </Typography>
          </Box>
          <Stack spacing={2}>
            {declined.map((p) => (
              <PlayerAttendanceCard
                key={p.id}
                player={p}
                isAdmin={isAdmin}
                isCurrentUser={p.user_id === user?.id}
                onUpdate={(status) => handleUpdateAttendance(status, p.id)}
                isUpdating={updatingPlayers.has(p.id)}
              />
            ))}
            {declined.length === 0 && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontStyle: "italic", textAlign: "center", py: 2 }}
              >
                {t("peladas.attendance.empty.declined")}
              </Typography>
            )}
          </Stack>
        </Grid>

        {/* Pending Column */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ mb: 2, display: "flex", alignItems: "center" }}>
            <PendingIcon sx={{ mr: 1, color: "text.secondary" }} />
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              {t("peladas.attendance.status.pending")}{" "}
              <Typography component="span" color="text.secondary">
                ({pending.length})
              </Typography>
            </Typography>
          </Box>
          <Stack spacing={2}>
            {pending.map((p) => (
              <PlayerAttendanceCard
                key={p.id}
                player={p}
                isAdmin={isAdmin}
                isCurrentUser={p.user_id === user?.id}
                onUpdate={(status) => handleUpdateAttendance(status, p.id)}
                isUpdating={updatingPlayers.has(p.id)}
              />
            ))}
            {pending.length === 0 && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontStyle: "italic", textAlign: "center", py: 2 }}
              >
                {t("peladas.attendance.empty.pending")}
              </Typography>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}

function PlayerAttendanceCard({
  player,
  isAdmin,
  isCurrentUser,
  onUpdate,
  isUpdating,
}: {
  player: PlayerWithUser;
  isAdmin: boolean;
  isCurrentUser: boolean;
  onUpdate: (status: AttendanceStatus) => void;
  isUpdating: boolean;
}) {
  const { t } = useTranslation();
  const initials = player.user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        "&:hover": { borderColor: "primary.main", bgcolor: "grey.50" },
        transition: "all 0.2s",
      }}
    >
      <CardContent
        sx={{
          p: "16px !important",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Avatar
            sx={{
              width: 44,
              height: 44,
              mr: 2,
              bgcolor: isCurrentUser ? "primary.main" : "grey.100",
              color: isCurrentUser ? "white" : "text.primary",
              fontSize: "0.875rem",
              fontWeight: "bold",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            {initials}
          </Avatar>
          <Box>
            <Typography
              variant="subtitle1"
              component="div"
              sx={{ fontWeight: "bold", lineHeight: 1.2 }}
            >
              {player.user.name}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              {isCurrentUser && (
                <Typography
                  variant="caption"
                  color="primary.main"
                  sx={{ fontWeight: "bold" }}
                >
                  {t("common.you")}
                </Typography>
              )}
              {player.position_id === 1 && (
                <Typography variant="caption" color="text.secondary">
                  {t("common.positions.goalkeeper")}
                </Typography>
              )}
            </Stack>
          </Box>
        </Box>

        {(isAdmin || isCurrentUser) && (
          <Stack direction="row" spacing={1}>
            {isUpdating ? (
              <Box sx={{ p: 0.5 }}>
                <CircularProgress size={20} />
              </Box>
            ) : (
              <>
                {player.attendance_status !== "confirmed" && (
                  <IconButton
                    size="small"
                    onClick={() => onUpdate("confirmed")}
                    sx={{
                      color: "grey.400",
                      "&:hover": {
                        color: "success.main",
                        bgcolor: "success.light",
                        alpha: 0.1,
                      },
                    }}
                  >
                    <CheckCircleIcon fontSize="small" />
                  </IconButton>
                )}
                {player.attendance_status !== "declined" && (
                  <IconButton
                    size="small"
                    onClick={() => onUpdate("declined")}
                    sx={{
                      color: "grey.400",
                      "&:hover": {
                        color: "error.main",
                        bgcolor: "error.light",
                        alpha: 0.1,
                      },
                    }}
                  >
                    <CancelIcon fontSize="small" />
                  </IconButton>
                )}
              </>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}