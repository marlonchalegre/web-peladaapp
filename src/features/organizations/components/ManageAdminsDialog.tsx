import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  MenuItem,
  Box,
  Typography,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import {
  type OrganizationAdmin,
  type User,
} from "../../../shared/api/endpoints";
import { useTranslation } from "react-i18next";

type Props = {
  open: boolean;
  organizationId: number;
  organizationName: string;
  admins: OrganizationAdmin[];
  availableUsers: User[];
  onClose: () => void;
  onAddAdmin: (userId: number) => Promise<void>;
  onRemoveAdmin: (userId: number) => Promise<void>;
};

export default function ManageAdminsDialog({
  open,
  organizationName,
  admins,
  availableUsers,
  onClose,
  onAddAdmin,
  onRemoveAdmin,
}: Props) {
  const { t } = useTranslation();
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddAdmin = async () => {
    if (selectedUserId === "") return;

    setLoading(true);
    setError(null);
    try {
      await onAddAdmin(selectedUserId as number);
      setSelectedUserId("");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : t("organizations.error.add_admin_failed");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (userId: number) => {
    if (admins.length === 1) {
      setError(t("organizations.error.remove_last_admin"));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onRemoveAdmin(userId);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : t("organizations.error.remove_admin_failed");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const adminUserIds = new Set(admins.map((a) => a.user_id));
  const usersNotAdmin = availableUsers.filter((u) => !adminUserIds.has(u.id));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {t("organizations.dialog.manage_admins.title", {
          name: organizationName,
        })}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            {t("organizations.dialog.manage_admins.add_section_title")}
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              select
              fullWidth
              size="small"
              value={selectedUserId}
              onChange={(e) =>
                setSelectedUserId(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
              disabled={loading || usersNotAdmin.length === 0}
              label={
                usersNotAdmin.length === 0
                  ? t("organizations.dialog.manage_admins.all_users_are_admins")
                  : t("organizations.dialog.manage_admins.select_user_label")
              }
            >
              <MenuItem value="">{t("common.select_placeholder")}</MenuItem>
              {usersNotAdmin.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              onClick={handleAddAdmin}
              disabled={loading || selectedUserId === ""}
              startIcon={<AddIcon />}
            >
              {t("common.add")}
            </Button>
          </Box>
        </Box>

        <Typography variant="subtitle1" gutterBottom>
          {t("organizations.dialog.manage_admins.current_admins_title")}
        </Typography>
        <List>
          {admins.map((admin) => (
            <ListItem key={admin.id}>
              <ListItemText
                primary={
                  admin.user_name ||
                  t("organizations.dialog.manage_admins.user_fallback", {
                    id: admin.user_id,
                  })
                }
                secondary={admin.user_email}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => handleRemoveAdmin(admin.user_id)}
                  disabled={loading || admins.length === 1}
                  title={
                    admins.length === 1
                      ? t(
                          "organizations.dialog.manage_admins.cannot_remove_last_admin_tooltip",
                        )
                      : t(
                          "organizations.dialog.manage_admins.remove_admin_tooltip",
                        )
                  }
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {t("common.close")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
