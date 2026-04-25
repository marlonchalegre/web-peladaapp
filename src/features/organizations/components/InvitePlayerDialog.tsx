import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  IconButton,
  Stack,
  Divider,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  open: boolean;
  onClose: () => void;
  onInvite: (email?: string, name?: string) => Promise<void>;
  invitedUser: {
    email?: string;
    name?: string;
    token?: string;
    isNew: boolean;
  } | null;
  onClearInvited: () => void;
  publicInviteLink: string | null;
  onFetchPublicLink: () => Promise<void>;
  onResetPublicLink: () => void | Promise<void>;
  loading: boolean;
};

export default function InvitePlayerDialog({
  open,
  onClose,
  onInvite,
  invitedUser,
  onClearInvited,
  publicInviteLink,
  onFetchPublicLink,
  onResetPublicLink,
  loading,
}: Props) {
  const { t } = useTranslation();
  const [handle, setHandle] = useState("");

  const handleInvite = async () => {
    if (!handle) return;
    try {
      await onInvite(handle);
      setHandle("");
    } catch (err) {
      console.error("[InviteDialog] Invite failed:", err);
    }
  };

  const invitationLink = invitedUser?.token
    ? `${window.location.origin}/first-access?token=${invitedUser.token}&email=${encodeURIComponent(invitedUser.email || "")}`
    : "";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        onClose();
        onClearInvited();
      }}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>{t("organizations.dialog.invite_player.title")}</DialogTitle>
      <DialogContent dividers>
        {!invitedUser ? (
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {t("organizations.dialog.invite_player.personal_invite")}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t("organizations.dialog.invite_player.description")}
              </Typography>
              <Stack spacing={1.5}>
                <TextField
                  fullWidth
                  size="small"
                  label={t("common.fields.username")}
                  placeholder={t("common.fields.email")}
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  disabled={loading}
                  autoFocus
                  inputProps={{ "data-testid": "invite-email-input" }}
                />
                <Button
                  onClick={handleInvite}
                  variant="contained"
                  disabled={!handle || loading}
                  fullWidth
                  data-testid="send-invite-button"
                >
                  {t("organizations.dialog.invite_player.send_invite")}
                </Button>
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {t("organizations.dialog.invite_player.public_link")}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t(
                  "organizations.dialog.invite_player.public_link_description",
                )}
              </Typography>
              {publicInviteLink ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    p: 1,
                    bgcolor: "action.hover",
                    borderRadius: 1,
                    mt: 1,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ flexGrow: 1, wordBreak: "break-all", mr: 1 }}
                    data-testid="public-invite-link-text"
                  >
                    {publicInviteLink}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => copyToClipboard(publicInviteLink)}
                    data-testid="copy-public-link-button"
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={onResetPublicLink}
                    disabled={loading}
                    data-testid="reset-public-link-button"
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <Button
                  variant="outlined"
                  onClick={onFetchPublicLink}
                  disabled={loading}
                  sx={{ mt: 1 }}
                  data-testid="generate-public-link-button"
                >
                  {t("organizations.dialog.invite_player.generate_link")}
                </Button>
              )}
            </Box>
          </Stack>
        ) : (
          <Box sx={{ mt: 1 }}>
            {invitedUser.isNew && invitedUser.email ? (
              <>
                <Alert
                  severity="success"
                  sx={{ mb: 2 }}
                  data-testid="invite-success-alert"
                >
                  {t("organizations.dialog.invite_player.new_user_success")}
                </Alert>
                <Typography variant="body2" gutterBottom>
                  {t("organizations.dialog.invite_player.share_link")}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    p: 1.5,
                    bgcolor: "action.hover",
                    borderRadius: 1,
                    mt: 1,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ flexGrow: 1, wordBreak: "break-all", mr: 1 }}
                    data-testid="invitation-link-text"
                  >
                    {invitationLink}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => copyToClipboard(invitationLink)}
                    data-testid="copy-invitation-link-button"
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
              </>
            ) : invitedUser.isNew && !invitedUser.email ? (
              <Alert severity="success" data-testid="invite-name-success-alert">
                {t("common.welcome")} - {invitedUser.name} added!
              </Alert>
            ) : (
              <Alert
                severity="success"
                data-testid="invite-existing-success-alert"
              >
                {t("organizations.dialog.invite_player.existing_user_success", {
                  email: invitedUser.email || invitedUser.name,
                })}
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          data-testid="invite-dialog-close-button"
          onClick={() => {
            onClose();
            onClearInvited();
          }}
        >
          {invitedUser ? t("common.close") : t("common.cancel")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
