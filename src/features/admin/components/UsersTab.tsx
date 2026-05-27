import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  TextField,
  InputAdornment,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Switch,
  Pagination,
  Stack,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  VpnKey as KeyIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { type User } from "../../../shared/api/endpoints";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";

export interface UsersTabProps {
  users: User[];
  usersLoading: boolean;
  userQuery: string;
  setUserQuery: (val: string) => void;
  userPage: number;
  userTotalPages: number;
  onPageChange: (page: number) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onRefresh: () => void;
  onToggleBlock: (user: User) => void;
  onToggleOrgCreation: (user: User) => void;
  onToggleSuperAdmin: (user: User) => void;
  onOpenResetPassword: (user: User) => void;
  onOpenDeleteUser: (user: User) => void;
  actionInProgress: string | null;
  currentUser: { id: string } | null;
}

export function UsersTab({
  users,
  usersLoading,
  userQuery,
  setUserQuery,
  userPage,
  userTotalPages,
  onPageChange,
  onSearchSubmit,
  onRefresh,
  onToggleBlock,
  onToggleOrgCreation,
  onToggleSuperAdmin,
  onOpenResetPassword,
  onOpenDeleteUser,
  actionInProgress,
  currentUser,
}: UsersTabProps) {
  const { t } = useTranslation();
  const theme = useTheme();

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
        <Typography variant="h5" sx={{ fontWeight: 700, color: "text.primary" }}>
          {t("admin.sections.users.title", "Usuários Cadastrados")}
        </Typography>
        <IconButton
          color="primary"
          onClick={onRefresh}
          disabled={usersLoading}
          sx={{ border: "1px solid", borderColor: "divider" }}
        >
          {usersLoading ? <CircularProgress size={20} /> : <RefreshIcon />}
        </IconButton>
      </Box>

      {/* Search Form */}
      <Box component="form" onSubmit={onSearchSubmit} sx={{ mb: 3 }}>
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
          <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, minWidth: 240 }}>
                {t("admin.table.user", "Usuário")}
              </TableCell>
              <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>
                {t("admin.table.position", "Posição")}
              </TableCell>
              <TableCell sx={{ fontWeight: 600, minWidth: 100 }} align="center">
                {t("admin.table.blocked", "Bloqueado")}
              </TableCell>
              <TableCell sx={{ fontWeight: 600, minWidth: 120 }} align="center">
                {t("admin.table.allow_org_creation", "Criar Orgs")}
              </TableCell>
              <TableCell sx={{ fontWeight: 600, minWidth: 120 }} align="center">
                {t("admin.table.super_admin", "Super Admin")}
              </TableCell>
              <TableCell sx={{ fontWeight: 600, minWidth: 120 }} align="center">
                {t("admin.table.actions", "Ações")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usersLoading && users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">
                    {t("admin.table.no_users_found", "Nenhum usuário encontrado.")}
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
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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
                          : t("common.positions.not_defined", "Não Definido")
                      }
                      size="small"
                      variant="outlined"
                      sx={{ textTransform: "capitalize" }}
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ minWidth: 100 }}>
                    <Switch
                      checked={!!user.is_blocked}
                      onChange={() => onToggleBlock(user)}
                      disabled={actionInProgress === `block-${user.id}`}
                      color="error"
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ minWidth: 120 }}>
                    <Switch
                      checked={user.allow_org_creation !== false}
                      onChange={() => onToggleOrgCreation(user)}
                      disabled={actionInProgress === `org-creation-${user.id}`}
                      color="success"
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ minWidth: 120 }}>
                    <Switch
                      checked={!!user.is_super_admin}
                      onChange={() => onToggleSuperAdmin(user)}
                      disabled={
                        actionInProgress === `super-admin-${user.id}` ||
                        user.id === currentUser?.id
                      }
                      color="primary"
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ minWidth: 120 }}>
                    <IconButton
                      color="primary"
                      onClick={() => onOpenResetPassword(user)}
                      title={t("admin.actions.reset_password", "Redefinir Senha")}
                      data-testid={`reset-password-btn-${user.id}`}
                    >
                      <KeyIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => onOpenDeleteUser(user)}
                      disabled={user.id === currentUser?.id}
                      title={t("admin.actions.remove_user", "Remover Usuário")}
                      data-testid={`delete-user-btn-${user.id}`}
                    >
                      <DeleteIcon />
                    </IconButton>
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
            onChange={(_, p) => onPageChange(p)}
            color="primary"
            shape="rounded"
          />
        </Stack>
      )}
    </Box>
  );
}
