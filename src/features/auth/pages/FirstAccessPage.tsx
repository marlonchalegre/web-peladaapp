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
  Link as MLink,
  MenuItem,
} from "@mui/material";
import { useAuth } from "../../../app/providers/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../../shared/api/client";
import { createApi } from "../../../shared/api/endpoints";

const endpoints = createApi(api);

const POSITIONS = ["Striker", "Midfielder", "Defender", "Goalkeeper"];

export default function FirstAccessPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [searchParams] = useSearchParams();

  const [name, setName] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [position, setPosition] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token, user } = await endpoints.firstAccess({
        name,
        email,
        password,
        position: position || undefined,
      });
      signIn(token, user);
      const redirect = searchParams.get("redirect") || "/";
      navigate(redirect);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("auth.first_access.error.failed");
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
      <Paper sx={{ p: 4, maxWidth: 420, width: "100%", mx: 2 }} elevation={3}>
        <form onSubmit={onSubmit}>
          <Stack spacing={2}>
            <Typography
              variant="h5"
              component="h1"
              textAlign="center"
              gutterBottom
            >
              {t("auth.first_access.title")}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              {t("auth.first_access.description")}
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              id="email"
              label={t("common.fields.email")}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              disabled={!!searchParams.get("email")}
              inputProps={{ "data-testid": "first-access-email" }}
            />
            <TextField
              id="name"
              label={t("common.fields.name")}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              autoFocus
              inputProps={{ "data-testid": "first-access-name" }}
            />
            <TextField
              id="password"
              label={t("common.fields.password")}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              inputProps={{ "data-testid": "first-access-password" }}
            />
            <TextField
              id="position"
              select
              label={t("common.fields.position")}
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              fullWidth
              data-testid="first-access-position-select"
            >
              <MenuItem value="">
                <em>{t("common.select_placeholder")}</em>
              </MenuItem>
              {POSITIONS.map((pos) => (
                <MenuItem
                  key={pos}
                  value={pos}
                  data-testid={`position-option-${pos}`}
                >
                  {t(`common.positions.${pos.toLowerCase()}`)}
                </MenuItem>
              ))}
            </TextField>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              size="large"
              data-testid="first-access-submit"
            >
              {loading
                ? t("auth.first_access.button.loading")
                : t("auth.first_access.button.submit")}
            </Button>
            <Typography variant="body2" textAlign="center">
              <MLink
                href={`/login${searchParams.get("redirect") ? `?redirect=${encodeURIComponent(searchParams.get("redirect")!)}` : ""}`}
                underline="hover"
              >
                {t("auth.register.link.login")}
              </MLink>
            </Typography>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
