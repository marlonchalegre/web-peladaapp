import type { FormEvent } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { PhotoCamera, Delete as DeleteIcon } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";
import { PhoneInput } from "../../../shared/components/PhoneInput";

type Props = {
  isEditing: boolean;
  userId: string;
  avatarFilename: string | null;
  name: string;
  setName: (v: string) => void;
  username: string;
  setUsername: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  position: string;
  setPosition: (v: string) => void;
  receiveNonMensalistaUpdates: boolean;
  setReceiveNonMensalistaUpdates: (v: boolean) => void;
  darkMode: boolean;
  onToggleTheme: () => void;
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  loading: boolean;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarDelete: () => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  onConfirmDeleteAccount: () => void;
};

export default function UserProfileEditForm({
  isEditing,
  userId,
  avatarFilename,
  name,
  setName,
  username,
  setUsername,
  email,
  setEmail,
  phone,
  setPhone,
  position,
  setPosition,
  receiveNonMensalistaUpdates,
  setReceiveNonMensalistaUpdates,
  darkMode,
  onToggleTheme,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  loading,
  onAvatarUpload,
  onAvatarDelete,
  onSubmit,
  onCancel,
  deleteDialogOpen,
  setDeleteDialogOpen,
  onConfirmDeleteAccount,
}: Props) {
  const { t } = useTranslation();

  return (
    <>
      <Box sx={{ display: isEditing ? "block" : "none" }}>
        <Paper
          sx={{
            p: { xs: 2.5, sm: 4 },
            borderRadius: "18px",
            border: "1.5px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ px: { xs: 0.5, sm: 0 } }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 800 }}>
              {t("user.profile.title")}
            </Typography>
            <Typography
              variant="body2"
              gutterBottom
              sx={{
                color: "text.secondary",
              }}
            >
              {t("user.profile.subtitle")}
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box
            sx={{
              mb: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{
                color: "text.secondary",
                alignSelf: "flex-start",
                mb: 2,
              }}
            >
              {t("user.profile.section.change_avatar")}
            </Typography>

            <Box sx={{ position: "relative", display: "inline-block" }}>
              <SecureAvatar
                userId={userId}
                filename={avatarFilename}
                sx={{
                  width: 100,
                  height: 100,
                  fontSize: "2rem",
                  bgcolor: "primary.main",
                  border: "2px solid",
                  borderColor: "divider",
                }}
                fallbackText={name.charAt(0).toUpperCase()}
              />

              <Box
                sx={{
                  position: "absolute",
                  bottom: -10,
                  right: -10,
                  display: "flex",
                  gap: 0.5,
                }}
              >
                <IconButton
                  color="primary"
                  aria-label="upload picture"
                  component="label"
                  disabled={loading}
                  sx={{
                    bgcolor: "background.paper",
                    boxShadow: 2,
                    "&:hover": { bgcolor: "grey.100" },
                  }}
                >
                  <input
                    hidden
                    accept="image/*"
                    type="file"
                    onChange={onAvatarUpload}
                  />
                  <PhotoCamera />
                </IconButton>

                {avatarFilename && (
                  <IconButton
                    color="error"
                    aria-label="delete picture"
                    disabled={loading}
                    onClick={onAvatarDelete}
                    sx={{
                      bgcolor: "background.paper",
                      boxShadow: 2,
                      "&:hover": { bgcolor: "grey.100" },
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <form onSubmit={onSubmit}>
            <Stack spacing={3}>
              <TextField
                id="name"
                label={t("common.fields.name")}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                disabled={loading}
                slotProps={{
                  htmlInput: { "data-testid": "profile-name" },
                }}
              />

              <TextField
                id="username"
                label={t("common.fields.username")}
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                fullWidth
                disabled={loading}
                slotProps={{
                  htmlInput: { "data-testid": "profile-username" },
                }}
              />

              <TextField
                id="email"
                label={t("common.fields.email")}
                type="text"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                disabled={loading}
                slotProps={{
                  htmlInput: { "data-testid": "profile-email" },
                }}
              />

              <PhoneInput
                id="phone"
                label={t("common.fields.phone")}
                value={phone}
                onChange={(val) => setPhone(val)}
                fullWidth
                disabled={loading}
                data-testid="profile-phone"
              />

              <FormControl fullWidth disabled={loading}>
                <InputLabel id="position-select-label">
                  {t("common.fields.position")}
                </InputLabel>
                <Select
                  labelId="position-select-label"
                  id="position-select"
                  value={position}
                  label={t("common.fields.position")}
                  onChange={(e) => setPosition(e.target.value)}
                  autoComplete="organization-title"
                  data-testid="profile-position-select"
                >
                  <MenuItem value="">
                    <em>{t("common.select_placeholder")}</em>
                  </MenuItem>
                  <MenuItem
                    value="Striker"
                    data-testid="position-option-Striker"
                  >
                    {t("common.positions.striker")}
                  </MenuItem>
                  <MenuItem
                    value="Midfielder"
                    data-testid="position-option-Midfielder"
                  >
                    {t("common.positions.midfielder")}
                  </MenuItem>
                  <MenuItem
                    value="Defender"
                    data-testid="position-option-Defender"
                  >
                    {t("common.positions.defender")}
                  </MenuItem>
                  <MenuItem
                    value="Goalkeeper"
                    data-testid="position-option-Goalkeeper"
                  >
                    {t("common.positions.goalkeeper")}
                  </MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ mt: 1, mb: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={receiveNonMensalistaUpdates}
                      onChange={(e) =>
                        setReceiveNonMensalistaUpdates(e.target.checked)
                      }
                      name="receiveNonMensalistaUpdates"
                      disabled={loading}
                      slotProps={{
                        input: {
                          "data-testid":
                            "receive-non-mensalista-updates-switch",
                        } as React.InputHTMLAttributes<HTMLInputElement>,
                      }}
                    />
                  }
                  label={t("user.profile.field.receive_non_mensalista_updates")}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", ml: 4, mt: -0.5 }}
                >
                  {t(
                    "user.profile.field.receive_non_mensalista_updates_description",
                  )}
                </Typography>
              </Box>

              <Box sx={{ mt: 1, mb: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={darkMode}
                      onChange={onToggleTheme}
                      name="darkMode"
                      slotProps={{
                        input: {
                          "data-testid": "dark-mode-switch",
                        } as React.InputHTMLAttributes<HTMLInputElement>,
                      }}
                    />
                  }
                  label={t("user.profile.field.dark_mode", "Modo Escuro")}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", ml: 4, mt: -0.5 }}
                >
                  {t(
                    "user.profile.field.dark_mode_description",
                    "Alternar entre o tema claro e o tema escuro",
                  )}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                  }}
                >
                  {t("user.profile.section.change_password")}
                </Typography>
              </Divider>

              <TextField
                id="new-password"
                label={t("user.profile.field.new_password")}
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                disabled={loading}
                helperText={t("user.profile.hint.password")}
                slotProps={{
                  htmlInput: { "data-testid": "profile-new-password" },
                }}
              />

              <TextField
                id="confirm-password"
                label={t("user.profile.field.confirm_password")}
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                fullWidth
                disabled={loading || !password}
                slotProps={{
                  htmlInput: { "data-testid": "profile-confirm-password" },
                }}
              />

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  variant="outlined"
                  onClick={onCancel}
                  disabled={loading}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  data-testid="profile-save-button"
                >
                  {loading
                    ? t("user.profile.button.saving")
                    : t("user.profile.button.save")}
                </Button>
              </Box>
            </Stack>
          </form>

          <Divider sx={{ my: 4 }} />

          <Typography
            variant="caption"
            color="error"
            sx={{ display: "block", mb: 2 }}
          >
            {t("user.profile.section.danger_zone")}
          </Typography>

          <Button
            variant="outlined"
            color="error"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={loading}
            fullWidth
            data-testid="profile-delete-account-button"
          >
            {t("user.profile.button.delete_account")}
          </Button>
        </Paper>
      </Box>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-account-dialog-title"
        aria-describedby="delete-account-dialog-description"
      >
        <DialogTitle id="delete-account-dialog-title">
          {t("user.profile.dialog.delete_title")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-account-dialog-description">
            {t("user.profile.dialog.delete_confirm")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} autoFocus>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={onConfirmDeleteAccount}
            color="error"
            data-testid="confirm-delete-account-button"
          >
            {t("user.profile.dialog.delete_button")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
