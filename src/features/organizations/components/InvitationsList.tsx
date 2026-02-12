import {
  Paper,
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import LinkIcon from "@mui/icons-material/Link";
import EmailIcon from "@mui/icons-material/Email";
import { useTranslation } from "react-i18next";
import type { OrganizationInvitation } from "../../../shared/api/endpoints";

interface InvitationsListProps {
  invitations: OrganizationInvitation[];
  onRevoke: (invitationId: number) => void;
  actionLoading: boolean;
}

export default function InvitationsList({
  invitations,
  onRevoke,
  actionLoading,
}: InvitationsListProps) {
  const { t } = useTranslation();

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5">
          {t("organizations.management.sections.invitations", "Active Invitations")}
        </Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />
      <List>
        {invitations.length === 0 ? (
          <Typography color="text.secondary">
            {t("organizations.invitation.empty", "No active invitations.")}
          </Typography>
        ) : (
          invitations.map((inv) => (
            <ListItem key={inv.id}>
              <Box sx={{ mr: 2, display: "flex", alignItems: "center" }}>
                {inv.email ? (
                  <EmailIcon color="action" />
                ) : (
                  <LinkIcon color="primary" />
                )}
              </Box>
              <ListItemText
                primary={
                  inv.email ||
                  t("organizations.invitation.public_link_label", "Public Invite Link")
                }
                secondaryTypographyProps={{ component: "div" }}
                secondary={
                  <>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.secondary"
                    >
                      {new Date(inv.created_at).toLocaleDateString()}
                    </Typography>
                    {" • "}
                    <Chip
                      label={t(`organizations.invitation.status.${inv.status}`, inv.status)}
                      size="small"
                      color={inv.status === "pending" ? "warning" : "default"}
                      variant="outlined"
                    />
                  </>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  color="error"
                  onClick={() => onRevoke(inv.id)}
                  disabled={actionLoading}
                  title={t("common.revoke", "Revoke")}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))
        )}
      </List>
    </Paper>
  );
}
