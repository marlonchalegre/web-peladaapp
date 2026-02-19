import {
  Paper,
  Box,
  Typography,
  Divider,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTranslation } from "react-i18next";
import {
  type User,
  type OrganizationAdmin,
} from "../../../shared/api/endpoints";

interface AdminsSectionProps {
  admins: OrganizationAdmin[];
  playersNotAdmins: User[];
  selectedAdminUserId: number | "";
  onAdminUserChange: (value: number | "") => void;
  onAddAdmin: () => void;
  onRemoveAdmin: (userId: number) => void;
  actionLoading: boolean;
}

export default function AdminsSection({
  admins,
  playersNotAdmins,
  selectedAdminUserId,
  onAdminUserChange,
  onAddAdmin,
  onRemoveAdmin,
  actionLoading,
}: AdminsSectionProps) {
  const { t } = useTranslation();

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {t("organizations.management.sections.admins")}
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          {t("organizations.dialog.manage_admins.add_section_title")}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            select
            fullWidth
            size="small"
            value={selectedAdminUserId}
            onChange={(e) =>
              onAdminUserChange(
                e.target.value === "" ? "" : Number(e.target.value),
              )
            }
            disabled={actionLoading || playersNotAdmins.length === 0}
            data-testid="admin-select"
            label={
              playersNotAdmins.length === 0
                ? t("organizations.dialog.manage_admins.all_users_are_admins")
                : t("organizations.dialog.manage_admins.select_user_label")
            }
          >
            <MenuItem value="" data-testid="admin-option-empty">
              {t("common.select_placeholder")}
            </MenuItem>
            {playersNotAdmins.map((user) => (
              <MenuItem
                key={user.id}
                value={user.id}
                data-testid={`admin-option-${user.id}`}
              >
                {user.name} ({user.email})
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            onClick={onAddAdmin}
            disabled={actionLoading || selectedAdminUserId === ""}
            data-testid="add-admin-button"
            startIcon={
              actionLoading ? <CircularProgress size={20} /> : <AddIcon />
            }
          >
            {t("common.add")}
          </Button>
        </Box>
      </Box>

      <Typography variant="subtitle2" gutterBottom>
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
                onClick={() => onRemoveAdmin(admin.user_id)}
                disabled={actionLoading || admins.length === 1}
                title={
                  admins.length === 1
                    ? t(
                        "organizations.dialog.manage_admins.cannot_remove_last_admin_tooltip",
                      )
                    : t(
                        "organizations.dialog.manage_admins.remove_admin_tooltip",
                      )
                }
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
