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
  MenuItem,
} from "@mui/material";
import { register, login } from "../../../shared/api/client";
import { useAuth } from "../../../app/providers/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

const POSITIONS = ["Striker", "Midfielder", "Defender", "Goalkeeper"];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [position, setPosition] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(
        name,
        username,
        email || undefined,
        password,
        position || undefined,
      );
      const { token, user } = await login(username, password);
      signIn(token, user);
      const redirect = searchParams.get("redirect") || "/";
      navigate(redirect);
    } catch (error: unknown) {
      console.error("Registration/Login failed:", error);
      const message =
        error instanceof Error
          ? error.message
          : t("auth.register.error.failed");
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
              {t("auth.register.title")}
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              id="name"
              label={t("common.fields.name")}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              autoFocus
              inputProps={{ "data-testid": "register-name" }}
            />
            <TextField
              id="username"
              label={t("common.fields.username")}
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              fullWidth
              inputProps={{ "data-testid": "register-username" }}
            />
            <TextField
              id="email"
              label={
                t("common.fields.email") + " (" + t("common.optional") + ")"
              }
              type="text"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              inputProps={{ "data-testid": "register-email" }}
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
              inputProps={{ "data-testid": "register-password" }}
            />
            <TextField
              id="position"
              select
              label={t("common.fields.position")}
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              fullWidth
              data-testid="register-position-select"
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
              data-testid="register-submit"
            >
              {loading
                ? t("auth.register.button.loading")
                : t("auth.register.button.submit")}
            </Button>
            <Typography variant="body2" textAlign="center">
              {t("auth.register.link.existing_user")}{" "}
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
