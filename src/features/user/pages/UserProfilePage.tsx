import { useState, useEffect, type FormEvent } from "react";
import {
  Paper,
  TextField,
  Button,
  Stack,
  Typography,
  Alert,
  Box,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  updateUserProfile,
  getUser,
  deleteUser,
} from "../../../shared/api/client";
import { useAuth } from "../../../app/providers/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../shared/components/Loading";

export default function UserProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: authUser, signIn, signOut, token } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!authUser) {
      navigate("/login");
      return;
    }

    // Load current user data
    const loadUserProfile = async () => {
      try {
        const userData = await getUser(authUser.id);
        setName(userData.name);
        setEmail(userData.email);
      } catch (error) {
        console.error("Failed to load user profile:", error);
        setError(t("user.profile.error.load_failed"));
      } finally {
        setLoadingProfile(false);
      }
    };

    loadUserProfile();
  }, [authUser, navigate, t]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // SECURITY: This function always uses authUser.id (the authenticated user's ID)
    // The backend validates that users can only update their own profile

    // Validation
    if (password && password !== confirmPassword) {
      setError(t("user.profile.error.password_mismatch"));
      return;
    }

    if (!name.trim()) {
      setError(t("user.profile.error.name_required"));
      return;
    }

    if (!email.trim()) {
      setError(t("user.profile.error.email_required"));
      return;
    }

    setLoading(true);
    try {
      if (!authUser) throw new Error(t("user.profile.error.not_authenticated"));

      // Prepare update data - only include fields that should be updated
      const updates: { name?: string; email?: string; password?: string } = {};

      if (name !== authUser.name) updates.name = name;
      if (email !== authUser.email) updates.email = email;
      if (password) updates.password = password;

      if (Object.keys(updates).length === 0) {
        setError(t("user.profile.error.no_changes"));
        setLoading(false);
        return;
      }

      const updatedUser = await updateUserProfile(authUser.id, updates);

      // Update auth context with new user data
      if (token) {
        signIn(token, updatedUser);
      }

      setSuccess(t("user.profile.success.updated"));
      setPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("user.profile.error.update_failed");
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteAccount = async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      await deleteUser(authUser.id);
      signOut();
      navigate("/login");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("user.profile.error.delete_failed");
      setError(message);
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loadingProfile) {
    return <Loading message={t("common.loading")} />;
  }

  return (
    <Box maxWidth={600} mx="auto">
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          {t("user.profile.title")}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t("user.profile.subtitle")}
        </Typography>

        <Divider sx={{ my: 3 }} />

        <form onSubmit={onSubmit}>
          <Stack spacing={3}>
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}

            <TextField
              label={t("common.fields.name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              disabled={loading}
            />

            <TextField
              label={t("common.fields.email")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              disabled={loading}
            />

            <Divider sx={{ my: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {t("user.profile.section.change_password")}
              </Typography>
            </Divider>

            <TextField
              label={t("user.profile.field.new_password")}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              disabled={loading}
              helperText={t("user.profile.hint.password")}
            />

            <TextField
              label={t("user.profile.field.confirm_password")}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              disabled={loading || !password}
            />

            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => navigate("/")}
                disabled={loading}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" variant="contained" disabled={loading}>
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
        >
          {t("user.profile.button.delete_account")}
        </Button>
      </Paper>

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
          <Button onClick={handleDeleteAccount} color="error">
            {t("user.profile.dialog.delete_button")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
