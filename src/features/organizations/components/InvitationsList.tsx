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
  Button,
  Tooltip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import LinkIcon from "@mui/icons-material/Link";
import EmailIcon from "@mui/icons-material/Email";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { useTranslation } from "react-i18next";
import type { OrganizationInvitation } from "../../../shared/api/endpoints";

interface InvitationsListProps {
  invitations: OrganizationInvitation[];
  onRevoke: (invitationId: number) => void;
  onInviteClick: () => void;
  actionLoading: boolean;
}

export default function InvitationsList({
  invitations,
  onRevoke,
  onInviteClick,
  actionLoading,
}: InvitationsListProps) {
  const { t } = useTranslation();

  const copyToClipboard = (token: string) => {
    const link = `${window.location.origin}/join/${token}`;
    navigator.clipboard.writeText(link);
  };

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5">
          {t(
            "organizations.management.sections.invitations",
            "Active Invitations",
          )}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<PersonAddIcon />}
          onClick={onInviteClick}
          disabled={actionLoading}
        >
          {t("organizations.dialog.invite_player.title")}
        </Button>
      </Box>
      <Divider sx={{ mb: 2 }} />
      <List>
        {invitations.length === 0 ? (
          <Typography color="text.secondary">
            {t(
              "organizations.invitation.empty",
              "No active invitations. Click the button above to invite players.",
            )}
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
                  t(
                    "organizations.invitation.public_link_label",
                    "Public Invite Link",
                  )
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
                      label={t(
                        `organizations.invitation.status.${inv.status}`,
                        inv.status,
                      )}
                      size="small"
                      color={inv.status === "pending" ? "warning" : "default"}
                      variant="outlined"
                    />
                  </>
                }
              />
              <ListItemSecondaryAction>
                <Tooltip title={t("common.copy_link", "Copy Link")}>
                  <IconButton
                    edge="end"
                    onClick={() => copyToClipboard(inv.token)}
                    sx={{ mr: 1 }}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t("common.revoke", "Revoke")}>
                  <IconButton
                    edge="end"
                    color="error"
                    onClick={() => onRevoke(inv.id)}
                    disabled={actionLoading}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
          ))
        )}
      </List>
    </Paper>
  );
}
