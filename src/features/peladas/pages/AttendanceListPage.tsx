import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import {
  Container,
  Typography,
  Alert,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../shared/components/Loading";
import { useAttendance } from "../hooks/useAttendance";
import { useAuth } from "../../../app/providers/AuthContext";
import { api } from "../../../shared/api/client";
import { createApi } from "../../../shared/api/endpoints";
import UserAttendanceStatus from "../components/UserAttendanceStatus";
import AttendanceListDesktopView from "../components/AttendanceListDesktopView";
import LocationDisplay from "../../../shared/components/LocationDisplay";

export default function AttendanceListPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const navigate = useNavigate();
  const { id } = useParams();
  const peladaId = id!;
  const { user } = useAuth();
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [showAllConfirmed, setShowAllConfirmed] = useState(false);

  const {
    pelada,
    confirmed,
    waitlist,
    declined,
    pending,
    isAdmin,
    loading,
    error,
    currentPlayerAsPlayer,
    isUpdatingSelf,
    peladaTransactions,
    organizationFinance,
    handleUpdateAttendance,
    handleCloseAttendance,
    handleMarkPaid,
    handleReversePayment,
  } = useAttendance(peladaId);

  // Derived admin status
  const isAnyAdmin = useMemo(() => {
    return !!(
      pelada?.is_admin ||
      isAdmin ||
      isOrgAdmin ||
      (user &&
        pelada?.organization_id &&
        (pelada.creator_id === user.id ||
          user.admin_orgs?.includes(pelada.organization_id)))
    );
  }, [pelada, isAdmin, isOrgAdmin, user]);

  const onConfirmClose = () => {
    handleCloseAttendance();
    setIsConfirmDialogOpen(false);
  };

  useEffect(() => {
    if (pelada?.organization_id && user && !isAnyAdmin) {
      const endpoints = createApi(api);
      endpoints
        .listAdminsByOrganization(pelada.organization_id)
        .then((admins) => {
          if (admins.some((a) => a.user_id === user.id)) {
            setIsOrgAdmin(true);
          }
        })
        .catch((err) => console.error("Failed to check admin status", err));
    }
  }, [pelada?.organization_id, user, isAnyAdmin]);

  if (loading && !pelada) return <Loading message={t("common.loading")} />;
  if (error)
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  if (!pelada)
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="warning">{t("peladas.error.not_found")}</Alert>
      </Container>
    );

  const rawDate =
    pelada.scheduled_at ||
    pelada.when ||
    (pelada as unknown as { date?: string }).date;
  const peladaDate = rawDate ? new Date(rawDate) : new Date();
  const dayNumber = !isNaN(peladaDate.getDate()) ? peladaDate.getDate() : 16;
  const weekday = !isNaN(peladaDate.getTime())
    ? peladaDate
        .toLocaleDateString("pt-BR", { weekday: "short" })
        .replace(".", "")
        .toUpperCase()
    : "QUA";
  const month = !isNaN(peladaDate.getTime())
    ? peladaDate.toLocaleDateString("pt-BR", { month: "long" }).toUpperCase()
    : "SETEMBRO";
  const timeStr = !isNaN(peladaDate.getTime())
    ? peladaDate.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "19:00";
  const locationStr = pelada.location ?? "";
  const maxPlayers = pelada.max_players ?? undefined;

  const handleCopyList = () => {
    const text = confirmed
      .map(
        (p, idx) =>
          `${idx + 1}. ${p.user?.name || "Jogador"} (${t(`common.member_types.${p.member_type || "diarista"}`)})`,
      )
      .join("\n");
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  };

  const displayedConfirmed = showAllConfirmed
    ? confirmed
    : confirmed.slice(0, 5);

  const formatMemberType = (memberType?: string) => {
    switch (memberType) {
      case "mensalista":
        return "MENSALISTA";
      case "diarista":
      case "diarista_temporario":
        return "DIARISTA";
      case "convidado":
        return "CONVIDADO";
      default:
        return "DIARISTA";
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "JG";
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getPositionLabel = (pos?: string) => {
    if (!pos) return "Meio-campo";
    switch (pos.toLowerCase()) {
      case "goalkeeper":
      case "goleiro":
        return "Goleiro";
      case "defender":
      case "zagueiro":
        return "Zagueiro";
      case "midfielder":
      case "meio-campo":
        return "Meio-campo";
      case "striker":
      case "atacante":
        return "Atacante";
      default:
        return pos;
    }
  };

  if (isDesktop) {
    return (
      <Box sx={{ width: "100%", bgcolor: "#f6f4ee", minHeight: "100vh" }}>
        <AttendanceListDesktopView
          pelada={pelada}
          confirmed={confirmed}
          waitlist={waitlist}
          declined={declined}
          pending={pending}
          currentPlayerAsPlayer={currentPlayerAsPlayer}
          currentUser={user}
          isAdmin={isAnyAdmin}
          onUpdateAttendance={handleUpdateAttendance}
          onUpdatePlayerAttendance={(playerId, status) =>
            handleUpdateAttendance(status, playerId)
          }
          onCloseAttendance={() => setIsConfirmDialogOpen(true)}
          dayNumber={dayNumber}
          weekday={weekday}
          month={month}
          timeStr={timeStr}
          locationStr={locationStr}
          maxPlayers={maxPlayers}
          peladaTransactions={peladaTransactions}
          diaristaPrice={organizationFinance?.diarista_price}
          onMarkPaid={handleMarkPaid}
          onReversePayment={handleReversePayment}
        />
        <Dialog
          open={isConfirmDialogOpen}
          onClose={() => setIsConfirmDialogOpen(false)}
          aria-labelledby="confirm-close-dialog-title"
          aria-describedby="confirm-close-dialog-description"
        >
          <DialogTitle id="confirm-close-dialog-title">
            {t("peladas.attendance.dialog.close_title")}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="confirm-close-dialog-description">
              {t("peladas.attendance.dialog.close_content")}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={() => setIsConfirmDialogOpen(false)}
              variant="outlined"
              color="inherit"
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              {t("peladas.attendance.dialog.cancel")}
            </Button>
            <Button
              onClick={onConfirmClose}
              variant="contained"
              color="success"
              autoFocus
              data-testid="confirm-close-attendance-button"
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              {t("peladas.attendance.dialog.confirm")}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  return (
    <Container
      maxWidth="md"
      sx={{
        py: 1,
        px: { xs: 1.5, sm: 2 },
      }}
      disableGutters
    >
      <>
        {/* Template 2b Green Top Header Card */}
        <Box
          sx={{
            bgcolor: "#146b3a",
            borderRadius: { xs: "18px", sm: "22px" },
            p: { xs: 2.2, sm: 3 },
            mb: 2.5,
            color: "#ffffff",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton
                onClick={() => navigate(-1)}
                sx={{
                  color: "#bfe6ce",
                  p: 0.5,
                  ml: -0.5,
                  "&:hover": {
                    color: "#ffffff",
                    bgcolor: "rgba(255,255,255,0.1)",
                  },
                }}
                aria-label="Voltar"
              >
                <ArrowBackIosNewIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <Box>
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 700,
                    fontSize: "9.5px",
                    letterSpacing: ".16em",
                    color: "#bfe6ce",
                    textTransform: "uppercase",
                  }}
                >
                  {pelada.organization_name || t("common.organization")} · FUT
                </Typography>
                <Typography
                  variant="h5"
                  component="h1"
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 800,
                    fontSize: { xs: "18px", sm: "22px" },
                    color: "#ffffff",
                    mt: 0.25,
                    letterSpacing: -0.5,
                  }}
                >
                  {t("peladas.attendance.title", "Lista de presença")}
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                bgcolor: "#bfe6ce",
                borderRadius: "7px",
                px: 1.25,
                py: 0.6,
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "9px",
                letterSpacing: ".08em",
                color: "#0d4526",
                textTransform: "uppercase",
                flexShrink: 0,
              }}
            >
              {pelada.status === "attendance"
                ? "ABERTA"
                : (pelada.status || "ABERTA").toUpperCase()}
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "flex-end",
              gap: 1.5,
              mt: 2.5,
            }}
          >
            <Typography
              sx={{
                fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "44px",
                lineHeight: 0.85,
                color: "#ffffff",
              }}
            >
              {dayNumber}
            </Typography>
            <Box sx={{ pb: 0.5 }}>
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: "13px",
                  lineHeight: 1.1,
                  color: "#ffffff",
                }}
              >
                {weekday} · {month}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 600,
                  fontSize: "12px",
                  color: "#bfe6ce",
                  mt: 0.25,
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    fontFamily: "inherit",
                    fontWeight: "inherit",
                    fontSize: "inherit",
                    color: "inherit",
                  }}
                >
                  {timeStr}
                </Typography>
                {locationStr && (
                  <>
                    <Typography
                      component="span"
                      sx={{
                        mx: 0.5,
                        fontFamily: "inherit",
                        fontWeight: "inherit",
                        fontSize: "inherit",
                        color: "inherit",
                      }}
                    >
                      ·
                    </Typography>
                    <LocationDisplay
                      location={locationStr}
                      textSx={{
                        fontFamily: "inherit",
                        fontWeight: "inherit",
                        fontSize: "inherit",
                        color: "#ffffff",
                        textDecoration: "underline",
                        textUnderlineOffset: "2px",
                      }}
                    />
                  </>
                )}
              </Box>
            </Box>
          </Box>
        </Box>

        <div data-testid="attendance-list-container">
          {/* User attendance callout card */}
          {currentPlayerAsPlayer && (
            <UserAttendanceStatus
              player={currentPlayerAsPlayer}
              isUpdating={isUpdatingSelf}
              onUpdate={(status) => handleUpdateAttendance(status)}
            />
          )}

          {/* 4-Metric Counter Grid */}
          <Box sx={{ mb: 2.5 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "1px",
                bgcolor: "#eae6db",
                border: "1.5px solid #eae6db",
                borderRadius: "14px",
                overflow: "hidden",
              }}
            >
              {/* CONFIRMADOS */}
              <Box sx={{ bgcolor: "#ffffff", p: 1.5, textAlign: "center" }}>
                <span style={{ display: "none" }}>
                  {t("peladas.attendance.status.confirmed")}
                </span>
                <Typography
                  sx={{
                    fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                    fontWeight: 700,
                    fontSize: "22px",
                    lineHeight: 1,
                    color: "#146b3a",
                  }}
                >
                  {confirmed.length}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 700,
                    fontSize: "8px",
                    letterSpacing: ".08em",
                    color: "#6b675c",
                    mt: 0.5,
                  }}
                >
                  CONFIRM.
                </Typography>
              </Box>

              {/* RECUSAS */}
              <Box sx={{ bgcolor: "#ffffff", p: 1.5, textAlign: "center" }}>
                <span style={{ display: "none" }}>
                  {t("peladas.attendance.status.declined")}
                </span>
                <Typography
                  sx={{
                    fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                    fontWeight: 700,
                    fontSize: "22px",
                    lineHeight: 1,
                    color: "#17181a",
                  }}
                >
                  {declined.length}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 700,
                    fontSize: "8px",
                    letterSpacing: ".08em",
                    color: "#6b675c",
                    mt: 0.5,
                  }}
                >
                  RECUSAS
                </Typography>
              </Box>

              {/* PENDENTES */}
              <Box sx={{ bgcolor: "#ffffff", p: 1.5, textAlign: "center" }}>
                <span style={{ display: "none" }}>
                  {t("peladas.attendance.status.pending")}
                </span>
                <Typography
                  sx={{
                    fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                    fontWeight: 700,
                    fontSize: "22px",
                    lineHeight: 1,
                    color: "#17181a",
                  }}
                >
                  {pending.length}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 700,
                    fontSize: "8px",
                    letterSpacing: ".08em",
                    color: "#6b675c",
                    mt: 0.5,
                  }}
                >
                  PENDENT.
                </Typography>
              </Box>

              {/* ESPERA */}
              <Box sx={{ bgcolor: "#ffffff", p: 1.5, textAlign: "center" }}>
                <span style={{ display: "none" }}>
                  {t("peladas.attendance.status.waitlist", "Lista de Espera")}
                </span>
                <Typography
                  sx={{
                    fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                    fontWeight: 700,
                    fontSize: "22px",
                    lineHeight: 1,
                    color: "#a8452a",
                  }}
                >
                  {waitlist.length}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 700,
                    fontSize: "8px",
                    letterSpacing: ".08em",
                    color: "#6b675c",
                    mt: 0.5,
                  }}
                >
                  ESPERA
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Confirmed List Section */}
          <Box
            sx={{
              bgcolor: "#ffffff",
              p: { xs: 2, sm: 2.5 },
              borderRadius: "18px",
              border: "1.5px solid #eae6db",
              mb: 2.5,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "9.5px",
                  letterSpacing: ".18em",
                  color: "#6b675c",
                  textTransform: "uppercase",
                }}
              >
                CONFIRMADOS · {confirmed.length}
                {maxPlayers ? ` DE ${maxPlayers}` : ""}
              </Typography>
              <Typography
                component="button"
                onClick={handleCopyList}
                sx={{
                  background: "none",
                  border: "none",
                  p: 0,
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "11px",
                  color: "#146b3a",
                  cursor: "pointer",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                {t("peladas.attendance.copy_list", "Copiar lista")}
              </Typography>
            </Box>

            {/* Green Progress Bar */}
            <Box
              sx={{
                height: 7,
                borderRadius: 4,
                bgcolor: "#eae6db",
                overflow: "hidden",
                display: "flex",
                mt: 1.2,
                mb: 1.5,
              }}
            >
              <Box
                sx={{
                  width: `${
                    maxPlayers
                      ? Math.min(
                          100,
                          Math.round((confirmed.length / maxPlayers) * 100),
                        )
                      : 0
                  }%`,
                  bgcolor: "#146b3a",
                  transition: "width 0.3s ease",
                }}
              />
            </Box>

            {/* Confirmed Players Rows */}
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              {confirmed.length === 0 ? (
                <Typography
                  sx={{
                    py: 3,
                    textAlign: "center",
                    color: "#6b675c",
                    fontFamily: "Archivo, sans-serif",
                    fontSize: "13px",
                  }}
                >
                  {t(
                    "peladas.attendance.empty_confirmed",
                    "Nenhum jogador confirmado ainda.",
                  )}
                </Typography>
              ) : (
                displayedConfirmed.map((p, idx) => {
                  const isCurrent = p.user_id === user?.id;
                  const pName = p.user?.name || "Jogador";
                  const pInitials = getInitials(pName);
                  const pos = getPositionLabel(p.user?.position);
                  const memberTag = formatMemberType(p.member_type);

                  return (
                    <Box
                      key={p.id}
                      data-testid="player-card"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        py: 1.4,
                        borderBottom:
                          idx === displayedConfirmed.length - 1 &&
                          (!showAllConfirmed || confirmed.length <= 5)
                            ? "none"
                            : "1.5px solid #f2efe7",
                      }}
                    >
                      {/* Rank Number */}
                      <Typography
                        sx={{
                          width: 18,
                          fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                          fontWeight: 700,
                          fontSize: "12px",
                          color: "#6b675c",
                          textAlign: "center",
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </Typography>

                      {/* Circle Avatar */}
                      <Box
                        sx={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          bgcolor: isCurrent ? "#c9d9cd" : "#dcd3bd",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: 800,
                          fontSize: "10px",
                          color: "#17181a",
                          flexShrink: 0,
                        }}
                      >
                        {pInitials}
                      </Box>

                      {/* Name & Position */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          data-testid="attendance-card-name"
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 800,
                            fontSize: "12.5px",
                            lineHeight: 1.2,
                            color: "#17181a",
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {pName}
                          {isCurrent && (
                            <Box
                              component="span"
                              sx={{
                                fontFamily: "Archivo, sans-serif",
                                fontWeight: 700,
                                fontSize: "9px",
                                letterSpacing: ".08em",
                                color: "#146b3a",
                                flexShrink: 0,
                              }}
                            >
                              · VOCÊ
                            </Box>
                          )}
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 600,
                            fontSize: "10.5px",
                            lineHeight: 1.3,
                            color: "#6b675c",
                          }}
                        >
                          {pos}
                        </Typography>
                      </Box>

                      {/* Member Type Pill */}
                      <Box
                        sx={{
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: 700,
                          fontSize: "9px",
                          letterSpacing: ".06em",
                          color:
                            memberTag === "MENSALISTA" ? "#17181a" : "#6b675c",
                          border: "1.5px solid #ddd8cc",
                          borderRadius: "6px",
                          px: 0.8,
                          py: 0.4,
                          flexShrink: 0,
                        }}
                      >
                        {memberTag}
                      </Box>

                      {/* Admin Actions (subtle payment/reversal/removal) */}
                      {isAnyAdmin && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateAttendance("declined")}
                            title="Remover da lista"
                            sx={{ color: "#a8452a", p: 0.25 }}
                          >
                            <HighlightOffIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                  );
                })
              )}

              {/* Expand / Collapse Button */}
              {confirmed.length > 5 && (
                <Box
                  onClick={() => setShowAllConfirmed(!showAllConfirmed)}
                  sx={{
                    textAlign: "center",
                    pt: 1.5,
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 800,
                    fontSize: "11.5px",
                    color: "#146b3a",
                    cursor: "pointer",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  {showAllConfirmed
                    ? "MOSTRAR MENOS ↑"
                    : `VER OS OUTROS ${confirmed.length - 5} →`}
                </Box>
              )}
            </Box>
          </Box>

          {/* Fila de Espera Box (Template 2b new format) */}
          <Box
            sx={{
              border: "1.5px solid #f0dbd2",
              bgcolor: "#fdf6f3",
              borderRadius: "16px",
              p: 2,
              mb: 3,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "9.5px",
                  letterSpacing: ".16em",
                  color: "#a8452a",
                  textTransform: "uppercase",
                }}
              >
                FILA DE ESPERA · {waitlist.length}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 600,
                  fontSize: "10.5px",
                  color: "#6b675c",
                }}
              >
                entram se abrir vaga
              </Typography>
            </Box>

            <Box
              sx={{
                mt: 1.5,
                display: "flex",
                flexDirection: "column",
                gap: 0.8,
              }}
            >
              {waitlist.length === 0 ? (
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 600,
                    fontSize: "11px",
                    color: "#6b675c",
                  }}
                >
                  Nenhum jogador na fila de espera.
                </Typography>
              ) : (
                waitlist.map((p, idx) => (
                  <Box
                    key={p.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      fontFamily: "Archivo, sans-serif",
                      color: "#17181a",
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "11.5px",
                        lineHeight: 1.4,
                        color: "#17181a",
                      }}
                    >
                      {idx + 1}. {p.user?.name || "Jogador"}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 600,
                        fontSize: "10.5px",
                        color: "#6b675c",
                      }}
                    >
                      ·{" "}
                      {t(`common.member_types.${p.member_type || "diarista"}`)}
                    </Typography>

                    {isAnyAdmin && (
                      <Box sx={{ ml: "auto", display: "flex", gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleUpdateAttendance("confirmed")}
                          title="Promover para confirmados"
                          sx={{ color: "#146b3a", p: 0.2 }}
                        >
                          <CheckCircleIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                ))
              )}
            </Box>
          </Box>

          {/* Admin Actions Footer */}
          {isAnyAdmin && (
            <Box
              sx={{
                bgcolor: "#f6f4ee",
                borderTop: "1.5px solid #eae6db",
                pt: 2.5,
                pb: 3,
              }}
            >
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "9px",
                  letterSpacing: ".16em",
                  color: "#6b675c",
                  mb: 1.5,
                  textTransform: "uppercase",
                }}
              >
                AÇÕES DO ADMIN
              </Typography>
              <Button
                fullWidth
                variant="contained"
                onClick={() => setIsConfirmDialogOpen(true)}
                data-testid="close-attendance-button"
                sx={{
                  bgcolor: "#17181a",
                  color: "#ffffff",
                  border: "2px solid #17181a",
                  borderRadius: "14px",
                  py: 2,
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: "14px",
                  letterSpacing: ".04em",
                  textTransform: "uppercase",
                  "&:hover": {
                    bgcolor: "#000000",
                    borderColor: "#000000",
                  },
                  transition: "all 0.15s ease",
                }}
              >
                {t(
                  "peladas.attendance.button.close_list",
                  "FECHAR LISTA E SORTEAR TIMES",
                )}
              </Button>
              <Box
                sx={{
                  textAlign: "center",
                  mt: 1.5,
                }}
              >
                <Typography
                  component="button"
                  onClick={() => {
                    const url = window.location.href;
                    const shareText = `Lista de Presença: ${pelada.organization_name || "Pelada"} - ${weekday}, ${timeStr}\n${url}`;
                    window.open(
                      `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`,
                      "_blank",
                    );
                  }}
                  sx={{
                    background: "none",
                    border: "none",
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 700,
                    fontSize: "11.5px",
                    color: "#6b675c",
                    cursor: "pointer",
                    "&:hover": {
                      color: "#146b3a",
                      textDecoration: "underline",
                    },
                  }}
                >
                  Avisar o grupo no WhatsApp
                </Typography>
              </Box>
            </Box>
          )}
        </div>
      </>

      <Dialog
        open={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        aria-labelledby="confirm-close-dialog-title"
        aria-describedby="confirm-close-dialog-description"
      >
        <DialogTitle id="confirm-close-dialog-title">
          {t("peladas.attendance.dialog.close_title")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-close-dialog-description">
            {t("peladas.attendance.dialog.close_content")}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setIsConfirmDialogOpen(false)}
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            {t("peladas.attendance.dialog.cancel")}
          </Button>
          <Button
            onClick={onConfirmClose}
            variant="contained"
            color="success"
            autoFocus
            data-testid="confirm-close-attendance-button"
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            {t("peladas.attendance.dialog.confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
