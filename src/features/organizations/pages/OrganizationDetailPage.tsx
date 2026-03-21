import { useEffect, useState, useCallback } from "react";
import { Link as RouterLink, useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Alert,
  TablePagination,
  Box,
  Button,
  Paper,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SettingsIcon from "@mui/icons-material/Settings";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import { api } from "../../../shared/api/client";
import {
  createApi,
  type Pelada,
  type Organization,
} from "../../../shared/api/endpoints";
import { useAuth } from "../../../app/providers/AuthContext";
import CreatePeladaForm from "../components/CreatePeladaForm";
import PeladasTable from "../components/PeladasTable";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../shared/components/Loading";
import BreadcrumbNav from "../../../shared/components/BreadcrumbNav";

const endpoints = createApi(api);

export default function OrganizationDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const orgId = Number(id);
  const [org, setOrg] = useState<Organization | null>(null);
  const [peladas, setPeladas] = useState<Pelada[]>([]);
  const [totalPeladas, setTotalPeladas] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (!orgId || !user) return;

    // Initial check from AuthContext
    const userIsAdmin = user.admin_orgs?.includes(orgId) ?? false;
    setIsAdmin(userIsAdmin);

    // Load org details
    endpoints
      .getOrganization(orgId)
      .then((o) => {
        setOrg(o);
        console.log(
          "ORG LOADED:",
          o.id,
          "OWNER:",
          o.owner_id,
          "USER:",
          user.id,
        );

        // Check if owner
        if (o.owner_id && user && String(o.owner_id) === String(user.id)) {
          console.log("IS OWNER -> ADMIN");
          setIsAdmin(true);
          return;
        }

        // Also check if user is in the admins list from backend
        endpoints.listAdminsByOrganization(orgId).then((admins) => {
          console.log(
            "ADMINS LIST:",
            admins.map((a) => a.user_id),
          );
          if (admins.some((a) => String(a.user_id) === String(user.id))) {
            console.log("IN ADMINS LIST -> ADMIN");
            setIsAdmin(true);
          }
        });
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : t("organizations.detail.error.load_failed");
        setError(message);
      });
  }, [orgId, user, t, peladas.length]); // Added peladas.length as a hint to refresh when data changes

  const fetchPeladas = useCallback(async () => {
    if (!orgId) return;
    try {
      // API uses 1-based page index, MUI uses 0-based
      const response = await endpoints.listPeladasByOrg(
        orgId,
        page + 1,
        rowsPerPage,
      );
      setPeladas(response.data);
      setTotalPeladas(response.total);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("organizations.detail.error.load_peladas_failed");
      setError(message);
    }
  }, [orgId, page, rowsPerPage, t]);

  useEffect(() => {
    const load = async () => {
      await fetchPeladas();
    };
    load();
  }, [fetchPeladas]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const confirmLeave = async () => {
    if (!orgId) return;
    setIsLeaving(true);
    try {
      await endpoints.leaveOrganization(orgId);
      navigate("/");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t(
              "organizations.detail.error.leave_failed",
              "Falha ao sair da organização",
            );
      setError(message);
      setLeaveDialogOpen(false);
    } finally {
      setIsLeaving(false);
    }
  };

  if (error)
    return (
      <Container sx={{ mt: 4, px: { xs: 1, sm: 2 } }} disableGutters>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  if (!org) return <Loading message={t("common.loading")} />;

  return (
    <Container
      maxWidth="lg"
      sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}
      disableGutters
    >
      <Box sx={{ px: { xs: 1, sm: 0 } }}>
        <BreadcrumbNav items={[{ label: org.name }]} />
      </Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 4,
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          px: { xs: 1, sm: 0 },
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          color="primary.main"
          fontWeight="bold"
        >
          {org.name}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            component={RouterLink}
            to={`/organizations/${orgId}/statistics`}
            variant="outlined"
            data-testid="org-statistics-button"
            sx={{
              minWidth: { xs: "40px", sm: "auto" },
              px: { xs: 0, sm: 2 },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textTransform: "none",
            }}
          >
            <AssessmentIcon sx={{ mr: { xs: 0, sm: 1 } }} />
            <Box
              component="span"
              sx={{ display: { xs: "none", sm: "inline" } }}
            >
              {t("organizations.detail.button.statistics")}
            </Box>
          </Button>
          {!isAdmin && (
            <Button
              variant="outlined"
              color="error"
              onClick={() => setLeaveDialogOpen(true)}
              data-testid="leave-org-button"
              sx={{
                minWidth: { xs: "40px", sm: "auto" },
                px: { xs: 0, sm: 2 },
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textTransform: "none",
              }}
            >
              <ExitToAppIcon sx={{ mr: { xs: 0, sm: 1 } }} />
              <Box
                component="span"
                sx={{ display: { xs: "none", sm: "inline" } }}
              >
                {t("organizations.detail.button.leave", "Sair da Organização")}
              </Box>
            </Button>
          )}
          {isAdmin && (
            <Button
              component={RouterLink}
              to={`/organizations/${orgId}/management`}
              variant="outlined"
              color="primary"
              data-testid="org-management-button"
              sx={{
                minWidth: { xs: "40px", sm: "auto" },
                px: { xs: 0, sm: 2 },
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textTransform: "none",
              }}
            >
              <SettingsIcon sx={{ mr: { xs: 0, sm: 1 } }} />
              <Box
                component="span"
                sx={{ display: { xs: "none", sm: "inline" } }}
              >
                {t("organizations.detail.button.management")}
              </Box>
            </Button>
          )}
        </Stack>
      </Box>

      <Stack spacing={4}>
        {/* Create Pelada Section */}
        {isAdmin && (
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              {t("organizations.detail.section.new_pelada")}
            </Typography>
            <CreatePeladaForm
              organizationId={orgId}
              onCreate={async (payload) => {
                try {
                  const newPelada = await endpoints.createPelada(payload);
                  // Navigate directly to the attendance list for the new pelada
                  navigate(`/peladas/${newPelada.id}/attendance`);
                } catch (error: unknown) {
                  const message =
                    error instanceof Error
                      ? error.message
                      : t("organizations.detail.error.create_pelada_failed");
                  setError(message);
                }
              }}
            />
          </Paper>
        )}

        {/* Pelada List Section */}
        <Paper variant="outlined">
          <PeladasTable
            peladas={peladas}
            onDelete={
              isAdmin
                ? async (id) => {
                    try {
                      await endpoints.deletePelada(id);
                      fetchPeladas();
                    } catch (error: unknown) {
                      const message =
                        error instanceof Error
                          ? error.message
                          : t(
                              "organizations.detail.error.delete_pelada_failed",
                            );
                      setError(message);
                    }
                  }
                : undefined
            }
          />
          <TablePagination
            component="div"
            count={totalPeladas}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage={t("common.pagination.rows_per_page")}
            sx={{ borderTop: 1, borderColor: "divider" }}
          />
        </Paper>
      </Stack>

      {/* Confirmation Dialog */}
      <Dialog
        open={leaveDialogOpen}
        onClose={() => !isLeaving && setLeaveDialogOpen(false)}
      >
        <DialogTitle>
          {t("organizations.detail.leave_dialog.title", "Sair da Organização")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t(
              "organizations.detail.leave_dialog.content",
              "Tem certeza que deseja sair desta organização? Você perderá o acesso às peladas e estatísticas desta organização.",
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setLeaveDialogOpen(false)}
            disabled={isLeaving}
            color="inherit"
          >
            {t("common.actions.cancel", "Cancelar")}
          </Button>
          <Button
            onClick={confirmLeave}
            disabled={isLeaving}
            color="error"
            variant="contained"
            autoFocus
            data-testid="confirm-leave-org-button"
          >
            {isLeaving
              ? t("common.loading", "Carregando...")
              : t("common.actions.confirm", "Confirmar")}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
