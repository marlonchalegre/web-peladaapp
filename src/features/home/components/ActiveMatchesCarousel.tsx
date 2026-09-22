import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  CircularProgress,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Pelada, AttendanceStatus } from "../../../shared/api/endpoints";
import LocationDisplay from "../../../shared/components/LocationDisplay";

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

  const confirmedCount = currentPelada.confirmed_count ?? 0;
  const maxPlayers = currentPelada.max_players ?? null;
  const previewInitials = (currentPelada.confirmed_preview ?? "")
    .split("|")
    .filter(Boolean)
    .map((name) =>
      name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase(),
    );
  const remainingConfirmed = Math.max(
    0,
    confirmedCount - previewInitials.length,
  );

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

  const dayNumber = dateObj ? dateObj.getDate() : "--";
  const weekday = dateObj
    ? dateObj
        .toLocaleDateString(t("common.locale_code", "pt-BR"), {
          weekday: "long",
        })
        .toUpperCase()
    : "";
  const monthAndTime = dateObj
    ? `${dateObj.toLocaleDateString(t("common.locale_code", "pt-BR"), {
        month: "long",
      })} · ${dateObj.toLocaleTimeString(t("common.locale_code", "pt-BR"), {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : "";

  return (
    <Box sx={{ mb: 4 }} data-testid="active-matches-carousel">
      {/* Header with Title and pagination controls */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          mb: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5 }}>
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: "9.5px",
              letterSpacing: "0.18em",
              color: "#6b675c",
              textTransform: "uppercase",
            }}
          >
            {t("home.carousel.section_title", "SUA SEMANA")}
          </Typography>
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: "11px",
              color: "#6b675c",
            }}
          >
            {activePeladas.length}{" "}
            {activePeladas.length === 1
              ? t("home.carousel.single_match", "jogo")
              : t("home.carousel.plural_matches", "jogos")}
            {activePeladas.length > 1 ? ` · 1 pendente` : ""}
          </Typography>
        </Box>

        {activePeladas.length > 1 && (
          <Box sx={{ display: "flex", gap: 0.8 }}>
            <IconButton
              size="small"
              onClick={handlePrev}
              data-testid="carousel-prev-btn"
              sx={{
                width: 28,
                height: 28,
                borderRadius: "8px",
                border: "1.5px solid #ddd8cc",
                bgcolor: "#ffffff",
                color: "#17181a",
                p: 0,
                "&:hover": { bgcolor: "#f6f4ee" },
              }}
            >
              <ChevronLeftIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleNext}
              data-testid="carousel-next-btn"
              sx={{
                width: 28,
                height: 28,
                borderRadius: "8px",
                border: "1.5px solid #ddd8cc",
                bgcolor: "#ffffff",
                color: "#17181a",
                p: 0,
                "&:hover": { bgcolor: "#f6f4ee" },
              }}
            >
              <ChevronRightIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* Tactile Card based on Template 2a */}
      <Box
        sx={{
          bgcolor: "#ffffff",
          border: "2px solid #17181a",
          borderRadius: "18px",
          overflow: "hidden",
          boxShadow: "5px 5px 0 #17181a",
          transition: "all 0.2s ease",
        }}
      >
        {/* Top bar strip */}
        <Box
          sx={{
            bgcolor: "#146b3a",
            px: 2,
            py: 1.1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              component="span"
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.22)",
                borderRadius: "5px",
                px: "6px",
                py: "3px",
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "9px",
                letterSpacing: "0.1em",
                color: "#ffffff",
              }}
            >
              FUT
            </Box>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "11px",
                letterSpacing: "0.06em",
                color: "#ffffff",
                textTransform: "uppercase",
              }}
            >
              {currentPelada.organization_name || t("common.pelada", "Pelada")}
            </Typography>
          </Box>

          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: "11px",
              color: "#bfe6ce",
            }}
          >
            {currentPelada.status === "attendance"
              ? isConfirmed
                ? "presença confirmada"
                : "lista aberta"
              : t(
                  `pelada.status.${currentPelada.status}`,
                  currentPelada.status || "",
                )}
          </Typography>
        </Box>

        {/* Card Content */}
        {/* Card Content: 3 horizontal sections on desktop (4a), vertical on mobile (2a) */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "stretch" },
            boxSizing: "border-box",
          }}
        >
          {/* Section 1: Big Date Block */}
          <Box
            sx={{
              p: { xs: 2, sm: 2.5, md: 2.5 },
              borderRight: { xs: "none", md: "1.5px dashed #ddd8cc" },
              flex: { md: "0 0 auto" },
              display: "flex",
              alignItems: "flex-end",
              gap: 1.5,
            }}
          >
            <Typography
              sx={{
                fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                fontWeight: 700,
                fontSize: { xs: "48px", sm: "58px", md: "62px" },
                lineHeight: 0.85,
                letterSpacing: "-0.03em",
                color: "#17181a",
              }}
            >
              {dayNumber}
            </Typography>
            <Box sx={{ pb: 0.5 }}>
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: "13.5px",
                  lineHeight: 1.1,
                  color: "#17181a",
                }}
              >
                {weekday}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 600,
                  fontSize: "12.5px",
                  color: "#6b675c",
                }}
              >
                {monthAndTime}
              </Typography>
            </Box>
          </Box>

          {/* Section 2: Details (Progress, Avatars, Location) */}
          <Box
            sx={{
              p: { xs: "0 16px 16px", md: 2.5 },
              flex: { md: "1 1 200px" },
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            {/* NA LISTA Header & Progress Bar (Desktop 4a) */}
            <Box sx={{ display: { xs: "none", md: "block" }, mb: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <Typography
                  sx={{
                    font: "700 9.5px/1 Archivo, sans-serif",
                    letterSpacing: ".16em",
                    color: "#6b675c",
                  }}
                >
                  NA LISTA
                </Typography>
                <Typography
                  sx={{
                    font: "700 12.5px/1 Archivo, sans-serif",
                    color: "#17181a",
                  }}
                >
                  {confirmedCount}
                  {maxPlayers ? (
                    <>
                      {" "}
                      <Box
                        component="span"
                        sx={{ color: "#6b675c", fontWeight: 600 }}
                      >
                        de {maxPlayers}
                      </Box>
                    </>
                  ) : null}
                </Typography>
              </Box>
              <Box
                sx={{
                  height: 7,
                  borderRadius: 4,
                  bgcolor: "#eae6db",
                  overflow: "hidden",
                  display: "flex",
                  mt: 1,
                }}
              >
                <Box
                  sx={{
                    width: `${
                      maxPlayers
                        ? Math.min(
                            100,
                            Math.round((confirmedCount / maxPlayers) * 100),
                          )
                        : 0
                    }%`,
                    bgcolor: "#146b3a",
                  }}
                />
              </Box>
            </Box>

            {/* Attendance Avatars Stack & Count */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 1.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                {previewInitials.map((initials, idx) => (
                  <Box
                    key={`${initials}-${idx}`}
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      bgcolor: ["#c9d9cd", "#dcd3bd", "#cdd6e0", "#e2cfc7"][
                        idx % 4
                      ],
                      border: "2px solid #ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: "9.5px",
                      color: "#17181a",
                      ml: idx > 0 ? "-8px" : 0,
                      zIndex: 4 - idx,
                    }}
                  >
                    {initials}
                  </Box>
                ))}
                {remainingConfirmed > 0 && (
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      bgcolor: "#17181a",
                      border: "2px solid #ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: "9px",
                      color: "#ffffff",
                      ml: "-8px",
                    }}
                  >
                    +{remainingConfirmed}
                  </Box>
                )}
              </Box>

              <Typography
                sx={{
                  display: { xs: "block", md: "none" },
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "12px",
                  color: "#17181a",
                }}
              >
                {confirmedCount}{" "}
                <Box
                  component="span"
                  sx={{ color: "#6b675c", fontWeight: 600 }}
                >
                  {maxPlayers
                    ? `${t("home.carousel.of_slots", "de")} ${maxPlayers} ${t(
                        "home.carousel.on_list",
                        "na lista",
                      )}`
                    : t("home.carousel.on_list", "na lista")}
                </Box>
              </Typography>
            </Box>

            {/* Location with indicator */}
            {currentPelada.location && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  pt: 1.5,
                  borderTop: "1.5px dashed #ddd8cc",
                }}
              >
                <LocationDisplay
                  location={currentPelada.location}
                  showDot
                  dotColor="#146b3a"
                  textSx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 600,
                    fontSize: "12.5px",
                    color: "#4a4740",
                  }}
                  dataTestId="carousel-pelada-location"
                />
              </Box>
            )}
          </Box>

          {/* Section 3: Action Area (Right column on desktop, bottom on mobile) */}
          <Box
            sx={{
              p: { xs: "0 16px 16px", md: 2.5 },
              width: { xs: "100%", md: 220 },
              bgcolor: { xs: "transparent", md: "#f6f4ee" },
              borderLeft: { xs: "none", md: "1.5px solid #eae6db" },
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 1.5,
              boxSizing: "border-box",
            }}
          >
            {currentPelada.status === "attendance" ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  mt: 1,
                }}
              >
                {/* Primary CTA: BORA PRO JOGO */}
                <Button
                  color="success"
                  variant={isConfirmed ? "contained" : "outlined"}
                  fullWidth
                  disabled={Boolean(pending)}
                  onClick={() => handleAttendance("confirmed")}
                  data-testid="carousel-attendance-confirm-btn"
                  aria-label={t(
                    "peladas.home_carousel.attendance.confirm",
                    "Confirmar Presença",
                  )}
                  startIcon={
                    pending?.status === "confirmed" ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : null
                  }
                  sx={{
                    py: 2,
                    borderRadius: "14px",
                    bgcolor: isConfirmed ? "#0d4526" : "#146b3a",
                    color: "#ffffff",
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 800,
                    fontSize: "17px",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    boxShadow: "0 3px 0 #0d4526",
                    border: "none",
                    "&:hover": {
                      bgcolor: "#0e5c31",
                      border: "none",
                    },
                  }}
                >
                  {isConfirmed
                    ? t("home.carousel.presence_confirmed", "CONFIRMADO")
                    : t(
                        "home.carousel.actions.confirm_presence",
                        "BORA PRO JOGO",
                      )}
                </Button>

                {/* Sub-actions: Não vou dessa vez (left) | Ver lista → (right) */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    px: 0.5,
                  }}
                >
                  <Button
                    color="error"
                    variant={isDeclined ? "contained" : "outlined"}
                    onClick={() => handleAttendance("declined")}
                    data-testid="carousel-attendance-cancel-btn"
                    disabled={Boolean(pending)}
                    aria-label={t(
                      "peladas.home_carousel.attendance.decline",
                      "Recusar Presença",
                    )}
                    sx={{
                      background: "none !important",
                      border: "none !important",
                      p: 0,
                      minWidth: "auto",
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 600,
                      fontSize: "12px",
                      color: isDeclined ? "#a8452a" : "#6b675c",
                      textDecoration: "underline",
                      textTransform: "none",
                      boxShadow: "none !important",
                      "&:hover": { color: "#17181a", background: "none" },
                    }}
                  >
                    {isDeclined
                      ? t("home.carousel.presence_declined", "Você recusou")
                      : t(
                          "home.carousel.actions.cancel_presence",
                          "Não vou dessa vez",
                        )}
                  </Button>

                  <Button
                    onClick={() => navigate(actionDetails.link)}
                    data-testid="carousel-view-attendance-btn"
                    aria-label={t(
                      "peladas.home_carousel.attendance.view_list",
                      "Ver Lista de Presença",
                    )}
                    sx={{
                      background: "none !important",
                      border: "none !important",
                      p: 0,
                      minWidth: "auto",
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 700,
                      fontSize: "12px",
                      color: "#146b3a",
                      textTransform: "none",
                      boxShadow: "none !important",
                      "&:hover": {
                        textDecoration: "underline",
                        background: "none",
                      },
                    }}
                  >
                    {t("home.carousel.actions.view_list", "Ver lista →")}
                  </Button>
                </Box>
              </Box>
            ) : (
              <Button
                variant="contained"
                fullWidth
                color={actionDetails.color}
                onClick={() => navigate(actionDetails.link)}
                data-testid="carousel-action-btn"
                sx={{
                  py: 1.6,
                  borderRadius: "14px",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: "15px",
                  letterSpacing: "0.04em",
                  bgcolor: "#17181a",
                  color: "#ffffff",
                  boxShadow: "0 3px 0 #000000",
                  "&:hover": {
                    bgcolor: "#000000",
                  },
                }}
              >
                {actionDetails.text}
              </Button>
            )}
          </Box>

          {activePeladas.length > 1 && (
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontSize: "10.5px",
                fontWeight: 600,
                color: "#6b675c",
                textAlign: "center",
                mt: 1.5,
              }}
            >
              {safeIndex + 1} {t("common.of", "de")} {activePeladas.length}{" "}
              {t("home.carousel.matches", "partidas")}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
