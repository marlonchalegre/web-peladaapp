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
import { useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  open: boolean;
  onClose: () => void;
  onInvite: (email: string) => Promise<void>;
  invitedUser: { email: string; isNew: boolean } | null;
  onClearInvited: () => void;
  publicInviteLink: string | null;
  onFetchPublicLink: () => Promise<void>;
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
  loading,
}: Props) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");

  const handleInvite = async () => {
    if (!email) return;
    await onInvite(email);
    setEmail("");
  };

  const invitationLink = invitedUser
    ? `${window.location.origin}/first-access?email=${encodeURIComponent(invitedUser.email)}`
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
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <TextField
                  fullWidth
                  size="small"
                  label={t("auth.email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
                <Button
                  onClick={handleInvite}
                  variant="contained"
                  disabled={!email || loading}
                  sx={{ whiteSpace: "nowrap" }}
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
                {t("organizations.dialog.invite_player.public_link_description")}
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
                  >
                    {publicInviteLink}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => copyToClipboard(publicInviteLink)}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <Button
                  variant="outlined"
                  onClick={onFetchPublicLink}
                  disabled={loading}
                  sx={{ mt: 1 }}
                >
                  {t("organizations.dialog.invite_player.generate_link")}
                </Button>
              )}
            </Box>
          </Stack>
        ) : (
          <Box sx={{ mt: 1 }}>
            {invitedUser.isNew ? (
              <>
                <Alert severity="success" sx={{ mb: 2 }}>
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
                  >
                    {invitationLink}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => copyToClipboard(invitationLink)}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
              </>
            ) : (
              <Alert severity="success">
                {t("organizations.dialog.invite_player.existing_user_success", {
                  email: invitedUser.email,
                })}
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button
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
