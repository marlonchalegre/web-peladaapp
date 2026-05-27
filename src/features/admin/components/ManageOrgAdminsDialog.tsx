import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  Typography,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Button,
  DialogActions,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { type Organization } from "../../../shared/api/endpoints";
import { useOrgAdmins } from "../hooks/useOrgAdmins";

export interface ManageOrgAdminsDialogProps {
  open: boolean;
  onClose: () => void;
  organization: Organization | null;
  showToast: (message: string, severity?: "success" | "error" | "info") => void;
}

export function ManageOrgAdminsDialog({
  open,
  onClose,
  organization,
  showToast,
}: ManageOrgAdminsDialogProps) {
  const { t } = useTranslation();

  const {
    admins,
    loading,
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    actionLoading,
    handleSearchUsers,
    addAdmin,
    removeAdmin,
  } = useOrgAdmins({
    organizationId: organization?.id,
    showToast,
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {t("admin.dialogs.manage_admins.title", "Gerenciar Administradores")}
      </DialogTitle>
      <DialogContent dividers>
        <DialogContentText sx={{ mb: 2 }}>
          {t(
            "admin.dialogs.manage_admins.description",
            "Gerencie os administradores da organização {{name}}.",
            { name: organization?.name },
          )}
        </DialogContentText>

        {/* Current Admins List */}
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          {t("admin.dialogs.manage_admins.current_admins", "Administradores Atuais")}
        </Typography>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress size={30} />
          </Box>
        ) : admins.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t("admin.dialogs.manage_admins.no_admins", "Nenhum administrador encontrado.")}
          </Typography>
        ) : (
          <List
            dense
            sx={{
              mb: 3,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: "8px",
              bgcolor: "background.paper",
            }}
          >
            {admins.map((admin) => (
              <ListItem key={admin.id}>
                <ListItemText
                  primary={admin.user_name || ""}
                  secondary={admin.user_username ? `@${admin.user_username}` : ""}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    color="error"
                    onClick={() => removeAdmin(admin.user_id)}
                    disabled={actionLoading || admins.length <= 1}
                    title={t("admin.actions.remove_admin", "Remover Administrador")}
                    data-testid={`remove-admin-btn-${admin.user_id}`}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}

        {/* Add New Admin Section */}
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          {t("admin.dialogs.manage_admins.add_admin", "Adicionar Novo Administrador")}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            placeholder={t(
              "admin.dialogs.manage_admins.search_placeholder",
              "Buscar usuário por nome/email/username...",
            )}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              htmlInput: { "data-testid": "admin-search-input" },
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearchUsers}
            disabled={searchLoading || !searchQuery.trim()}
            data-testid="search-admin-users-btn"
          >
            {searchLoading ? <CircularProgress size={20} /> : t("common.search", "Buscar")}
          </Button>
        </Box>

        {/* Search Results */}
        {searchLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress size={20} />
          </Box>
        ) : searchResults.length > 0 ? (
          <List
            dense
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: "8px",
              bgcolor: "background.paper",
              maxHeight: 200,
              overflowY: "auto",
            }}
          >
            {searchResults.map((user) => {
              const isAlreadyAdmin = admins.some(
                (a) => (a.user_id || a.id) === user.id,
              );
              return (
                <ListItem key={user.id}>
                  <ListItemText primary={user.name} secondary={`@${user.username}`} />
                  <ListItemSecondaryAction>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => addAdmin(user.id)}
                      disabled={actionLoading || isAlreadyAdmin}
                      data-testid={`add-admin-btn-${user.id}`}
                    >
                      {isAlreadyAdmin
                        ? t("admin.dialogs.manage_admins.already_admin", "Já é Admin")
                        : t("common.add", "Adicionar")}
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        ) : searchQuery.trim() ? (
          <Typography variant="body2" color="text.secondary" align="center">
            {t("common.no_results", "Nenhum resultado encontrado.")}
          </Typography>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("common.close", "Fechar")}</Button>
      </DialogActions>
    </Dialog>
  );
}
