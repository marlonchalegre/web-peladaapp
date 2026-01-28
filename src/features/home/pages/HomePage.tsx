import { useEffect, useState, useCallback } from "react";
import {
  Typography,
  Container,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Chip,
  Avatar,
  Link,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import SecurityIcon from "@mui/icons-material/Security";
import GroupsIcon from "@mui/icons-material/Groups";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import InfoIcon from "@mui/icons-material/Info";
import { useAuth } from "../../../app/providers/AuthContext";
import { api } from "../../../shared/api/client";
import { createApi, type Pelada } from "../../../shared/api/endpoints";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../shared/components/Loading";
import CreateOrganizationForm from "../../organizations/components/CreateOrganizationForm";
import { Link as RouterLink, useNavigate } from "react-router-dom";

const endpoints = createApi(api);

type OrganizationWithRole = {
  id: number;
  name: string;
  role: "admin" | "player";
};

export default function HomePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [adminOrgs, setAdminOrgs] = useState<OrganizationWithRole[]>([]);
  const [memberOrgs, setMemberOrgs] = useState<OrganizationWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const [peladas, setPeladas] = useState<Pelada[]>([]);
  const PELADAS_PER_PAGE = 5;

  const fetchPeladas = useCallback(
    async (page: number) => {
      if (!user) return;
      try {
        const response = await endpoints.listPeladasByUser(
          user.id,
          page,
          PELADAS_PER_PAGE,
        );
        setPeladas(response.data);
      } catch (err) {
        console.error("Failed to fetch peladas", err);
      }
    },
    [user],
  );

  const fetchOrganizations = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);

      const userOrgs = await endpoints.listUserOrganizations(user.id);

      if (!Array.isArray(userOrgs)) {
        throw new Error(t("home.error.invalid_format_org_list"));
      }

      const adminOrgsList = userOrgs.filter((org) => org.role === "admin");
      const memberOrgsList = userOrgs.filter((org) => org.role === "player");

      setAdminOrgs(adminOrgsList);
      setMemberOrgs(memberOrgsList);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("home.error.load_failed");
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    fetchOrganizations();
    fetchPeladas(1);
  }, [fetchOrganizations, fetchPeladas]);

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Loading message={t("common.loading")} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header / Welcome Section */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 5,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 700, color: "text.primary", mb: 1 }}
          >
            {t("home.welcome.prefix", "Bem-vindo, ")}
            <Box component="span" sx={{ color: "primary.main" }}>
              {user.name}
            </Box>
            !
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            {t(
              "home.welcome.subtitle",
              "Aqui está o resumo das suas atividades.",
            )}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{
            bgcolor: "primary.main",
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            px: 3,
            py: 1,
            ":hover": { bgcolor: "primary.dark" },
          }}
        >
          {t("home.actions.create_organization", "CRIAR ORGANIZAÇÃO")}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Loading message={t("common.loading")} />
      ) : (
        <>
          {/* Minhas Peladas Section */}
          <Box sx={{ mb: 5 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <SportsSoccerIcon sx={{ mr: 1.5, color: "primary.main" }} />
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: "text.primary" }}
              >
                {t("home.sections.peladas.title", "Minhas Peladas")}
              </Typography>
            </Box>

            <Paper
              elevation={0}
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <Table>
                <TableHead sx={{ bgcolor: "background.default" }}>
                  <TableRow>
                    <TableCell
                      sx={{
                        color: "text.secondary",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        py: 2,
                      }}
                    >
                      {t("home.table.headers.date", "DATA")}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "text.secondary",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        py: 2,
                      }}
                    >
                      {t("home.table.headers.org_name", "NOME DA ORGANIZAÇÃO")}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "text.secondary",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        py: 2,
                      }}
                    >
                      {t("home.table.headers.status", "STATUS")}
                    </TableCell>
                    <TableCell padding="checkbox" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {peladas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          {t(
                            "home.sections.peladas.empty",
                            "Nenhuma pelada encontrada.",
                          )}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    peladas.map((pelada) => {
                      const peladaLink =
                        pelada.status === "attendance"
                          ? `/peladas/${pelada.id}/attendance`
                          : pelada.status === "voting"
                            ? `/peladas/${pelada.id}/voting`
                            : `/peladas/${pelada.id}/matches`;

                      return (
                        <TableRow
                          key={`pelada-${pelada.id}`}
                          hover
                          onClick={() => navigate(peladaLink)}
                          sx={{
                            cursor: "pointer",
                            "&:last-child td, &:last-child th": { border: 0 },
                          }}
                        >
                          <TableCell sx={{ py: 2.5 }}>
                            <Link
                              component={RouterLink}
                              to={peladaLink}
                              underline="hover"
                              sx={{ display: "block", textDecoration: "none" }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "primary.main",
                                  fontWeight: 500,
                                }}
                              >
                                {pelada.scheduled_at
                                  ? new Date(
                                      pelada.scheduled_at,
                                    ).toLocaleDateString()
                                  : t("common.date.tbd", "TBD")}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: "text.secondary" }}
                              >
                                {pelada.scheduled_at
                                  ? new Date(
                                      pelada.scheduled_at,
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : ""}
                              </Typography>
                            </Link>
                          </TableCell>
                          <TableCell sx={{ py: 2.5 }}>
                            <Typography
                              variant="body2"
                              fontWeight={500}
                              color="text.primary"
                            >
                              {pelada.organization_name ||
                                pelada.organization_id}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2.5 }}>
                            <Chip
                              label={t(
                                `pelada.status.${pelada.status}`,
                                pelada.status || "",
                              )}
                              size="small"
                              sx={{
                                bgcolor: "success.light",
                                color: "success.main",
                                fontWeight: 500,
                                borderRadius: 1,
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 2.5 }}>
                            <ChevronRightIcon sx={{ color: "grey.300" }} />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Paper>
          </Box>

          {/* Minhas Organizações (Administrador) */}
          <Box sx={{ mb: 5 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <SecurityIcon sx={{ mr: 1.5, color: "secondary.main" }} />
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: "text.primary" }}
              >
                {t(
                  "home.sections.admin_orgs.title",
                  "Minhas Organizações (Administrador)",
                )}
              </Typography>
            </Box>

            <Paper
              elevation={0}
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <Table>
                <TableHead sx={{ bgcolor: "background.default" }}>
                  <TableRow>
                    <TableCell
                      sx={{
                        color: "text.secondary",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        py: 2,
                      }}
                    >
                      {t("home.table.headers.org_name", "NOME DA ORGANIZAÇÃO")}
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "text.secondary",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        py: 2,
                      }}
                    >
                      {t("home.table.headers.role", "FUNÇÃO")}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {adminOrgs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          {t(
                            "home.sections.admin_orgs.empty",
                            "Nenhuma organização administrada.",
                          )}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    adminOrgs.map((org) => (
                      <TableRow
                        key={`admin-${org.id}`}
                        hover
                        onClick={() => navigate(`/organizations/${org.id}`)}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell sx={{ py: 2.5 }}>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Avatar
                              variant="rounded"
                              sx={{
                                bgcolor: "secondary.light",
                                color: "secondary.main",
                                mr: 2,
                                width: 40,
                                height: 40,
                              }}
                            >
                              <GroupsIcon />
                            </Avatar>
                            <Link
                              component={RouterLink}
                              to={`/organizations/${org.id}`}
                              underline="hover"
                              variant="body2"
                              fontWeight={600}
                              color="text.primary"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {org.name}
                            </Link>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 2.5 }}>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <VerifiedUserIcon
                              sx={{
                                fontSize: 16,
                                mr: 0.5,
                                color: "text.secondary",
                              }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {t("common.roles.admin", "Administrador")}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ py: 2.5 }}>
                          <Button
                            component={RouterLink}
                            to={`/organizations/${org.id}`}
                            variant="contained"
                            size="small"
                            sx={{
                              bgcolor: "action.hover",
                              color: "text.primary",
                              boxShadow: "none",
                              textTransform: "none",
                              fontWeight: 600,
                              "&:hover": {
                                bgcolor: "action.selected",
                                boxShadow: "none",
                              },
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {t("common.actions.manage", "Gerenciar")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Paper>
          </Box>

          {/* Organizações que faço parte (Jogador) */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <GroupsIcon sx={{ mr: 1.5, color: "text.secondary" }} />
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: "text.primary" }}
              >
                {t(
                  "home.sections.member_orgs.title",
                  "Organizações que faço parte (Jogador)",
                )}
              </Typography>
            </Box>

            {memberOrgs.length === 0 ? (
              <Box
                sx={{
                  border: "2px dashed",
                  borderColor: "divider",
                  borderRadius: 3,
                  py: 8,
                  px: 4,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "background.paper",
                  textAlign: "center",
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: "grey.100",
                    color: "grey.400",
                    width: 48,
                    height: 48,
                    mb: 2,
                  }}
                >
                  <InfoIcon />
                </Avatar>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ maxWidth: 400 }}
                >
                  {t(
                    "home.sections.member_orgs.empty_desc",
                    "No momento, você não faz parte de nenhuma organização como jogador.",
                  )}
                </Typography>
              </Box>
            ) : (
              <Paper
                elevation={0}
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <Table>
                  <TableHead sx={{ bgcolor: "background.default" }}>
                    <TableRow>
                      <TableCell
                        sx={{
                          color: "text.secondary",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          py: 2,
                        }}
                      >
                        {t(
                          "home.table.headers.org_name",
                          "NOME DA ORGANIZAÇÃO",
                        )}
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "text.secondary",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          py: 2,
                        }}
                      >
                        {t("home.table.headers.role", "FUNÇÃO")}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {memberOrgs.map((org) => (
                      <TableRow
                        key={`member-${org.id}`}
                        hover
                        onClick={() => navigate(`/organizations/${org.id}`)}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell sx={{ py: 2.5 }}>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Avatar
                              variant="rounded"
                              sx={{
                                bgcolor: "grey.100",
                                color: "text.secondary",
                                mr: 2,
                                width: 40,
                                height: 40,
                              }}
                            >
                              <GroupsIcon />
                            </Avatar>
                            <Link
                              component={RouterLink}
                              to={`/organizations/${org.id}`}
                              underline="hover"
                              variant="body2"
                              fontWeight={600}
                              color="text.primary"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {org.name}
                            </Link>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 2.5 }}>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Typography variant="body2" color="text.secondary">
                              {t("common.roles.player", "Jogador")}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}
          </Box>
        </>
      )}

      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      >
        <DialogTitle>{t("home.actions.create_organization")}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <CreateOrganizationForm
              onCreate={async (name) => {
                await endpoints.createOrganization(name);
                setCreateDialogOpen(false);
                fetchOrganizations();
              }}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
