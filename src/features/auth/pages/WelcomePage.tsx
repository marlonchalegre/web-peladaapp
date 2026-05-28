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
  HowToVote as HowToVoteIcon,
  EmojiEvents as TrophyIcon,
  WhatsApp as WhatsAppIcon,
  AttachMoney as FinanceIcon,
  CalendarMonth as ScheduleIcon,
  Radar as RadarIcon,
} from "@mui/icons-material";
import { useNavigate, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../app/providers/AuthContext";

/**
 * Mock UI for Match Attendance demonstrating position-based sorting & waitlist rules
 */
function MockMatchAttendance() {
  const { t } = useTranslation();
  const theme = useTheme();

  const positionConfig = {
    GK: { label: "GK", color: "#ED6C02" }, // Goalkeeper (Orange)
    DF: { label: "DF", color: "#0288D1" }, // Defender (Blue)
    MF: { label: "MF", color: "#2E7D32" }, // Midfielder (Teal)
    ST: { label: "ST", color: "#D32F2F" }, // Striker (Red)
  };

  const players = [
    { name: "Zetti", pos: "GK", type: "Mensalista", status: "confirmed" },
    { name: "Aldair", pos: "DF", type: "Mensalista", status: "confirmed" },
    { name: "Dunga", pos: "MF", type: "Diarista", status: "confirmed" },
    { name: "Romário", pos: "ST", type: "Mensalista", status: "confirmed" },
    { name: "Bebeto", pos: "ST", type: "Convidado", status: "waitlist" },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 4,
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        bgcolor: "background.paper",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`,
      }}
    >
      <Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 800, color: "primary.main", letterSpacing: 0.5 }}
          >
            {t("welcome.mock.match_day", "Game Roster")}
          </Typography>
          <Chip
            label={t("welcome.mock.attendance_phase", "Attendance Phase")}
            size="small"
            variant="outlined"
            color="primary"
            sx={{ fontSize: "0.65rem", height: 18, fontWeight: 700 }}
          />
        </Box>

        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            display: "block",
            mb: 2,
            fontSize: "0.72rem",
            lineHeight: 1.3,
          }}
        >
          {t(
            "welcome.mock.no_fifo_bias",
            "No FIFO bias: Sorted by Position (GK > DF > MF > ST) & Name.",
          )}
        </Typography>

        <Stack spacing={1}>
          {players.map((p, i) => {
            const pos = positionConfig[p.pos as keyof typeof positionConfig];
            return (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 1,
                  bgcolor:
                    p.status === "confirmed"
                      ? alpha(theme.palette.success.main, 0.05)
                      : alpha(theme.palette.warning.main, 0.05),
                  borderRadius: 2.5,
                  border: `1px solid ${alpha(theme.palette.divider, 0.04)}`,
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center" }}
                >
                  <Avatar
                    sx={{
                      width: 26,
                      height: 26,
                      fontSize: "0.68rem",
                      fontWeight: "bold",
                      bgcolor: pos.color,
                      color: "#fff",
                      boxShadow: `0 2px 4px ${alpha(pos.color, 0.3)}`,
                    }}
                  >
                    {pos.label}
                  </Avatar>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.82rem",
                        color: "text.primary",
                      }}
                    >
                      {p.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        display: "block",
                        fontSize: "0.62rem",
                        mt: -0.2,
                      }}
                    >
                      {p.type === "Mensalista"
                        ? t("common.member_types.mensalista", "Mensalista")
                        : p.type === "Diarista"
                          ? t("common.member_types.diarista", "Diarista")
                          : t("common.member_types.convidado", "Guest")}
                    </Typography>
                  </Box>
                </Stack>
                <Chip
                  label={
                    p.status === "confirmed"
                      ? t("welcome.mock.confirmed", "Confirmed")
                      : t("welcome.mock.waitlist", "Waitlist")
                  }
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    bgcolor:
                      p.status === "confirmed"
                        ? alpha(theme.palette.success.main, 0.08)
                        : alpha(theme.palette.warning.main, 0.08),
                    color:
                      p.status === "confirmed"
                        ? "success.main"
                        : "warning.main",
                    border: `1px solid ${p.status === "confirmed" ? alpha(theme.palette.success.main, 0.15) : alpha(theme.palette.warning.main, 0.15)}`,
                  }}
                />
              </Box>
            );
          })}
        </Stack>
      </Box>
    </Paper>
  );
}

/**
 * Mock UI for Balanced Teams demonstrating Bucket Shuffle with locked Goalkeepers
 */
function MockTeams() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 4,
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        bgcolor: "background.paper",
        boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 800, color: "secondary.main", letterSpacing: 0.5 }}
        >
          {t("welcome.mock.teams", "Bucket Shuffle Draw")}
        </Typography>
        <TrophyIcon color="warning" sx={{ fontSize: 18 }} />
      </Box>

      <Typography
        variant="caption"
        sx={{
          color: "text.secondary",
          display: "block",
          mb: 2,
          fontSize: "0.72rem",
          lineHeight: 1.3,
        }}
      >
        {t(
          "welcome.mock.goalkeepers_fixed",
          "Goalkeepers fixed to teams. Other positions shuffled & greedily balanced.",
        )}
      </Typography>

      <Grid container spacing={1.5} sx={{ alignItems: "stretch" }}>
        <Grid size={{ xs: 12, md: 6, lg: 12 }} sx={{ display: "flex" }}>
          <Box
            sx={{
              p: 1.2,
              bgcolor: alpha(theme.palette.primary.main, 0.03),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
              borderRadius: 3,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 0.8,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  color: "primary.main",
                  fontSize: "0.72rem",
                  whiteSpace: "nowrap",
                }}
              >
                {t("welcome.mock.team_a", "TEAM A")}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: "text.secondary",
                  fontSize: "0.68rem",
                  whiteSpace: "nowrap",
                }}
              >
                {t("welcome.mock.avg", "Avg")}: 4.2
              </Typography>
            </Box>
            <Stack spacing={0.5}>
              <Typography
                variant="caption"
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.75rem",
                  color: "text.primary",
                  width: "100%",
                }}
              >
                <span
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  🧤 Zetti
                </span>{" "}
                <span
                  style={{
                    color: theme.palette.text.secondary,
                    fontSize: "0.65rem",
                    fontWeight: 500,
                    flexShrink: 0,
                    marginLeft: "8px",
                  }}
                >
                  {t("welcome.mock.gk_locked", "GK (Locked)")}
                </span>
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.75rem",
                  color: "text.primary",
                  width: "100%",
                }}
              >
                <span
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  🛡️ Aldair
                </span>{" "}
                <span
                  style={{
                    color: theme.palette.text.secondary,
                    fontSize: "0.65rem",
                    fontWeight: 500,
                    flexShrink: 0,
                    marginLeft: "8px",
                  }}
                >
                  {t("welcome.mock.df", "DF")}
                </span>
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.75rem",
                  color: "text.primary",
                  width: "100%",
                }}
              >
                <span
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  🔥 Romário
                </span>{" "}
                <span
                  style={{
                    color: theme.palette.text.secondary,
                    fontSize: "0.65rem",
                    fontWeight: 500,
                    flexShrink: 0,
                    marginLeft: "8px",
                  }}
                >
                  {t("welcome.mock.st", "ST")}
                </span>
              </Typography>
            </Stack>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 12 }} sx={{ display: "flex" }}>
          <Box
            sx={{
              p: 1.2,
              bgcolor: alpha(theme.palette.secondary.main, 0.03),
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.08)}`,
              borderRadius: 3,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 0.8,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  color: "secondary.main",
                  fontSize: "0.72rem",
                  whiteSpace: "nowrap",
                }}
              >
                {t("welcome.mock.team_b", "TEAM B")}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: "text.secondary",
                  fontSize: "0.68rem",
                  whiteSpace: "nowrap",
                }}
              >
                {t("welcome.mock.avg", "Avg")}: 4.1
              </Typography>
            </Box>
            <Stack spacing={0.5}>
              <Typography
                variant="caption"
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.75rem",
                  color: "text.primary",
                  width: "100%",
                }}
              >
                <span
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  🧤 Taffarel
                </span>{" "}
                <span
                  style={{
                    color: theme.palette.text.secondary,
                    fontSize: "0.65rem",
                    fontWeight: 500,
                    flexShrink: 0,
                    marginLeft: "8px",
                  }}
                >
                  {t("welcome.mock.gk_locked", "GK (Locked)")}
                </span>
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.75rem",
                  color: "text.primary",
                  width: "100%",
                }}
              >
                <span
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  ⚡ Dunga
                </span>{" "}
                <span
                  style={{
                    color: theme.palette.text.secondary,
                    fontSize: "0.65rem",
                    fontWeight: 500,
                    flexShrink: 0,
                    marginLeft: "8px",
                  }}
                >
                  {t("welcome.mock.mf", "MF")}
                </span>
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.75rem",
                  color: "text.primary",
                  width: "100%",
                }}
              >
                <span
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  ⚽ Bebeto
                </span>{" "}
                <span
                  style={{
                    color: theme.palette.text.secondary,
                    fontSize: "0.65rem",
                    fontWeight: 500,
                    flexShrink: 0,
                    marginLeft: "8px",
                  }}
                >
                  {t("welcome.mock.st", "ST")}
                </span>
              </Typography>
            </Stack>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}

