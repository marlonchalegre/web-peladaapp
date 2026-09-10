import { useState, type ReactNode } from "react";
import {
  Paper,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Stack,
  CircularProgress,
  alpha,
  useTheme,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import CancelIcon from "@mui/icons-material/Cancel";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Pelada, AttendanceStatus } from "../../../shared/api/endpoints";

const ATTENDANCE_CHOICES = [
  {
    status: "confirmed",
    color: "success",
    activeIcon: <CheckCircleIcon />,
    idleIcon: <CheckCircleOutlinedIcon />,
    labelKey: "home.carousel.actions.confirm_presence",
    labelFallback: "Confirmar Presença",
    testId: "carousel-attendance-confirm-btn",
  },
  {
    status: "declined",
    color: "error",
    activeIcon: <CancelIcon />,
    idleIcon: <CancelOutlinedIcon />,
    labelKey: "home.carousel.actions.cancel_presence",
    labelFallback: "Cancelar Presença",
    testId: "carousel-attendance-cancel-btn",
  },
] as const satisfies readonly {
  status: AttendanceStatus;
  color: "success" | "error";
  activeIcon: ReactNode;
  idleIcon: ReactNode;
  labelKey: string;
  labelFallback: string;
  testId: string;
}[];

interface ActiveMatchesCarouselProps {
  peladas: Pelada[];
  onUpdateAttendance: (
    peladaId: string,
    status: AttendanceStatus,
  ) => Promise<void>;
}

