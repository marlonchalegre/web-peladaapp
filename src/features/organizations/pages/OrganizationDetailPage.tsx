import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Alert,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { api } from "../../../shared/api/client";
import {
  createApi,
  type Pelada,
  type Organization,
  type OrganizationFeatureFlags,
  type OrganizationPlayerStats,
  type Player,
  type MonthlyWaitlistStatus,
  type PeladaHistoryEntry,
} from "../../../shared/api/endpoints";
import { useAuth } from "../../../app/providers/AuthContext";
import OrganizationDetailDesktopView from "../components/OrganizationDetailDesktopView";
import OrganizationDetailMobileView from "../components/OrganizationDetailMobileView";
import { ConfirmDeletePeladaDialog } from "../../admin/components/ConfirmDeletePeladaDialog";
import PrettyConfirmDialog from "../../../shared/components/PrettyConfirmDialog";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../shared/components/Loading";
import { getLocalizedErrorMessage } from "../../../shared/utils/error-handler";

const endpoints = createApi(api);

export default function OrganizationDetailPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const orgId = id!;
  const [org, setOrg] = useState<Organization | null>(null);
  const [peladas, setPeladas] = useState<Pelada[]>([]);
  const [historyByPelada, setHistoryByPelada] = useState<
    Record<string, PeladaHistoryEntry>
  >({});
  const [totalPeladas, setTotalPeladas] = useState(0);
  const [playersCount, setPlayersCount] = useState(24);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [peladaToDelete, setPeladaToDelete] = useState<Pelada | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [featureFlags, setFeatureFlags] =
    useState<OrganizationFeatureFlags | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [memberStats, setMemberStats] = useState<OrganizationPlayerStats[]>([]);
  const [waitlistStatus, setWaitlistStatus] =
    useState<MonthlyWaitlistStatus | null>(null);
  const [orgWaitlistCount, setOrgWaitlistCount] = useState(0);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [leaveWaitlistConfirmOpen, setLeaveWaitlistConfirmOpen] =
    useState(false);

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

        // Check if owner
        if (o.owner_id && user && String(o.owner_id) === String(user.id)) {
          setIsAdmin(true);
        } else {
          // Also check if user is in the admins list from backend
          endpoints.listAdminsByOrganization(orgId).then((admins) => {
            if (admins.some((a) => String(a.user_id) === String(user.id))) {
              setIsAdmin(true);
            } else {
              setIsAdmin(false);
            }
          });
        }
      })
      .catch((error: unknown) => {
        setError(
          getLocalizedErrorMessage(
            error,
            t,
            "organizations.detail.error.load_failed",
          ),
        );
      });

    // Load feature flags
    endpoints
      .getOrgFeatureFlags(orgId)
      .then((ff) => {
        setFeatureFlags(ff);
      })
      .catch((err: unknown) => {
        console.error("Failed to load feature flags", err);
      });

    // Load player and waitlist status
    endpoints
      .listPlayersByOrg(orgId)
      .then((orgPlayers) => {
        setPlayers(orgPlayers);
        setPlayersCount(orgPlayers.length);
        const me = orgPlayers.find(
          (p) => String(p.user_id) === String(user.id),
        );
        setCurrentPlayer(me || null);
        if (
          me &&
          me.member_type !== "mensalista" &&
          me.member_type !== "mensalista_temporario"
        ) {
          endpoints
            .getMonthlyWaitlistStatus(orgId)
            .then((status) => setWaitlistStatus(status))
            .catch((err) =>
              console.error("Failed to load waitlist status", err),
            );
        }
      })
      .catch((err) => {
        console.error("Failed to load org players", err);
      });
  }, [orgId, user, t]);

  const fetchPeladas = useCallback(async () => {
    if (!orgId) return;
    try {
      // The agenda always loads from the first page and grows via "ver mais".
      const response = await endpoints.listPeladasByOrg(orgId, 1, rowsPerPage);
      setPeladas(response.data);
      setTotalPeladas(response.total);
    } catch (error: unknown) {
      setError(
        getLocalizedErrorMessage(
          error,
          t,
          "organizations.detail.error.load_peladas_failed",
        ),
      );
    }
  }, [orgId, rowsPerPage, t]);

  useEffect(() => {
    const load = async () => {
      await fetchPeladas();
    };
    load();
  }, [fetchPeladas]);

  useEffect(() => {
    if (!orgId) return;
    let active = true;
    endpoints
      .getOrganizationHistory(orgId)
      .then((entries) => {
        if (!active) return;
        setHistoryByPelada(
          Object.fromEntries(entries.map((entry) => [entry.id, entry])),
        );
      })
      .catch(() => {
        if (active) setHistoryByPelada({});
      });
    return () => {
      active = false;
    };
  }, [orgId, peladas.length]);

  useEffect(() => {
    if (!orgId || isAdmin || featureFlags?.org_statistics === false) {
      setMemberStats([]);
      return;
    }
    let active = true;
    endpoints
      .getOrganizationStatistics(orgId, new Date().getFullYear())
      .then((data) => {
        if (active) setMemberStats(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setMemberStats([]);
      });
    return () => {
      active = false;
    };
  }, [orgId, isAdmin, featureFlags?.org_statistics]);

  useEffect(() => {
    if (!orgId || !isAdmin) {
      setOrgWaitlistCount(0);
      return;
    }
    let active = true;
    endpoints
      .listMonthlyWaitlist(orgId)
      .then((list) => {
        if (active) setOrgWaitlistCount(list.length);
      })
      .catch(() => {
        if (active) setOrgWaitlistCount(0);
      });
    return () => {
      active = false;
    };
  }, [orgId, isAdmin]);

  const handleLoadMore = () => {
    setRowsPerPage((prev) => prev + 10);
  };

  const confirmLeave = async () => {
    if (!orgId) return;
    setIsLeaving(true);
    try {
      await endpoints.leaveOrganization(orgId);
      navigate("/home");
    } catch (error: unknown) {
      setError(
        getLocalizedErrorMessage(
          error,
          t,
          "organizations.detail.error.leave_failed",
        ),
      );
      setLeaveDialogOpen(false);
    } finally {
      setIsLeaving(false);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!orgId) return;
    setWaitlistLoading(true);
    try {
      await endpoints.joinMonthlyWaitlist(orgId);
      setWaitlistStatus({ in_queue: true });
    } catch (err: unknown) {
      setError(
        getLocalizedErrorMessage(
          err,
          t,
          "organizations.management.waitlist.error.action_failed",
        ),
      );
    } finally {
      setWaitlistLoading(false);
    }
  };

  const handleLeaveWaitlist = async () => {
    if (!orgId || !currentPlayer) return;
    setWaitlistLoading(true);
    try {
      await endpoints.leaveMonthlyWaitlist(orgId, currentPlayer.id);
      setWaitlistStatus({ in_queue: false });
      setLeaveWaitlistConfirmOpen(false);
    } catch (err: unknown) {
      setError(
        getLocalizedErrorMessage(
          err,
          t,
          "organizations.management.waitlist.error.action_failed",
        ),
      );
    } finally {
      setWaitlistLoading(false);
    }
  };

  if (error)
    return (
      <Container sx={{ mt: 4, px: { xs: 1, sm: 2 } }} disableGutters>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  if (!org) return <Loading message={t("common.loading")} />;

  if (isDesktop) {
    return (
      <Box sx={{ width: "100%", bgcolor: "#f6f4ee", minHeight: "100vh" }}>
        <OrganizationDetailDesktopView
          org={org}
          peladas={peladas}
          totalPeladas={totalPeladas}
          isAdmin={isAdmin}
          playersCount={playersCount}
          waitlistCount={orgWaitlistCount}
          historyByPelada={historyByPelada}
          onCreatePeladaSuccess={fetchPeladas}
          onCreatePeladaQuick={async (data) => {
            const scheduledAt = new Date(
              `${data.date}T${data.time}:00`,
            ).toISOString();
            await endpoints.createPelada({
              organization_id: orgId,
              scheduled_at: scheduledAt,
              max_players: data.maxPlayers,
              location: data.location || undefined,
              notify_casual_players: true,
            });
            await fetchPeladas();
          }}
        />
      </Box>
    );
  }


  return (
    <Box sx={{ width: "100%", bgcolor: "#f6f4ee", minHeight: "100vh" }}>
      {org.is_blocked && (
        <Alert
          severity="warning"
          data-testid="org-blocked-banner"
          sx={{ mx: 2, mt: 2 }}
        >
          {t(
            "organizations.detail.blocked_warning",
            "Esta organização está bloqueada pelo administrador do sistema e não pode realizar novas peladas.",
          )}
        </Alert>
      )}

      <OrganizationDetailMobileView
        org={org}
        peladas={peladas}
        totalPeladas={totalPeladas}
        historyByPelada={historyByPelada}
        players={players}
        isAdmin={isAdmin}
        featureFlags={featureFlags}
        waitlistStatus={waitlistStatus}
        waitlistLoading={waitlistLoading}
        currentPlayer={currentPlayer}
        currentUser={user}
        memberStats={memberStats}
        onJoinWaitlist={handleJoinWaitlist}
        onLeaveWaitlist={() => setLeaveWaitlistConfirmOpen(true)}
        onCreatePelada={async (payload) => {
          try {
            const newPelada = await endpoints.createPelada(payload);
            navigate(`/peladas/${newPelada.id}/attendance`);
          } catch (error: unknown) {
            const message =
              error instanceof Error
                ? error.message
                : t("organizations.detail.error.create_pelada_failed");
            setError(message);
          }
        }}
        onDeletePelada={(pelada) => {
          setPeladaToDelete(pelada);
          setDeleteDialogOpen(true);
        }}
        onLeaveOrg={() => setLeaveDialogOpen(true)}
        onLoadMore={handleLoadMore}
      />

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
            data-analytics-id="confirm-leave-org-btn"
          >
            {isLeaving
              ? t("common.loading", "Carregando...")
              : t("common.actions.confirm", "Confirmar")}
          </Button>
        </DialogActions>
      </Dialog>

      {peladaToDelete && (
        <ConfirmDeletePeladaDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          pelada={peladaToDelete}
          loading={isDeleting}
          onConfirm={async () => {
            if (!peladaToDelete.id) return;
            setIsDeleting(true);
            try {
              await endpoints.deletePelada(peladaToDelete.id);
              setDeleteDialogOpen(false);
              fetchPeladas();
            } catch (error: unknown) {
              const message =
                error instanceof Error
                  ? error.message
                  : t("organizations.detail.error.delete_pelada_failed");
              setError(message);
            } finally {
              setIsDeleting(false);
            }
          }}
        />
      )}

      <PrettyConfirmDialog
        open={leaveWaitlistConfirmOpen}
        title={t("organizations.detail.waitlist.leave_confirm_title")}
        description={t("organizations.detail.waitlist.leave_confirm_message")}
        confirmLabel={t("organizations.detail.waitlist.leave_button")}
        severity="error"
        onConfirm={handleLeaveWaitlist}
        onClose={() => setLeaveWaitlistConfirmOpen(false)}
      />
    </Box>
  );
}