/**
 * Mock UI for MVP Voting demonstrating normalized peer ratings (Z-Scores)
 */
function MockVoting() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 4,
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        bgcolor: "background.paper",
        boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 800, color: "primary.main", letterSpacing: 0.5 }}
        >
          {t("welcome.mock.mvp_vote", "Z-Score Peer Voting")}
        </Typography>
        <HowToVoteIcon color="primary" sx={{ fontSize: 18 }} />
      </Box>

      <Typography
        variant="caption"
        sx={{
          color: "text.secondary",
          display: "block",
          mb: 1.5,
          fontSize: "0.72rem",
          lineHeight: 1.3,
        }}
      >
        {t(
          "welcome.mock.ratings_normalized",
          "Ratings normalized (1 to 10) to neutralize strict/lenient voter bias.",
        )}
      </Typography>

      <Stack spacing={1} sx={{ alignItems: "center", py: 0.5 }}>
        <Box sx={{ position: "relative" }}>
          <Avatar
            sx={{
              bgcolor: "primary.dark",
              width: 42,
              height: 42,
              fontWeight: "bold",
              fontSize: "1rem",
            }}
          >
            R
          </Avatar>
          <Chip
            label={t("welcome.mock.mvp", "MVP")}
            size="small"
            color="warning"
            sx={{
              position: "absolute",
              bottom: -6,
              left: "50%",
              transform: "translateX(-50%)",
              height: 14,
              fontSize: "0.55rem",
              fontWeight: 900,
              px: 0.5,
            }}
          />
        </Box>
        <Box sx={{ textAlign: "center", width: "100%" }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 800, color: "text.primary" }}
          >
            Ronaldinho
          </Typography>
          <Rating value={5} readOnly size="small" sx={{ mt: 0.25 }} />
          <Box
            sx={{ mt: 1, display: "flex", gap: 1, justifyContent: "center" }}
          >
            <Chip
              label={t("welcome.mock.raw_stars", { val: "5.0" })}
              size="small"
              variant="outlined"
              sx={{ height: 18, fontSize: "0.62rem", fontWeight: 700 }}
            />
            <Chip
              label={t("welcome.mock.normalized_score", { val: "9.4" })}
              size="small"
              color="primary"
              sx={{ height: 18, fontSize: "0.62rem", fontWeight: 800 }}
            />
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
}

