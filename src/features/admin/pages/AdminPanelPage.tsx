import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Paper,
  Tabs,
  Tab,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  CircularProgress,
  Alert,
  Snackbar,
  Pagination,
  Stack,
  IconButton,
  Chip,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Search as SearchIcon,
  Block as BlockIcon,
  AdminPanelSettings as AdminIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthContext";
import { api } from "../../../shared/api/client";
import {
  createApi,
  type User,
  type Organization,
} from "../../../shared/api/endpoints";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";
import BreadcrumbNav from "../../../shared/components/BreadcrumbNav";

const endpoints = createApi(api);

export default function AdminPanelPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const theme = useTheme();

  // Redirect if not super admin
  useEffect(() => {
    if (currentUser && !currentUser.is_super_admin) {
      navigate("/home");
    }
  }, [currentUser, navigate]);

  // Tab State
  const [tabValue, setTabValue] = useState(0);

  // Search & Pagination States - Users
  const [userQuery, setUserQuery] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Search & Pagination States - Organizations
  const [orgQuery, setOrgQuery] = useState("");
  const [orgPage, setOrgPage] = useState(1);
  const [orgTotalPages, setOrgTotalPages] = useState(1);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);

  // Action / Feedback States
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastSeverity, setToastSeverity] = useState<
    "success" | "error" | "info"
  >("success");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const showToast = (
    message: string,
    severity: "success" | "error" | "info" = "success",
  ) => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  // Fetch Users
  const fetchUsers = useCallback(
    async (query: string, page: number) => {
      setUsersLoading(true);
      try {
        const response = await endpoints.searchUsers(query, page, 10);
        setUsers(response.data || []);
        setUserTotalPages(response.totalPages || 1);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        showToast(
          t("admin.errors.fetch_users", "Erro ao carregar usuários."),
          "error",
        );
      } finally {
        setUsersLoading(false);
      }
    },
    [t],
  );

  // Fetch Organizations
  const fetchOrganizations = useCallback(
    async (query: string, page: number) => {
      setOrganizationsLoading(true);
      try {
        const response = await endpoints.listOrganizationsAdmin(
          query,
          page,
          10,
        );
        setOrganizations(response.data || []);
        setOrgTotalPages(response.totalPages || 1);
      } catch (err) {
        console.error("Failed to fetch organizations:", err);
        showToast(
          t("admin.errors.fetch_orgs", "Erro ao carregar organizações."),
          "error",
        );
      } finally {
        setOrganizationsLoading(false);
      }
    },
    [t],
  );

  // Load Initial Data & on Tab Switch
  useEffect(() => {
    if (tabValue === 0) {
      fetchUsers(userQuery, userPage);
    } else {
      fetchOrganizations(orgQuery, orgPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabValue, userPage, orgPage, fetchUsers, fetchOrganizations]);

  // Search Submit/Change Handlers
  const handleUserSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setUserPage(1);
    fetchUsers(userQuery, 1);
  };

  const handleOrgSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOrgPage(1);
    fetchOrganizations(orgQuery, 1);
  };

  // Toggles for User Flags
  const handleToggleUserBlock = async (user: User) => {
    const actionKey = `block-${user.id}`;
    setActionInProgress(actionKey);
    try {
      const res = await endpoints.toggleBlockUser(user.id);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_blocked: res.is_blocked } : u,
        ),
      );
      showToast(
        res.is_blocked
          ? t("admin.success.user_blocked", "Usuário bloqueado com sucesso.")
          : t(
              "admin.success.user_unblocked",
              "Usuário desbloqueado com sucesso.",
            ),
        "success",
      );
    } catch (err) {
      console.error("Failed to toggle user block:", err);
      showToast(
        t("admin.errors.toggle_block", "Falha ao alterar estado de bloqueio."),
        "error",
      );
    } finally {
      setActionInProgress(null);
    }
  };

  const handleToggleUserOrgCreation = async (user: User) => {
    const actionKey = `org-creation-${user.id}`;
    setActionInProgress(actionKey);
    try {
      const res = await endpoints.toggleOrgCreation(user.id);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, allow_org_creation: res.allow_org_creation }
            : u,
        ),
      );
      showToast(
        res.allow_org_creation
          ? t(
              "admin.success.org_creation_allowed",
              "Criação de organização permitida.",
            )
          : t(
              "admin.success.org_creation_disallowed",
              "Criação de organização restrita.",
            ),
        "success",
      );
    } catch (err) {
      console.error("Failed to toggle user org creation:", err);
      showToast(
        t(
          "admin.errors.toggle_org_creation",
          "Falha ao alterar permissão de criação.",
        ),
        "error",
      );
    } finally {
      setActionInProgress(null);
    }
  };

  const handleToggleUserSuperAdmin = async (user: User) => {
    if (user.id === currentUser?.id) {
      showToast(
        t(
          "admin.warnings.cannot_demote_self",
          "Você não pode remover seu próprio privilégio de Super Admin.",
        ),
        "info",
      );
      return;
    }
    const actionKey = `super-admin-${user.id}`;
    setActionInProgress(actionKey);
    try {
      const res = await endpoints.toggleSuperAdmin(user.id);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_super_admin: res.is_super_admin } : u,
        ),
      );
      showToast(
        res.is_super_admin
          ? t(
              "admin.success.super_admin_granted",
              "Privilégios de Super Admin concedidos.",
            )
          : t(
              "admin.success.super_admin_revoked",
              "Privilégios de Super Admin revogados.",
            ),
        "success",
      );
    } catch (err) {
      console.error("Failed to toggle user super admin status:", err);
      showToast(
        t(
          "admin.errors.toggle_super_admin",
          "Falha ao alterar status de Super Admin.",
        ),
        "error",
      );
    } finally {
      setActionInProgress(null);
    }
  };

  // Toggle for Organization Block
  const handleToggleOrgBlock = async (org: Organization) => {
    const actionKey = `org-block-${org.id}`;
    setActionInProgress(actionKey);
    try {
      const res = await endpoints.toggleBlockOrganization(org.id);
      setOrganizations((prev) =>
        prev.map((o) =>
          o.id === org.id ? { ...o, is_blocked: res.is_blocked } : o,
        ),
      );
      showToast(
        res.is_blocked
          ? t("admin.success.org_blocked", "Organização bloqueada com sucesso.")
          : t(
              "admin.success.org_unblocked",
              "Organização desbloqueada com sucesso.",
            ),
        "success",
      );
    } catch (err) {
      console.error("Failed to toggle org block:", err);
      showToast(
        t(
          "admin.errors.toggle_org_block",
          "Falha ao alterar estado de bloqueio da organização.",
        ),
        "error",
      );
    } finally {
      setActionInProgress(null);
    }
  };

  if (!currentUser || !currentUser.is_super_admin) {
    return (
      <Container sx={{ py: 8, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  const glassmorphismStyle = {
    background:
      theme.palette.mode === "dark"
        ? "rgba(25, 25, 25, 0.65)"
        : "rgba(255, 255, 255, 0.75)",
    backdropFilter: "blur(20px)",
    border: `1px solid ${theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
    boxShadow:
      theme.palette.mode === "dark"
        ? "0 8px 32px 0 rgba(0, 0, 0, 0.37)"
        : "0 8px 32px 0 rgba(31, 38, 135, 0.08)",
    borderRadius: "16px",
    overflow: "hidden",
    p: 3,
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <BreadcrumbNav
        items={[{ label: t("navigation.adminPanel", "Painel de Admin") }]}
      />

      {/* Hero / Gradient Title Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          borderRadius: "16px",
          p: { xs: 3, md: 5 },
          mb: 4,
          boxShadow: `0 4px 20px 0 ${alpha(theme.palette.primary.main, 0.25)}`,
          color: "#fff",
        }}
      >
        <Typography
          variant="h3"
          component="h1"
          sx={{ fontWeight: 800, mb: 1, letterSpacing: "-0.02em" }}
        >
          {t("admin.title", "Painel do Super Admin")}
        </Typography>
        <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
          {t(
            "admin.subtitle",
            "Gerencie organizações, bloqueie usuários e administre as permissões globais do sistema.",
          )}
        </Typography>
      </Box>

      {/* Tabs Menu */}
      <Paper
        sx={{ mb: 4, borderRadius: "12px", overflow: "hidden" }}
        elevation={0}
        variant="outlined"
      >
        <Tabs
          value={tabValue}
          onChange={(_, val) => setTabValue(val)}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab
            label={t("admin.tabs.users", "Usuários")}
            icon={<AdminIcon sx={{ mr: 1 }} />}
            iconPosition="start"
            sx={{ fontWeight: 600, py: 2 }}
          />
          <Tab
            label={t("admin.tabs.organizations", "Organizações")}
            icon={<BlockIcon sx={{ mr: 1 }} />}
            iconPosition="start"
            sx={{ fontWeight: 600, py: 2 }}
          />
        </Tabs>
      </Paper>

      {/* Users Tab Panel */}
      {tabValue === 0 && (
        <Box sx={glassmorphismStyle}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: "text.primary" }}
            >
              {t("admin.sections.users.title", "Usuários Cadastrados")}
            </Typography>
            <IconButton
              color="primary"
              onClick={() => fetchUsers(userQuery, userPage)}
              disabled={usersLoading}
              sx={{ border: "1px solid", borderColor: "divider" }}
            >
              {usersLoading ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
          </Box>

          {/* Search Form */}
          <Box component="form" onSubmit={handleUserSearch} sx={{ mb: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder={t(
                "admin.sections.users.search_placeholder",
                "Buscar por nome, username ou e-mail...",
              )}
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: "10px" },
                },
              }}
            />
          </Box>

          {/* Users Table */}
          <TableContainer
            component={Paper}
            elevation={0}
            variant="outlined"
            sx={{
              borderRadius: "12px",
              border: "1px solid",
              borderColor: "divider",
              mb: 3,
              overflowX: "auto",
            }}
          >
            <Table sx={{ minWidth: 800 }}>
              <TableHead
                sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}
              >
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, minWidth: 240 }}>
                    {t("admin.table.user", "Usuário")}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>
                    {t("admin.table.position", "Posição")}
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 600, minWidth: 100 }}
                    align="center"
                  >
                    {t("admin.table.blocked", "Bloqueado")}
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 600, minWidth: 120 }}
                    align="center"
                  >
                    {t("admin.table.allow_org_creation", "Criar Orgs")}
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 600, minWidth: 120 }}
                    align="center"
                  >
                    {t("admin.table.super_admin", "Super Admin")}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usersLoading && users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">
                        {t(
                          "admin.table.no_users_found",
                          "Nenhum usuário encontrado.",
                        )}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow
                      key={user.id}
                      hover
                      sx={{ transition: "background-color 0.2s" }}
                    >
                      <TableCell sx={{ minWidth: 240 }}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                          <SecureAvatar
                            userId={user.id}
                            filename={user.avatar_filename}
                            fallbackText={user.name?.charAt(0).toUpperCase()}
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor: "primary.main",
                              flexShrink: 0,
                            }}
                          />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 600 }}
                              noWrap
                            >
                              {user.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block" }}
                              noWrap
                            >
                              @{user.username}
                            </Typography>
                            {user.email && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block" }}
                                noWrap
                              >
                                {user.email}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ minWidth: 120 }}>
                        <Chip
                          label={
                            user.position
                              ? t(
                                  `common.positions.${user.position.toLowerCase()}`,
                                  user.position,
                                )
                              : t(
                                  "common.positions.not_defined",
                                  "Não Definido",
                                )
                          }
                          size="small"
                          variant="outlined"
                          sx={{ textTransform: "capitalize" }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ minWidth: 100 }}>
                        <Switch
                          checked={!!user.is_blocked}
                          onChange={() => {
                            handleToggleUserBlock(user);
                          }}
                          disabled={actionInProgress === `block-${user.id}`}
                          color="error"
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ minWidth: 120 }}>
                        <Switch
                          checked={user.allow_org_creation !== false}
                          onChange={() => {
                            handleToggleUserOrgCreation(user);
                          }}
                          disabled={
                            actionInProgress === `org-creation-${user.id}`
                          }
                          color="success"
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ minWidth: 120 }}>
                        <Switch
                          checked={!!user.is_super_admin}
                          onChange={() => {
                            handleToggleUserSuperAdmin(user);
                          }}
                          disabled={
                            actionInProgress === `super-admin-${user.id}` ||
                            user.id === currentUser?.id
                          }
                          color="primary"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {userTotalPages > 1 && (
            <Stack spacing={2} sx={{ alignItems: "center" }}>
              <Pagination
                count={userTotalPages}
                page={userPage}
                onChange={(_, p) => {
                  setUserPage(p);
                  fetchUsers(userQuery, p);
                }}
                color="primary"
                shape="rounded"
              />
            </Stack>
          )}
        </Box>
      )}

      {/* Organizations Tab Panel */}
      {tabValue === 1 && (
        <Box sx={glassmorphismStyle}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: "text.primary" }}
            >
              {t("admin.sections.orgs.title", "Organizações no Sistema")}
            </Typography>
            <IconButton
              color="primary"
              onClick={() => fetchOrganizations(orgQuery, orgPage)}
              disabled={organizationsLoading}
              sx={{ border: "1px solid", borderColor: "divider" }}
            >
              {organizationsLoading ? (
                <CircularProgress size={20} />
              ) : (
                <RefreshIcon />
              )}
            </IconButton>
          </Box>

          {/* Search Form */}
          <Box component="form" onSubmit={handleOrgSearch} sx={{ mb: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder={t(
                "admin.sections.orgs.search_placeholder",
                "Buscar organização pelo nome...",
              )}
              value={orgQuery}
              onChange={(e) => setOrgQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: "10px" },
                },
              }}
            />
          </Box>

          {/* Organizations Table */}
          <TableContainer
            component={Paper}
            elevation={0}
            variant="outlined"
            sx={{
              borderRadius: "12px",
              border: "1px solid",
              borderColor: "divider",
              mb: 3,
              overflowX: "auto",
            }}
          >
            <Table sx={{ minWidth: 600 }}>
              <TableHead
                sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}
              >
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>
                    {t("admin.table.org_name", "Organização")}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, minWidth: 250 }}>
                    {t("admin.table.org_id", "ID da Organização")}
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 600, minWidth: 100 }}
                    align="center"
                  >
                    {t("admin.table.blocked", "Bloqueada")}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {organizationsLoading && organizations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : organizations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">
                        {t(
                          "admin.table.no_orgs_found",
                          "Nenhuma organização encontrada.",
                        )}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  organizations.map((org) => (
                    <TableRow
                      key={org.id}
                      hover
                      sx={{ transition: "background-color 0.2s" }}
                    >
                      <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600 }}
                          noWrap
                        >
                          {org.name}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 250 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: "monospace",
                            color: "text.secondary",
                          }}
                          noWrap
                        >
                          {org.id}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ minWidth: 100 }}>
                        <Switch
                          checked={!!org.is_blocked}
                          onChange={() => {
                            handleToggleOrgBlock(org);
                          }}
                          disabled={actionInProgress === `org-block-${org.id}`}
                          color="error"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {orgTotalPages > 1 && (
            <Stack spacing={2} sx={{ alignItems: "center" }}>
              <Pagination
                count={orgTotalPages}
                page={orgPage}
                onChange={(_, p) => {
                  setOrgPage(p);
                  fetchOrganizations(orgQuery, p);
                }}
                color="primary"
                shape="rounded"
              />
            </Stack>
          )}
        </Box>
      )}

      {/* Snackbar notification */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setToastOpen(false)}
          severity={toastSeverity}
          sx={{ width: "100%", borderRadius: "8px" }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}
