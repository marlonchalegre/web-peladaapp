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
import RefreshIcon from "@mui/icons-material/Refresh";
import { useTranslation } from "react-i18next";
import type { OrganizationInvitation } from "../../../shared/api/endpoints";

interface InvitationsListProps {
  invitations: OrganizationInvitation[];
  publicInviteLink: string | null;
  onRevoke: (invitationId: number) => void;
  onResetLink: () => void;
  onInviteClick: () => void;
  actionLoading: boolean;
}

export default function InvitationsList({
  invitations,
  publicInviteLink,
  onRevoke,
  onResetLink,
  onInviteClick,
  actionLoading,
}: InvitationsListProps) {
  const { t } = useTranslation();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
        <Typography variant="h5" fontWeight="bold">
          {t(
            "organizations.management.sections.invitations",
            "Active Invitations",
          )}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={onInviteClick}
          disabled={actionLoading}
          data-testid="invitations-invite-button"
          sx={{
            minWidth: { xs: "40px", sm: "auto" },
            px: { xs: 0, sm: 2 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PersonAddIcon sx={{ mr: { xs: 0, sm: 1 } }} />
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
            {t("organizations.dialog.invite_player.title")}
          </Box>
        </Button>
      </Box>

      {publicInviteLink && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            borderRadius: 1,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
            <LinkIcon sx={{ mr: 1 }} />
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">
                {t("organizations.dialog.invite_player.public_link")}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  wordBreak: "break-all",
                  opacity: 0.9,
                  fontFamily: "monospace",
                }}
                data-testid="public-invite-link-text"
              >
                {publicInviteLink}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              color="inherit"
              size="small"
              startIcon={<ContentCopyIcon />}
              onClick={() => copyToClipboard(publicInviteLink)}
              sx={{
                color: "primary.main",
                bgcolor: "common.white",
                "&:hover": { bgcolor: "grey.100" },
                whiteSpace: "nowrap",
              }}
            >
              {t("common.copy")}
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={onResetLink}
              disabled={actionLoading}
              data-testid="reset-public-link-button"
              sx={{
                color: "common.white",
                borderColor: "rgba(255,255,255,0.5)",
                "&:hover": {
                  borderColor: "common.white",
                  bgcolor: "rgba(255,255,255,0.1)",
                },
                whiteSpace: "nowrap",
              }}
            >
              {t("common.reset", "Redefinir")}
            </Button>
          </Box>
        </Box>
      )}

      <Divider sx={{ mb: 2 }} />
      <List>
        {invitations.filter((inv) => !!inv.email).length === 0 ? (
          <Typography
            color="text.secondary"
            sx={{ textAlign: "center", py: 2 }}
          >
            {t(
              "organizations.invitation.empty",
              "No active invitations. Click the button above to invite players.",
            )}
          </Typography>
        ) : (
          invitations
            .filter((inv) => !!inv.email)
            .map((inv) => (
              <ListItem key={inv.id} divider sx={{ px: 0 }}>
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
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(inv.created_at).toLocaleDateString(
                          t("common.locale_code", "pt-BR"),
                        )}
                      </Typography>
                      <Chip
                        label={t(
                          `organizations.invitation.status.${inv.status}`,
                          inv.status,
                        )}
                        size="small"
                        color={inv.status === "pending" ? "warning" : "default"}
                        variant="outlined"
                      />
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Tooltip title={t("common.copy_link", "Copy Link")}>
                    <IconButton
                      edge="end"
                      onClick={() =>
                        copyToClipboard(
                          `${window.location.origin}/join/${inv.token}`,
                        )
                      }
                      sx={{ mr: 1 }}
                      aria-label={t("common.copy_link")}
                      data-testid={`copy-link-${inv.token}`}
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
                      aria-label={t("common.revoke")}
                      data-testid={`revoke-invitation-${inv.id}`}
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