export default function WelcomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { isAuthenticated } = useAuth();

  // If already authenticated, redirect to home
  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  const features = [
    {
      key: "roster",
      icon: <GroupIcon fontSize="large" />,
      title: t("welcome.features.roster.title", "Easy RSVP & Attendance List"),
      description: t(
        "welcome.features.roster.description",
        "Confirm who is playing with one tap. The roster and waitlist are automatically organized by football position so you know exactly who is in.",
      ),
    },
    {
      key: "skills",
      icon: <RadarIcon fontSize="large" />,
      title: t("welcome.features.skills.title", "Player Skill Cards"),
      description: t(
        "welcome.features.skills.description",
        "Rate players from 0 to 5 on core skills like passing, shooting, and defending, and visualize them on an interactive radar graph.",
      ),
    },
    {
      key: "bucket_shuffle",
      icon: <SportsSoccerIcon fontSize="large" />,
      title: t(
        "welcome.features.bucket_shuffle.title",
        "Fair & Balanced Teams",
      ),
      description: t(
        "welcome.features.bucket_shuffle.description",
        "No more stacked teams! Automatically draw teams balanced by player skill and position, ensuring goalkeepers are locked to each side.",
      ),
    },
    {
      key: "ils_scheduling",
      icon: <ScheduleIcon fontSize="large" />,
      title: t(
        "welcome.features.ils_scheduling.title",
        "Match Schedule Generator",
      ),
      description: t(
        "welcome.features.ils_scheduling.description",
        "Generate match fixture schedules instantly to keep the games flowing, balance match-ups, and minimize waiting time on the bench.",
      ),
    },
    {
      key: "z_score_voting",
      icon: <HowToVoteIcon fontSize="large" />,
      title: t("welcome.features.z_score_voting.title", "Vote for the MVP"),
      description: t(
        "welcome.features.z_score_voting.description",
        "Let players rate each other after the match to elect the craque (MVP) using a fair scoring model that neutralizes voting bias.",
      ),
    },
    {
      key: "waha_whatsapp",
      icon: <WhatsAppIcon fontSize="large" />,
      title: t(
        "welcome.features.waha_whatsapp.title",
        "WhatsApp Notifications",
      ),
      description: t(
        "welcome.features.waha_whatsapp.description",
        "Keep the group informed! Send attendance lists, balanced team sheets, and game scores straight to your WhatsApp group chat.",
      ),
    },
    {
      key: "finances",
      icon: <FinanceIcon fontSize="large" />,
      title: t("welcome.features.finances.title", "Simple Dues & Payments"),
      description: t(
        "welcome.features.finances.description",
        "Track monthly fees for regular players and pay-per-play costs for guests with a single click, keeping your group's budget clean.",
      ),
    },
  ];

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Hero Section */}
      <Box
        sx={{
          pt: { xs: 6, sm: 8, md: 12 },
          pb: { xs: 8, md: 12 },
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.background.default, 1)} 100%)`,
          "&::before": {
            content: '""',
            position: "absolute",
            top: -150,
            right: -150,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: alpha(theme.palette.primary.main, 0.03),
            filter: "blur(80px)",
            pointerEvents: "none",
          },
        }}
      >
        <Container maxWidth="lg">
          <Grid
            container
            spacing={{ xs: 4, md: 6 }}
            sx={{ alignItems: "center" }}
          >
            {/* Left Content Column */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={4}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    component="img"
                    src="/logo.png"
                    alt="Logo"
                    sx={{
                      width: { xs: 48, sm: 64 },
                      height: { xs: 48, sm: 64 },
                      filter: `drop-shadow(0 4px 12px ${alpha(theme.palette.primary.main, 0.2)})`,
                    }}
                  />
                  <Typography
                    variant="h3"
                    component="h1"
                    color="primary"
                    sx={{
                      fontSize: { xs: "2.25rem", sm: "3rem", md: "3.5rem" },
                      fontWeight: 900,
                      letterSpacing: -0.5,
                      background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Minha Pelada
                  </Typography>
                </Box>

                <Stack spacing={2}>
                  <Typography
                    variant="h4"
                    sx={{
                      lineHeight: 1.2,
                      fontSize: { xs: "1.75rem", sm: "2.5rem", md: "2.8rem" },
                      fontWeight: 800,
                      letterSpacing: -0.5,
                      color: "text.primary",
                    }}
                  >
                    {t(
                      "welcome.title",
                      "Organize soccer matches professionally",
                    )}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: "text.secondary",
                      fontWeight: 400,
                      lineHeight: 1.6,
                      fontSize: { xs: "1rem", sm: "1.1rem", md: "1.2rem" },
                      maxWidth: 640,
                    }}
                  >
                    {t(
                      "welcome.subtitle",
                      "Confirm RSVPs automatically, draw balanced teams fairly, schedule match times, vote for the best player, and keep everyone updated on WhatsApp!",
                    )}
                  </Typography>
                </Stack>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{ pt: 1 }}
                >
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate("/register")}
                    sx={{
                      px: { xs: 4, sm: 5 },
                      py: 1.8,
                      borderRadius: 3,
                      fontWeight: 800,
                      fontSize: "0.95rem",
                      boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.25)}`,
                      transition: "all 0.2s",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, 0.35)}`,
                      },
                    }}
                  >
                    {t("welcome.cta.register", "Create Free Account")}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate("/login")}
                    sx={{
                      px: { xs: 4, sm: 5 },
                      py: 1.8,
                      borderRadius: 3,
                      fontWeight: 800,
                      fontSize: "0.95rem",
                      borderWidth: 2,
                      "&:hover": {
                        borderWidth: 2,
                        transform: "translateY(-2px)",
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                      },
                    }}
                  >
                    {t("welcome.cta.login", "Login")}
                  </Button>
                </Stack>
              </Stack>
            </Grid>

            {/* Right Mock Visuals Column */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 12, lg: 6 }}>
                  <MockMatchAttendance />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 12, lg: 6 }}>
                  <Stack
                    spacing={2}
                    sx={{ height: "100%", justifyContent: "space-between" }}
                  >
                    <MockVoting />
                    <MockTeams />
                  </Stack>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Technical Features Section */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          bgcolor: "background.paper",
          position: "relative",
        }}
      >
        <Container maxWidth="lg">
          <Stack
            spacing={2}
            sx={{
              mb: { xs: 6, md: 8 },
              textAlign: "center",
              alignItems: "center",
            }}
          >
            <Chip
              label={t("welcome.sections.features.badge", "SYSTEM FEATURES")}
              size="small"
              color="primary"
              sx={{ fontWeight: 800, px: 1, letterSpacing: 1 }}
            />
            <Typography
              variant="h4"
              component="h2"
              sx={{
                fontWeight: 800,
                fontSize: { xs: "1.75rem", md: "2.5rem" },
              }}
            >
              {t(
                "welcome.sections.features.title",
                "Everything You Need for Match Day",
              )}
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "text.secondary", maxWidth: 600, mx: "auto" }}
            >
              {t(
                "welcome.sections.features.subtitle",
                "Smart scheduling, balanced teams, and integrations designed to give you a professional soccer group manager.",
              )}
            </Typography>
          </Stack>

          <Grid container spacing={4}>
            {features.map((feature) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={feature.key}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    height: "100%",
                    borderRadius: 5,
                    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                    bgcolor: "background.default",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    "&:hover": {
                      transform: "translateY(-6px)",
                      boxShadow: `0 12px 30px ${alpha(theme.palette.primary.main, 0.06)}`,
                      borderColor: alpha(theme.palette.primary.main, 0.2),
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      color: "primary.main",
                      width: 56,
                      height: 56,
                      mb: 2.5,
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
                    }}
                  >
                    {feature.icon}
                  </Avatar>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      fontWeight: 800,
                      color: "text.primary",
                      fontSize: "1.1rem",
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      lineHeight: 1.6,
                      fontSize: "0.88rem",
                    }}
                  >
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          py: 4,
          mt: "auto",
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          bgcolor: "background.default",
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            &copy; {new Date().getFullYear()} Minha Pelada. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
