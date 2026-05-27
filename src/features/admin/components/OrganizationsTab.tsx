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
  Switch,
  Pagination,
  Stack,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { type Organization } from "../../../shared/api/endpoints";

export interface OrganizationsTabProps {
  organizations: Organization[];
  organizationsLoading: boolean;
  orgQuery: string;
  setOrgQuery: (val: string) => void;
  orgPage: number;
  orgTotalPages: number;
  onPageChange: (page: number) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onRefresh: () => void;
  onToggleBlock: (org: Organization) => void;
  onOpenManageAdmins: (org: Organization) => void;
  actionInProgress: string | null;
}

export function OrganizationsTab({
  organizations,
  organizationsLoading,
  orgQuery,
  setOrgQuery,
  orgPage,
  orgTotalPages,
  onPageChange,
  onSearchSubmit,
  onRefresh,
  onToggleBlock,
  onOpenManageAdmins,
  actionInProgress,
}: OrganizationsTabProps) {
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
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: "text.primary" }}
        >
          {t("admin.sections.orgs.title", "Organizações no Sistema")}
        </Typography>
        <IconButton
          color="primary"
          onClick={onRefresh}
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
      <Box component="form" onSubmit={onSearchSubmit} sx={{ mb: 3 }}>
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
          <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>
                {t("admin.table.org_name", "Organização")}
              </TableCell>
              <TableCell sx={{ fontWeight: 600, minWidth: 250 }}>
                {t("admin.table.org_id", "ID da Organização")}
              </TableCell>
              <TableCell sx={{ fontWeight: 600, minWidth: 100 }} align="center">
                {t("admin.table.blocked", "Bloqueada")}
              </TableCell>
              <TableCell sx={{ fontWeight: 600, minWidth: 120 }} align="center">
                {t("admin.table.actions", "Ações")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {organizationsLoading && organizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : organizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
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
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
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
                      onChange={() => onToggleBlock(org)}
                      disabled={actionInProgress === `org-block-${org.id}`}
                      color="error"
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ minWidth: 120 }}>
                    <IconButton
                      color="primary"
                      onClick={() => onOpenManageAdmins(org)}
                      title={t(
                        "admin.actions.manage_admins",
                        "Gerenciar Admins",
                      )}
                      data-testid={`manage-admins-btn-${org.id}`}
                    >
                      <SettingsIcon />
                    </IconButton>
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
            onChange={(_, p) => onPageChange(p)}
            color="primary"
            shape="rounded"
          />
        </Stack>
      )}
    </Box>
  );
}
