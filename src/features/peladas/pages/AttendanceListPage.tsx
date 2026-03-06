import { useParams, Link as RouterLink } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Alert,
  Button,
  Box,
  Stack,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PendingIcon from "@mui/icons-material/Pending";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../shared/components/Loading";
import { useAttendance } from "../hooks/useAttendance";
import { useAuth } from "../../../app/providers/AuthContext";
import { api } from "../../../shared/api/client";
import { createApi } from "../../../shared/api/endpoints";
import AttendanceStats from "../components/AttendanceStats";
import UserAttendanceStatus from "../components/UserAttendanceStatus";
import AttendanceListColumn from "../components/AttendanceListColumn";
import AddPlayersFromOrgDialog from "../components/AddPlayersFromOrgDialog";

export default function AttendanceListPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const peladaId = Number(id);
  const { user } = useAuth();
  const [actuallyIsAdmin, setActuallyIsAdmin] = useState(false);
  const [addPlayersDialogOpen, setAddPlayersDialogOpen] = useState(false);

  const {
    pelada,
    players,
    confirmed,
    declined,
    pending,
    totalPlayers,
    isAdmin,
    loading,
    error,
    updatingPlayers,
    currentPlayerAsPlayer,
    isUpdatingSelf,
    handleUpdateAttendance,
    handleCloseAttendance,
    handleAddPlayersFromOrg,
  } = useAttendance(peladaId);

  const isAnyAdmin = pelada?.is_admin || isAdmin || actuallyIsAdmin;

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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <div data-testid="attendance-list-container">
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
          {isAnyAdmin && (
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                size="large"
                startIcon={<GroupAddIcon />}
                onClick={() => setAddPlayersDialogOpen(true)}
                data-testid="add-players-org-button"
                sx={{
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: "bold",
                }}
              >
                {t("peladas.panel.available.invite_button")}
              </Button>
              <Button
                variant="contained"
                size="large"
                startIcon={<CheckCircleIcon />}
                onClick={handleCloseAttendance}
                data-testid="close-attendance-button"
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
            </Stack>
          )}
        </Box>

        <AttendanceStats
          total={totalPlayers}
          confirmedCount={confirmed.length}
          declinedCount={declined.length}
          pendingCount={pending.length}
        />

        {currentPlayerAsPlayer && (
          <UserAttendanceStatus
            player={currentPlayerAsPlayer}
            isUpdating={isUpdatingSelf}
            onUpdate={(status) => handleUpdateAttendance(status)}
          />
        )}

        <Grid container spacing={3}>
          <AttendanceListColumn
            icon={<CheckCircleIcon sx={{ mr: 1, color: "success.main" }} />}
            title={t("peladas.attendance.status.confirmed")}
            count={confirmed.length}
            players={confirmed}
            emptyMessage={t("peladas.attendance.empty.confirmed")}
            isAdmin={isAdmin}
            currentUserId={currentPlayerAsPlayer?.user_id}
            onUpdate={handleUpdateAttendance}
            updatingPlayers={updatingPlayers}
          />

          <AttendanceListColumn
            icon={<CancelIcon sx={{ mr: 1, color: "error.main" }} />}
            title={t("peladas.attendance.status.declined")}
            count={declined.length}
            players={declined}
            emptyMessage={t("peladas.attendance.empty.declined")}
            isAdmin={isAdmin}
            currentUserId={currentPlayerAsPlayer?.user_id}
            onUpdate={handleUpdateAttendance}
            updatingPlayers={updatingPlayers}
          />

          <AttendanceListColumn
            icon={<PendingIcon sx={{ mr: 1, color: "text.secondary" }} />}
            title={t("peladas.attendance.status.pending")}
            count={pending.length}
            players={pending}
            emptyMessage={t("peladas.attendance.empty.pending")}
            isAdmin={isAdmin}
            currentUserId={currentPlayerAsPlayer?.user_id}
            onUpdate={handleUpdateAttendance}
            updatingPlayers={updatingPlayers}
          />
        </Grid>

        <AddPlayersFromOrgDialog
          open={addPlayersDialogOpen}
          onClose={() => setAddPlayersDialogOpen(false)}
          onAdd={handleAddPlayersFromOrg}
          organizationId={pelada.organization_id}
          excludePlayerIds={players.map((p) => p.id)}
        />
      </div>
    </Container>
  );
}
