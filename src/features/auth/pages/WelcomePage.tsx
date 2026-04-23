import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Paper,
  Stack,
  Avatar,
  Chip,
  Rating,
  useTheme,
  alpha,
} from "@mui/material";
import {
  SportsSoccer as SportsSoccerIcon,
  Group as GroupIcon,
  Assessment as AssessmentIcon,
  HowToVote as HowToVoteIcon,
  EmojiEvents as TrophyIcon,
} from "@mui/icons-material";
import { useNavigate, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../app/providers/AuthContext";

/**
 * Mock UI for Match Attendance
 */
function MockMatchAttendance() {
  const { t } = useTranslation();
  return (
    <Paper sx={{ p: 2, borderRadius: 2, height: "100%" }}>
      <Typography variant="subtitle2" color="primary" gutterBottom>
        {t("welcome.mock.match_day")}
      </Typography>
      <Stack spacing={1}>
        {[
          { name: "Pelé", status: "confirmed" },
          { name: "Zico", status: "confirmed" },
          { name: "Romário", status: "pending" },
        ].map((p, i) => (
          <Box
            key={i}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 1,
              bgcolor: "action.hover",
              borderRadius: 1,
            }}
          >
            <Typography variant="body2">{p.name}</Typography>
            <Chip
              label={t(`peladas.attendance.status.${p.status}`)}
              size="small"
              color={p.status === "confirmed" ? "success" : "default"}
              variant={p.status === "confirmed" ? "filled" : "outlined"}
            />
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

/**
 * Mock UI for Balanced Teams
 */
function MockTeams() {
  const { t } = useTranslation();
  return (
    <Paper sx={{ p: 2, borderRadius: 2, height: "100%" }}>
      <Grid container spacing={1}>
        <Grid size={6}>
          <Typography variant="caption" fontWeight="bold">
            {t("welcome.mock.team_a")}
          </Typography>
          <Stack spacing={0.5} mt={1}>
            {[1, 2, 3].map((v) => (
              <Box
                key={v}
                sx={{ height: 8, bgcolor: "primary.main", borderRadius: 4 }}
              />
            ))}
          </Stack>
        </Grid>
        <Grid size={6}>
          <Typography variant="caption" fontWeight="bold">
            {t("welcome.mock.team_b")}
          </Typography>
          <Stack spacing={0.5} mt={1}>
            {[1, 2, 3].map((v) => (
              <Box
                key={v}
                sx={{ height: 8, bgcolor: "secondary.main", borderRadius: 4 }}
              />
            ))}
          </Stack>
        </Grid>
      </Grid>
      <Box sx={{ mt: 2, textAlign: "center" }}>
        <TrophyIcon color="warning" sx={{ fontSize: 40 }} />
      </Box>
    </Paper>
  );
}

/**
 * Mock UI for MVP Voting
 */
function MockVoting() {
  const { t } = useTranslation();
  return (
    <Paper sx={{ p: 2, borderRadius: 2, height: "100%" }}>
      <Typography variant="subtitle2" textAlign="center" gutterBottom>
        {t("welcome.mock.mvp_vote")}
      </Typography>
      <Stack alignItems="center" spacing={1}>
        <Avatar sx={{ bgcolor: "primary.dark", width: 48, height: 48 }}>
          R
        </Avatar>
        <Typography variant="body2" fontWeight="bold">
          Ronaldinho
        </Typography>
        <Rating value={5} readOnly size="small" />
        <HowToVoteIcon color="primary" />
      </Stack>
    </Paper>
  );
}

export default function WelcomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { isAuthenticated } = useAuth();

  // Se já estiver autenticado, vai direto para a home
  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Hero Section */}
      <Box
        sx={{
          pt: { xs: 8, md: 12 },
          pb: { xs: 8, md: 10 },
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.background.default, 1)} 100%)`,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={3}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    component="img"
                    src="/logo.png"
                    alt="Logo"
                    sx={{ width: 64, height: 64 }}
                  />
                  <Typography
                    variant="h3"
                    component="h1"
                    fontWeight={800}
                    color="primary"
                    sx={{ fontSize: { xs: "2.5rem", md: "3.5rem" } }}
                  >
                    PeladaApp
                  </Typography>
                </Box>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  sx={{
                    lineHeight: 1.2,
                    fontSize: { xs: "1.75rem", md: "2.5rem" },
                  }}
                >
                  {t("welcome.title")}
                </Typography>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ fontWeight: 400, maxWidth: 600 }}
                >
                  {t("welcome.subtitle")}
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate("/register")}
                    sx={{ px: 4, py: 1.5, borderRadius: 2, fontWeight: "bold" }}
                  >
                    {t("welcome.cta.register")}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate("/login")}
                    sx={{ px: 4, py: 1.5, borderRadius: 2, fontWeight: "bold" }}
                  >
                    {t("welcome.cta.login")}
                  </Button>
                </Stack>
              </Stack>
            </Grid>

            {/* Mock Visuals Grid */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <MockMatchAttendance />
                </Grid>
                <Grid size={6}>
                  <Stack spacing={2}>
                    <MockVoting />
                    <MockTeams />
                  </Stack>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Grid */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Stack alignItems="center" textAlign="center" spacing={2}>
              <Avatar
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: "primary.main",
                  width: 64,
                  height: 64,
                }}
              >
                <GroupIcon fontSize="large" />
              </Avatar>
              <Typography variant="h6" fontWeight="bold">
                {t("welcome.features.management.title")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("welcome.features.management.description")}
              </Typography>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Stack alignItems="center" textAlign="center" spacing={2}>
              <Avatar
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: "primary.main",
                  width: 64,
                  height: 64,
                }}
              >
                <SportsSoccerIcon fontSize="large" />
              </Avatar>
              <Typography variant="h6" fontWeight="bold">
                {t("welcome.features.teams.title")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("welcome.features.teams.description")}
              </Typography>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Stack alignItems="center" textAlign="center" spacing={2}>
              <Avatar
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: "primary.main",
                  width: 64,
                  height: 64,
                }}
              >
                <AssessmentIcon fontSize="large" />
              </Avatar>
              <Typography variant="h6" fontWeight="bold">
                {t("welcome.features.stats.title")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("welcome.features.stats.description")}
              </Typography>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