export default function ActiveMatchesCarousel({
  peladas,
  onUpdateAttendance,
}: ActiveMatchesCarouselProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  // One in-flight answer at a time: it both drives the spinner and stands in
  // for the pelada's status until the parent's refetch makes it authoritative.
  const [pending, setPending] = useState<{
    peladaId: string;
    status: AttendanceStatus;
  } | null>(null);

  // Filter for active/upcoming matches: status is not closed, or scheduled in the future/present
  // Let's filter matches where action is likely needed or they are upcoming
  const activePeladas = peladas.filter(
    (pelada) =>
      pelada.status === "attendance" ||
      pelada.status === "voting" ||
      pelada.status === "open" ||
      pelada.status === "running",
  );

  if (activePeladas.length === 0) {
    return null;
  }

  // Both wrap around a clamped index, so a list that shrank under us still
  // steps through the peladas that remain.
  const handlePrev = () => {
    setActiveIndex((prev) => {
      const current = Math.min(prev, activePeladas.length - 1);
      return current === 0 ? activePeladas.length - 1 : current - 1;
    });
  };

  const handleNext = () => {
    setActiveIndex((prev) => {
      const current = Math.min(prev, activePeladas.length - 1);
      return current === activePeladas.length - 1 ? 0 : current + 1;
    });
  };

  // The list can shrink under the current index between renders.
  const safeIndex = Math.min(activeIndex, activePeladas.length - 1);
  const currentPelada = activePeladas[safeIndex];

  const pendingStatus =
    pending?.peladaId === currentPelada.id ? pending.status : null;
  const userAttendanceStatus =
    pendingStatus ?? currentPelada.user_attendance_status;

  const isConfirmed =
    userAttendanceStatus === "confirmed" || userAttendanceStatus === "waitlist";
  const isDeclined = userAttendanceStatus === "declined";
  const hasResponded = isConfirmed || isDeclined;

  const handleAttendance = async (status: AttendanceStatus) => {
    const peladaId = currentPelada.id;
    setPending({ peladaId, status });
    try {
      await onUpdateAttendance(peladaId, status);
    } catch (err) {
      console.error("Failed to update attendance", err);
    } finally {
      // The parent has refetched by now, so its prop is the fresher of the two
      // — including a status the server chose itself, such as a confirmation
      // into a full pelada landing on the waitlist.
      setPending(null);
    }
  };

  // Helper to determine route and CTA text based on pelada status
  const getActionDetails = (status: string) => {
    switch (status) {
      case "attendance": {
        return {
          link: `/peladas/${currentPelada.id}/attendance`,
          text: hasResponded
            ? t(
                "home.carousel.actions.view_attendance",
                "Ver Lista de Presença",
              )
            : t("home.carousel.actions.confirm", "Confirmar Presença"),
          color: hasResponded ? ("success" as const) : ("warning" as const),
        };
      }
      case "voting":
        return {
          link: `/peladas/${currentPelada.id}/voting`,
          text: t("home.carousel.actions.vote", "Votar no MVP"),
          color: "secondary" as const,
        };
      case "running":
        return {
          link: `/peladas/${currentPelada.id}/matches`,
          text: t("home.carousel.actions.running", "Acompanhar Partida"),
          color: "info" as const,
        };
      case "open":
      default:
        return {
          link: `/peladas/${currentPelada.id}`,
          text: t("home.carousel.actions.view", "Ver Detalhes"),
          color: "primary" as const,
        };
    }
  };

  const actionDetails = getActionDetails(currentPelada.status || "open");
  const dateObj = currentPelada.scheduled_at
    ? new Date(currentPelada.scheduled_at)
    : null;

  return (
    <Box sx={{ mb: 4 }} data-testid="active-matches-carousel">
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 2,
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <CalendarMonthIcon sx={{ mr: 1.5, color: "primary.main" }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t("home.carousel.title", "Minhas Peladas Ativas")}
          </Typography>
        </Box>

        {activePeladas.length > 1 && (
          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton
              size="small"
              onClick={handlePrev}
              data-testid="carousel-prev-btn"
              sx={{ border: 1, borderColor: "divider" }}
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleNext}
              data-testid="carousel-next-btn"
              sx={{ border: 1, borderColor: "divider" }}
            >
              <ChevronRightIcon />
            </IconButton>
          </Box>
        )}
      </Box>

      <Paper
        elevation={0}
        sx={{
          position: "relative",
          p: { xs: 2.5, sm: 4 },
          border: 1,
          borderColor: "divider",
          borderRadius: 4,
          background:
            theme.palette.mode === "light"
              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.4)} 0%, ${alpha(
                  theme.palette.secondary.light,
                  0.3,
                )} 100%)`
              : `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.2)} 0%, ${alpha(
                  theme.palette.secondary.dark,
                  0.15,
                )} 100%)`,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: 3,
          overflow: "hidden",
          "&::before, &::after": {
            content: '""',
            position: "absolute",
            width: 20,
            height: 20,
            borderRadius: "50%",
            bgcolor: "background.default",
            border: "1px solid",
            borderColor: "divider",
            display: { xs: "none", md: "block" },
          },
          // Match ticket indentations on the left and right sides
          "&::before": {
            left: -11,
            top: "calc(50% - 10px)",
            boxShadow: `inset -2px 0 4px ${alpha(theme.palette.common.black, 0.05)}`,
          },
          "&::after": {
            right: -11,
            top: "calc(50% - 10px)",
            boxShadow: `inset 2px 0 4px ${alpha(theme.palette.common.black, 0.05)}`,
          },
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 1,
              mb: 1.5,
            }}
          >
            <Chip
              icon={<SportsSoccerIcon sx={{ fontSize: "14px !important" }} />}
              label={
                currentPelada.organization_name || t("common.pelada", "Pelada")
              }
              size="small"
              sx={{ fontWeight: 600, bgcolor: "background.paper" }}
            />
            <Chip
              label={t(
                `pelada.status.${currentPelada.status}`,
                currentPelada.status || "",
              )}
              size="small"
              color={actionDetails.color}
              sx={{
                fontWeight: 600,
                textTransform: "uppercase",
                fontSize: "0.68rem",
              }}
            />
          </Box>

          <Typography
            variant="h5"
            sx={{ fontWeight: 800, mb: 1, color: "text.primary" }}
          >
            {dateObj
              ? dateObj.toLocaleDateString(t("common.locale_code", "pt-BR"), {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })
              : t("common.date.tbd", "TBD")}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            {dateObj
              ? `${t("home.carousel.time_prefix", "Horário:")} ${dateObj.toLocaleTimeString(
                  t("common.locale_code", "pt-BR"),
                  { hour: "2-digit", minute: "2-digit" },
                )}`
              : ""}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: { xs: "stretch", md: "flex-end" },
            width: { xs: "100%", md: "auto" },
          }}
        >
          {currentPelada.status === "attendance" ? (
            <>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                {ATTENDANCE_CHOICES.map(
                  ({
                    status,
                    color,
                    activeIcon,
                    idleIcon,
                    labelKey,
                    labelFallback,
                    testId,
                  }) => {
                    const active =
                      status === "confirmed" ? isConfirmed : isDeclined;
                    const shadow = (opacity: number) =>
                      `0 4px 12px ${alpha(theme.palette[color].main, opacity)}`;
                    return (
                      <Button
                        key={status}
                        variant={active ? "contained" : "outlined"}
                        color={color}
                        disabled={Boolean(pending)}
                        startIcon={
                          pending?.status === status ? (
                            <CircularProgress size={18} color="inherit" />
                          ) : active ? (
                            activeIcon
                          ) : (
                            idleIcon
                          )
                        }
                        onClick={() => handleAttendance(status)}
                        data-testid={testId}
                        sx={{
                          py: 1.25,
                          px: 2.5,
                          borderRadius: 3,
                          fontWeight: 700,
                          textTransform: "none",
                          boxShadow: active ? shadow(0.25) : "none",
                          "&:hover": {
                            boxShadow: active ? shadow(0.35) : "none",
                          },
                        }}
                      >
                        {t(labelKey, labelFallback)}
                      </Button>
                    );
                  },
                )}
              </Stack>

              <Button
                variant="text"
                size="small"
                onClick={() => navigate(actionDetails.link)}
                endIcon={
                  <ArrowForwardIcon sx={{ fontSize: "14px !important" }} />
                }
                data-testid="carousel-view-attendance-btn"
                sx={{
                  mt: 1,
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  color: "text.secondary",
                  alignSelf: { xs: "center", sm: "flex-end" },
                  "&:hover": {
                    color: "text.primary",
                    bgcolor: "transparent",
                    textDecoration: "underline",
                  },
                }}
              >
                {t(
                  "home.carousel.actions.view_attendance",
                  "Ver Lista de Presença",
                )}
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              color={actionDetails.color}
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate(actionDetails.link)}
              sx={{
                py: 1.5,
                px: 4,
                borderRadius: 3,
                fontWeight: 700,
                textTransform: "none",
                boxShadow: "none",
                "&:hover": {
                  boxShadow: "none",
                },
              }}
            >
              {actionDetails.text}
            </Button>
          )}

          {activePeladas.length > 1 && (
            <Typography
              variant="caption"
              sx={{
                mt: 1.5,
                color: "text.secondary",
                textAlign: "center",
                width: "100%",
                display: "block",
              }}
            >
              {activeIndex + 1} {t("common.of", "de")} {activePeladas.length}{" "}
              {t("home.carousel.matches", "partidas")}
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
