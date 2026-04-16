import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Stack,
  Typography,
  Alert,
} from "@mui/material";
import { resetPassword } from "../../../shared/api/client";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../app/providers/AuthContext";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const redirect = searchParams.get("redirect") || "/";
      navigate(redirect, { replace: true });
    }
  }, [isAuthenticated, navigate, searchParams]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError(t("auth.reset_password.error.invalid_token"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("user.profile.error.password_mismatch"));
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("auth.reset_password.error.failed");
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "background.default",
        }}
      >
        <Paper sx={{ p: 4, maxWidth: 420, width: "100%", mx: 2 }} elevation={3}>
          <Alert severity="error">
            {t("auth.reset_password.error.invalid_token")}
          </Alert>
          <Button href="/login" fullWidth sx={{ mt: 2 }}>
            {t("auth.forgot_password.link.back_to_login")}
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "background.default",
      }}
    >
      <Paper
        sx={{ p: { xs: 3, sm: 4 }, maxWidth: 420, width: "100%", mx: 2 }}
        elevation={3}
      >
        <form onSubmit={onSubmit}>
          <Stack spacing={2}>
            <Typography
              variant="h5"
              component="h1"
              textAlign="center"
              gutterBottom
            >
              {t("auth.reset_password.title")}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              {t("auth.reset_password.description")}
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            {success && (
              <Alert severity="success">
                {t("auth.reset_password.success")}
              </Alert>
            )}

            <TextField
              id="password"
              label={t("common.fields.password")}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              disabled={success}
              inputProps={{ "data-testid": "reset-password-input" }}
            />
            <TextField
              id="confirm-password"
              label={t("user.profile.field.confirm_password")}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              fullWidth
              disabled={success}
              inputProps={{ "data-testid": "reset-password-confirm" }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={loading || success}
              size="large"
              data-testid="reset-password-submit"
              data-analytics-id="reset-password-submit-btn"
            >
              {loading
                ? t("auth.reset_password.button.loading")
                : t("auth.reset_password.button.submit")}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
