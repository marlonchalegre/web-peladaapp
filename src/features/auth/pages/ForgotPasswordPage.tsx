import { useState } from "react";
import type { FormEvent } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Stack,
  Typography,
  Alert,
  Link as MLink,
} from "@mui/material";
import { forgotPassword } from "../../../shared/api/client";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("auth.forgot_password.error.failed");
      setError(message);
    } finally {
      setLoading(false);
    }
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
        {success ? (
          <Stack spacing={2}>
            <Typography variant="h5" component="h1" textAlign="center">
              {t("auth.forgot_password.title")}
            </Typography>
            <Alert severity="success">
              {t("auth.forgot_password.success")}
            </Alert>
            <Button
              variant="text"
              href={`/login${searchParams.get("redirect") ? `?redirect=${encodeURIComponent(searchParams.get("redirect")!)}` : ""}`}
              fullWidth
            >
              {t("auth.forgot_password.link.back_to_login")}
            </Button>
          </Stack>
        ) : (
          <form onSubmit={onSubmit}>
            <Stack spacing={2}>
              <Typography
                variant="h5"
                component="h1"
                textAlign="center"
                gutterBottom
              >
                {t("auth.forgot_password.title")}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                {t("auth.forgot_password.description")}
              </Typography>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                id="email"
                label={
                  t("common.fields.username") + " / " + t("common.fields.email")
                }
                type="text"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                inputProps={{ "data-testid": "forgot-password-email" }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                size="large"
                data-testid="forgot-password-submit"
                data-analytics-id="forgot-password-submit-btn"
              >
                {loading
                  ? t("auth.forgot_password.button.loading")
                  : t("auth.forgot_password.button.submit")}
              </Button>
              <Typography variant="body2" textAlign="center">
                <MLink
                  href={`/login${searchParams.get("redirect") ? `?redirect=${encodeURIComponent(searchParams.get("redirect")!)}` : ""}`}
                  underline="hover"
                  data-analytics-id="back-to-login-link"
                >
                  {t("auth.forgot_password.link.back_to_login")}
                </MLink>
              </Typography>
            </Stack>
          </form>
        )}
      </Paper>
    </Box>
  );
}
