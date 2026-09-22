import { useEffect, useState, useCallback } from "react";
import { Link as RouterLink, useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Alert,
  TablePagination,
  Box,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import Chip from "@mui/material/Chip";
import { api } from "../../../shared/api/client";
import {
  createApi,
  type Pelada,
  type Organization,
  type OrganizationFeatureFlags,
  type Player,
  type MonthlyWaitlistStatus,
  type PeladaHistoryEntry,
} from "../../../shared/api/endpoints";
import { useAuth } from "../../../app/providers/AuthContext";
import CreatePeladaForm from "../components/CreatePeladaForm";
import PeladasTable from "../components/PeladasTable";
import OrganizationDetailDesktopView from "../components/OrganizationDetailDesktopView";
import { ConfirmDeletePeladaDialog } from "../../admin/components/ConfirmDeletePeladaDialog";
import PrettyConfirmDialog from "../../../shared/components/PrettyConfirmDialog";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../shared/components/Loading";
import BreadcrumbNav from "../../../shared/components/BreadcrumbNav";
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
  const [page, setPage] = useState(0);
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
      .then((players) => {
        setPlayersCount(players.length);
        const me = players.find((p) => String(p.user_id) === String(user.id));
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
      // API uses 1-based page index, MUI uses 0-based
      const response = await endpoints.listPeladasByOrg(
        orgId,
        page + 1,
        rowsPerPage,
      );
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
  }, [orgId, page, rowsPerPage, t]);

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

  const orgInitials = (org.name || "Org")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 3);

  const activePelada = peladas.find(
    (p) => p.status === "attendance" || p.status === "open",
  );

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
    <Container
      maxWidth="lg"
      sx={{
        pt: 2,
        pb: 3,
        px: { xs: 1, sm: 2 },
      }}
      disableGutters
    >
      <>
        <Box sx={{ px: { xs: 1, sm: 0 }, mb: 2 }}>
          <BreadcrumbNav items={[{ label: org.name }]} />
        </Box>

        {/* Header Block (Templates 2c & 3a) */}
        <Box
          sx={{
            bgcolor: "#f6f4ee",
            p: { xs: 2, sm: 3 },
            borderRadius: "18px",
            border: "1.5px solid #eae6db",
            mb: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  bgcolor: "#146b3a",
                  border: "2.5px solid #17181a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: "13px",
                  color: "#ffffff",
                  flexShrink: 0,
                }}
              >
                {orgInitials}
              </Box>
              <Box>
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{
                    color: "#17181a",
                    fontWeight: 800,
                    fontSize: { xs: "1.25rem", sm: "1.5rem" },
                    letterSpacing: -0.5,
                    lineHeight: 1.2,
                  }}
                >
                  {org.name}
                </Typography>
                <Typography
                  sx={{
                    font: "700 9.5px/1 Archivo,sans-serif",
                    letterSpacing: ".14em",
                    color: "#6b675c",
                    mt: 0.5,
                    textTransform: "uppercase",
                  }}
                >
                  FUTEBOL ·{" "}
                  {isAdmin
                    ? "ADMIN"
                    : currentPlayer?.member_type
                      ? t(
                          `common.member_types.${currentPlayer.member_type}`,
                        ).toUpperCase()
                      : "MEMBRO"}{" "}
                  · {totalPeladas} PELADAS
                </Typography>
              </Box>
            </Box>

            {currentPlayer &&
              currentPlayer.member_type !== "mensalista" &&
              currentPlayer.member_type !== "mensalista_temporario" &&
              waitlistStatus !== null && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >
                  {waitlistStatus.in_queue ? (
                    <>
                      <Chip
                        icon={<HourglassTopIcon />}
                        label={t(
                          "organizations.detail.waitlist.in_queue_badge",
                        )}
                        color="primary"
                        variant="outlined"
                        size="small"
                        data-testid="waitlist-in-queue-badge"
                      />
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => setLeaveWaitlistConfirmOpen(true)}
                        disabled={waitlistLoading}
                        data-testid="leave-waitlist-button"
                        sx={{ textTransform: "none", py: 0.25 }}
                      >
                        {t("organizations.detail.waitlist.leave_button")}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      startIcon={<FormatListNumberedIcon />}
                      onClick={handleJoinWaitlist}
                      disabled={waitlistLoading}
                      data-testid="join-waitlist-button"
                      sx={{ textTransform: "none" }}
                    >
                      {t("organizations.detail.waitlist.candidate_button")}
                    </Button>
                  )}
                </Box>
              )}
          </Box>

          {/* Quick Actions Row */}
          <Box sx={{ display: "flex", gap: 1.5, mt: 2.5, flexWrap: "wrap" }}>
            <Button
              {...(featureFlags?.org_statistics !== false
                ? {
                    component: RouterLink,
                    to: `/organizations/${orgId}/statistics`,
                  }
                : { disabled: true })}
              data-testid="org-statistics-button"
              data-analytics-id="view-org-statistics-btn"
              sx={{
                flex: 1,
                minWidth: "200px",
                bgcolor:
                  featureFlags?.org_statistics !== false
                    ? "#17181a"
                    : "grey.300",
                color: "#ffffff !important",
                borderRadius: "13px",
                p: "10px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                textTransform: "none",
                border: "1.5px solid #17181a",
                "&:hover": {
                  bgcolor: "#000000",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                {/* Amber podium bars */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: "2px",
                    flexShrink: 0,
                  }}
                >
                  <Box
                    sx={{
                      width: 3.5,
                      height: 8,
                      bgcolor: "#f2a100",
                      borderRadius: "1px",
                    }}
                  />
                  <Box
                    sx={{
                      width: 3.5,
                      height: 13,
                      bgcolor: "#f2a100",
                      borderRadius: "1px",
                    }}
                  />
                  <Box
                    sx={{
                      width: 3.5,
                      height: 17,
                      bgcolor: "#f2a100",
                      borderRadius: "1px",
                    }}
                  />
                </Box>
                <Box sx={{ textAlign: "left" }}>
                  <Typography
                    sx={{
                      font: "800 11.5px/1 Archivo,sans-serif",
                      letterSpacing: ".04em",
                      color: "#ffffff",
                    }}
                  >
                    {t(
                      "organizations.detail.button.statistics",
                      "ESTATÍSTICAS",
                    )}
                  </Typography>
                  <Typography
                    sx={{
                      font: "600 9.5px/1.2 Archivo,sans-serif",
                      color: "#9a958a",
                      mt: 0.25,
                    }}
                  >
                    artilharia, presença, títulos
                  </Typography>
                </Box>
              </Box>
              <Typography
                sx={{
                  font: "700 16px/1 Archivo,sans-serif",
                  color: "#9a958a",
                  ml: 1,
                }}
              >
                ›
              </Typography>
            </Button>

            {isAdmin ? (
              <Button
                component={RouterLink}
                to={`/organizations/${orgId}/management`}
                variant="outlined"
                data-testid="org-management-button"
                data-analytics-id="manage-org-btn"
                sx={{
                  borderRadius: "13px",
                  border: "1.5px solid #ddd8cc",
                  bgcolor: "#ffffff",
                  color: "#17181a",
                  px: 2,
                  py: 1,
                  fontWeight: 800,
                  fontSize: "11px",
                  letterSpacing: ".04em",
                  textTransform: "uppercase",
                  "&:hover": {
                    borderColor: "#17181a",
                    bgcolor: "#f6f4ee",
                  },
                }}
              >
                <SettingsIcon sx={{ mr: 1, fontSize: 18 }} />
                {t("organizations.detail.button.management", "GERENCIAR")}
              </Button>
            ) : (
              <Button
                variant="outlined"
                color="error"
                onClick={() => setLeaveDialogOpen(true)}
                data-testid="leave-org-button"
                data-analytics-id="leave-org-btn"
                sx={{
                  borderRadius: "13px",
                  border: "1.5px solid #ddd8cc",
                  bgcolor: "#ffffff",
                  px: 2,
                  py: 1,
                  fontWeight: 800,
                  fontSize: "11px",
                  letterSpacing: ".04em",
                  textTransform: "uppercase",
                  "&:hover": {
                    borderColor: "error.main",
                    bgcolor: "#fdf6f3",
                  },
                }}
              >
                <ExitToAppIcon sx={{ mr: 1, fontSize: 18 }} />
                {t("organizations.detail.button.leave", "Sair")}
              </Button>
            )}
          </Box>

          {/* 3 Quick Counters for Admin (Template 2c) */}
          {isAdmin && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 1.5,
                mt: 2.5,
              }}
            >
              <Box
                sx={{
                  bgcolor: "#ffffff",
                  border: "1.5px solid #ddd8cc",
                  borderRadius: "13px",
                  p: "10px 12px",
                }}
              >
                <Typography
                  sx={{
                    font: "700 22px/1 'Archivo Narrow',Archivo,sans-serif",
                    color: "#17181a",
                  }}
                >
                  {totalPeladas}
                </Typography>
                <Typography
                  sx={{
                    font: "700 8px/1.2 Archivo,sans-serif",
                    letterSpacing: ".08em",
                    color: "#6b675c",
                    mt: 0.5,
                    textTransform: "uppercase",
                  }}
                >
                  PELADAS
                </Typography>
              </Box>
              <Box
                sx={{
                  bgcolor: "#ffffff",
                  border: "1.5px solid #ddd8cc",
                  borderRadius: "13px",
                  p: "10px 12px",
                }}
              >
                <Typography
                  sx={{
                    font: "700 22px/1 'Archivo Narrow',Archivo,sans-serif",
                    color: "#a8452a",
                  }}
                >
                  0
                </Typography>
                <Typography
                  sx={{
                    font: "700 8px/1.2 Archivo,sans-serif",
                    letterSpacing: ".08em",
                    color: "#6b675c",
                    mt: 0.5,
                    textTransform: "uppercase",
                  }}
                >
                  A RECEBER
                </Typography>
              </Box>
              <Box
                sx={{
                  bgcolor: "#ffffff",
                  border: "1.5px solid #ddd8cc",
                  borderRadius: "13px",
                  p: "10px 12px",
                }}
              >
                <Typography
                  sx={{
                    font: "700 22px/1 'Archivo Narrow',Archivo,sans-serif",
                    color: "#17181a",
                  }}
                >
                  {waitlistStatus?.in_queue ? 1 : 0}
                </Typography>
                <Typography
                  sx={{
                    font: "700 8px/1.2 Archivo,sans-serif",
                    letterSpacing: ".08em",
                    color: "#6b675c",
                    mt: 0.5,
                    textTransform: "uppercase",
                  }}
                >
                  NA FILA
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        <Stack spacing={4}>
          {org.is_blocked && (
            <Alert severity="warning" data-testid="org-blocked-banner">
              {t(
                "organizations.detail.blocked_warning",
                "Esta organização está bloqueada pelo administrador do sistema e não pode realizar novas peladas.",
              )}
            </Alert>
          )}

          {/* Member View: Next Pelada Banner (Template 3a) */}
          {!isAdmin && activePelada && (
            <Box
              sx={{
                bgcolor: "#ffffff",
                border: "2px solid #17181a",
                borderRadius: "18px",
                overflow: "hidden",
                boxShadow: "5px 5px 0 #17181a",
              }}
            >
              <Box
                sx={{
                  bgcolor: "#146b3a",
                  px: 2,
                  py: 1.25,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography
                  sx={{
                    font: "800 11px/1 Archivo,sans-serif",
                    letterSpacing: ".1em",
                    color: "#ffffff",
                    textTransform: "uppercase",
                  }}
                >
                  LISTA ABERTA
                </Typography>
                <Typography
                  sx={{
                    font: "700 11px/1 Archivo,sans-serif",
                    color: "#bfe6ce",
                  }}
                >
                  {activePelada.scheduled_at
                    ? new Date(activePelada.scheduled_at).toLocaleDateString(
                        "pt-BR",
                      )
                    : "Em breve"}
                </Typography>
              </Box>
              <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 800, color: "#17181a" }}
                >
                  Próxima Pelada
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#6b675c", mt: 0.5, mb: 2 }}
                >
                  {activePelada.scheduled_at
                    ? new Date(activePelada.scheduled_at).toLocaleString(
                        "pt-BR",
                        {
                          weekday: "long",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )
                    : "Horário a definir"}
                </Typography>
                <Button
                  component={RouterLink}
                  to={`/peladas/${activePelada.id}/attendance`}
                  fullWidth
                  variant="contained"
                  sx={{
                    bgcolor: "#146b3a",
                    color: "#ffffff",
                    borderRadius: "14px",
                    py: 1.5,
                    fontWeight: 800,
                    fontSize: "1rem",
                    letterSpacing: ".04em",
                    textTransform: "uppercase",
                    boxShadow: "0 3px 0 #0d4526",
                    "&:hover": { bgcolor: "#0e5c31" },
                  }}
                >
                  Ver Lista e Confirmar
                </Button>
              </Box>
            </Box>
          )}

          {/* Create Pelada Section (Template 2c) */}
          {isAdmin && !org.is_blocked && (
            <Box
              sx={{
                bgcolor: "#ffffff",
                border: "2px solid #17181a",
                borderRadius: "18px",
                overflow: "hidden",
                boxShadow: "5px 5px 0 #17181a",
              }}
            >
              <Box
                sx={{
                  bgcolor: "#17181a",
                  px: 2,
                  py: 1.25,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography
                  sx={{
                    font: "800 11px/1 Archivo,sans-serif",
                    letterSpacing: ".1em",
                    color: "#ffffff",
                    textTransform: "uppercase",
                  }}
                >
                  {t("organizations.detail.section.new_pelada")}
                </Typography>
                <Typography
                  sx={{
                    font: "700 10px/1 Archivo,sans-serif",
                    letterSpacing: ".06em",
                    color: "#9a958a",
                    textTransform: "uppercase",
                  }}
                >
                  TODA SEMANA
                </Typography>
              </Box>
              <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
                <CreatePeladaForm
                  organizationId={orgId}
                  defaultMaxPlayers={org.default_max_players}
                  defaultLocation={org.default_location}
                  onCreate={async (payload) => {
                    try {
                      const newPelada = await endpoints.createPelada(payload);
                      navigate(`/peladas/${newPelada.id}/attendance`);
                    } catch (error: unknown) {
                      const message =
                        error instanceof Error
                          ? error.message
                          : t(
                              "organizations.detail.error.create_pelada_failed",
                            );
                      setError(message);
                    }
                  }}
                />
              </Box>
            </Box>
          )}

          {/* Pelada List Section / Agenda */}
          <Box
            sx={{
              bgcolor: "#ffffff",
              border: "1.5px solid #eae6db",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                p: 2,
                borderBottom: "1.5px solid #eae6db",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                sx={{
                  font: "700 10px/1 Archivo,sans-serif",
                  letterSpacing: ".18em",
                  color: "#6b675c",
                  textTransform: "uppercase",
                }}
              >
                AGENDA DO GRUPO
              </Typography>
              <Typography
                sx={{
                  font: "700 11px/1 Archivo,sans-serif",
                  color: "#146b3a",
                }}
              >
                {totalPeladas} PELADAS
              </Typography>
            </Box>
            <PeladasTable
              peladas={peladas}
              onDelete={
                isAdmin
                  ? async (id) => {
                      const p = peladas.find((item) => item.id === id) || null;
                      setPeladaToDelete(p);
                      setDeleteDialogOpen(true);
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
          </Box>
        </Stack>
      </>

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
    </Container>
  );
}
