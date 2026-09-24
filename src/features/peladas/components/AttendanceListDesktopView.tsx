import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type {
  Player,
  Pelada,
  Transaction,
  User,
} from "../../../shared/api/endpoints";
import type { PlayerWithUser } from "../hooks/useAttendance";
import PeladaTabsBar from "./PeladaTabsBar";
import LocationDisplay from "../../../shared/components/LocationDisplay";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";
import { getInitials } from "../../../shared/utils/initials";

interface AttendanceListDesktopViewProps {
  pelada: Pelada;
  confirmed: PlayerWithUser[];
  waitlist: PlayerWithUser[];
  declined: PlayerWithUser[];
  pending: PlayerWithUser[];
  currentPlayerAsPlayer?: PlayerWithUser;
  currentUser?: User | null;
  isAdmin: boolean;
  onUpdateAttendance: (status: "confirmed" | "declined" | "waitlist") => void;
  onUpdatePlayerAttendance?: (
    playerId: string,
    status: "confirmed" | "declined" | "waitlist",
  ) => void;
  onCloseAttendance: () => void;
  dayNumber: number;
  weekday: string;
  month: string;
  timeStr: string;
  locationStr: string;
  maxPlayers?: number;
  peladaTransactions?: Transaction[];
  diaristaPrice?: number | null;
  onMarkPaid?: (playerId: string) => void;
  onReversePayment?: (playerId: string) => void;
}

export default function AttendanceListDesktopView({
  pelada,
  confirmed,
  waitlist,
  declined,
  pending,
  currentPlayerAsPlayer,
  currentUser,
  isAdmin,
  onUpdateAttendance,
  onUpdatePlayerAttendance,
  onCloseAttendance,
  dayNumber,
  weekday,
  month,
  timeStr,
  locationStr,
  maxPlayers,
  peladaTransactions = [],
  diaristaPrice,
  onMarkPaid,
  onReversePayment,
}: AttendanceListDesktopViewProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<
    "confirmed" | "waitlist" | "pending" | "declined"
  >("confirmed");
  const [showAll, setShowAll] = useState(false);
  const [copiedList, setCopiedList] = useState(false);

  const handleCopyList = () => {
    const targetList = activeTab === "waitlist" ? waitlist : confirmed;
    const text = targetList
      .map(
        (p, idx) =>
          `${idx + 1}. ${p.user?.name || "Jogador"} (${t(`common.member_types.${p.member_type || "diarista"}`)})`,
      )
      .join("\n");
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
      setCopiedList(true);
      setTimeout(() => setCopiedList(false), 2000);
    }
  };

  const getPositionLabel = (pos?: string) => {
    if (!pos) return "meia";
    switch (pos.toLowerCase()) {
      case "goalkeeper":
      case "goleiro":
        return "goleiro";
      case "defender":
      case "zagueiro":
        return "zagueiro";
      case "midfielder":
      case "meio-campo":
        return "meia";
      case "striker":
      case "atacante":
        return "atacante";
      default:
        return pos.toLowerCase();
    }
  };

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

  // Avatar colors rotation
  const avatarColors = [
    "#146b3a",
    "#dcd3bd",
    "#c9d9cd",
    "#d8d2c4",
    "#cfd8cd",
    "#cdd6e0",
    "#d3cfc4",
    "#e2cfc7",
  ];

  const currentList =
    activeTab === "confirmed"
      ? confirmed
      : activeTab === "waitlist"
        ? waitlist
        : activeTab === "pending"
          ? pending
          : declined;

  const displayedList = showAll ? currentList : currentList.slice(0, 7);

  // Financial calculations from real data: the diarista price comes from the
  // organization finance config and "paid" from this pelada's transactions.
  const price = diaristaPrice ?? 0;
  const paidPlayerIds = new Set(
    peladaTransactions
      .filter(
        (tx) =>
          tx.type === "income" &&
          tx.category === "diarista_fee" &&
          tx.status === "paid",
      )
      .map((tx) => tx.player_id),
  );
  const diariasInConfirmed = confirmed.filter(
    (p) =>
      p.member_type === "diarista" ||
      p.member_type === "diarista_temporario" ||
      p.member_type === "convidado",
  );
  const totalDiariasAmount = diariasInConfirmed.length * price;
  const openDiariasCount = diariasInConfirmed.filter(
    (p) => !paidPlayerIds.has(p.id),
  ).length;
  const openDiariasAmount = openDiariasCount * price;

  const handleMover = (
    player: Player,
    targetStatus: "confirmed" | "waitlist" | "declined",
  ) => {
    if (player.user_id === currentUser?.id) {
      onUpdateAttendance(targetStatus);
    } else if (onUpdatePlayerAttendance) {
      onUpdatePlayerAttendance(player.id, targetStatus);
    }
  };

  return (
    <>
      <PeladaTabsBar
        peladaId={pelada.id}
        dayStr={dayNumber}
        monthStr={month.substring(0, 3)}
        active="attendance"
        confirmedCount={confirmed.length}
        isPeladaOpen={pelada.status === "open"}
      />
      <Box
        sx={{
          width: "100%",
          maxWidth: 1124,
          mx: "auto",
          px: { xs: 2, md: 4 },
          pb: 5,
        }}
      >
        {/* 2. Header & Action CTA */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 2,
            mb: 2.5,
          }}
        >
          <Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "9.5px",
                letterSpacing: ".16em",
                color: "#6b675c",
                textTransform: "uppercase",
              }}
            >
              <Typography
                component="span"
                sx={{
                  fontFamily: "inherit",
                  fontWeight: "inherit",
                  fontSize: "inherit",
                  letterSpacing: "inherit",
                  color: "inherit",
                  textTransform: "inherit",
                }}
              >
                {pelada.organization_name || t("common.organization")} ·{" "}
                {weekday} {dayNumber}/{month.substring(0, 3)} · {timeStr}
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
                      letterSpacing: "inherit",
                      color: "#146b3a",
                      textTransform: "inherit",
                    }}
                  />
                </>
              )}
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "26px",
                color: "#17181a",
                mt: 0.8,
              }}
            >
              {t("peladas.attendance.title", "Lista de presença")}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "9.5px",
                letterSpacing: ".08em",
                color: "#ffffff",
                bgcolor: "#146b3a",
                borderRadius: "7px",
                px: 1.2,
                py: 0.8,
                textTransform: "uppercase",
              }}
            >
              {pelada.status === "attendance"
                ? "LISTA ABERTA · FECHA EM 2 DIAS"
                : (pelada.status || "ABERTA").toUpperCase()}
            </Box>
            {isAdmin && (
              <Box
                component="button"
                onClick={onCloseAttendance}
                sx={{
                  borderRadius: "11px",
                  bgcolor: "#17181a",
                  px: 2,
                  py: 1.4,
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: "11px",
                  letterSpacing: ".04em",
                  color: "#ffffff",
                  cursor: "pointer",
                  border: "none",
                  "&:hover": { bgcolor: "#000000" },
                }}
              >
                FECHAR LISTA E SORTEAR
              </Box>
            )}
          </Box>
        </Box>

        {/* 3. SUA RESPOSTA Card (5b) */}
        {currentPlayerAsPlayer && (
          <Box
            sx={{
              bgcolor: "background.paper",
              border: (theme) =>
                theme.palette.mode === "dark"
                  ? "1px solid rgba(255,255,255,0.12)"
                  : "2px solid #17181a",
              borderRadius: "18px",
              boxShadow: (theme) =>
                theme.palette.mode === "dark"
                  ? "0 4px 20px rgba(0,0,0,0.5)"
                  : "5px 5px 0 #17181a",
              p: "16px 20px",
              mb: 3,
              display: "flex",
              alignItems: "center",
              gap: 2.2,
            }}
          >
            <SecureAvatar
              userId={currentUser?.id}
              filename={currentUser?.avatar_filename}
              fallbackText={getInitials(currentUser?.name)}
              sx={{
                width: 44,
                height: 44,
                bgcolor: "#146b3a",
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "13px",
                color: "#ffffff",
                flexShrink: 0,
              }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "9px",
                  letterSpacing: ".14em",
                  color: "text.secondary",
                }}
              >
                SUA RESPOSTA
              </Typography>
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: "17px",
                  color: "text.primary",
                  mt: 0.5,
                }}
              >
                {currentPlayerAsPlayer.attendance_status === "confirmed"
                  ? `Você está confirmado · ${getPositionLabel(currentUser?.position)} · ${formatMemberType(currentPlayerAsPlayer.member_type).toLowerCase()}`
                  : currentPlayerAsPlayer.attendance_status === "waitlist"
                    ? `Você está na fila de espera · ${getPositionLabel(currentUser?.position)} · ${formatMemberType(currentPlayerAsPlayer.member_type).toLowerCase()}`
                    : currentPlayerAsPlayer.attendance_status === "declined"
                      ? "Você informou que não vai jogar nesta pelada"
                      : "Você ainda não respondeu se vai jogar"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
              <Box
                component="button"
                onClick={() => onUpdateAttendance("confirmed")}
                sx={{
                  border: (theme) =>
                    currentPlayerAsPlayer.attendance_status === "confirmed"
                      ? "2px solid #146b3a"
                      : theme.palette.mode === "dark"
                        ? "1px solid rgba(255,255,255,0.15)"
                        : "1.5px solid #ddd8cc",
                  bgcolor: (theme) =>
                    currentPlayerAsPlayer.attendance_status === "confirmed"
                      ? theme.palette.mode === "dark"
                        ? "rgba(20, 107, 58, 0.25)"
                        : "#f4f8f5"
                      : "background.paper",
                  color:
                    currentPlayerAsPlayer.attendance_status === "confirmed"
                      ? "#146b3a"
                      : "text.secondary",
                  borderRadius: "12px",
                  p: "11px 15px",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight:
                    currentPlayerAsPlayer.attendance_status === "confirmed"
                      ? 800
                      : 700,
                  fontSize: "11.5px",
                  letterSpacing: ".04em",
                  cursor: "pointer",
                  "&:hover": { borderColor: "#146b3a" },
                }}
              >
                VOU JOGAR
              </Box>
              <Box
                component="button"
                onClick={() => onUpdateAttendance("waitlist")}
                sx={{
                  border: (theme) =>
                    currentPlayerAsPlayer.attendance_status === "waitlist"
                      ? "2px solid #a8452a"
                      : theme.palette.mode === "dark"
                        ? "1px solid rgba(255,255,255,0.15)"
                        : "1.5px solid #ddd8cc",
                  bgcolor: (theme) =>
                    currentPlayerAsPlayer.attendance_status === "waitlist"
                      ? theme.palette.mode === "dark"
                        ? "rgba(168, 69, 42, 0.25)"
                        : "#fdf6f3"
                      : "background.paper",
                  color:
                    currentPlayerAsPlayer.attendance_status === "waitlist"
                      ? "#a8452a"
                      : "text.secondary",
                  borderRadius: "12px",
                  p: "11px 15px",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight:
                    currentPlayerAsPlayer.attendance_status === "waitlist"
                      ? 800
                      : 700,
                  fontSize: "11.5px",
                  letterSpacing: ".04em",
                  cursor: "pointer",
                  "&:hover": { borderColor: "#a8452a" },
                }}
              >
                FILA DE ESPERA
              </Box>
              <Box
                component="button"
                onClick={() => onUpdateAttendance("declined")}
                sx={{
                  border: (theme) =>
                    currentPlayerAsPlayer.attendance_status === "declined"
                      ? theme.palette.mode === "dark"
                        ? "2px solid #f6f4ee"
                        : "2px solid #17181a"
                      : theme.palette.mode === "dark"
                        ? "1px solid rgba(255,255,255,0.15)"
                        : "1.5px solid #ddd8cc",
                  bgcolor: (theme) =>
                    currentPlayerAsPlayer.attendance_status === "declined"
                      ? theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.1)"
                        : "#f6f4ee"
                      : "background.paper",
                  color:
                    currentPlayerAsPlayer.attendance_status === "declined"
                      ? "text.primary"
                      : "text.secondary",
                  borderRadius: "12px",
                  p: "11px 15px",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight:
                    currentPlayerAsPlayer.attendance_status === "declined"
                      ? 800
                      : 700,
                  fontSize: "11.5px",
                  letterSpacing: ".04em",
                  cursor: "pointer",
                  "&:hover": { borderColor: "#17181a" },
                }}
              >
                NÃO VOU
              </Box>
            </Box>
          </Box>
        )}

        {/* 4. Two-column Layout */}
        <Box sx={{ display: "flex", gap: 2.5, alignItems: "flex-start" }}>
          {/* Left column: 4 Tabs + Table */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Tabs */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1.5px solid #ddd8cc",
                mb: 0,
              }}
            >
              <Box sx={{ display: "flex" }}>
                <Box
                  onClick={() => setActiveTab("confirmed")}
                  sx={{
                    p: "11px 16px",
                    borderBottom:
                      activeTab === "confirmed" ? "3px solid #17181a" : "none",
                    mb: activeTab === "confirmed" ? "-1.5px" : 0,
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: activeTab === "confirmed" ? 800 : 700,
                    fontSize: "12px",
                    letterSpacing: ".04em",
                    color: activeTab === "confirmed" ? "#17181a" : "#6b675c",
                    cursor: "pointer",
                  }}
                >
                  CONFIRMADOS{" "}
                  <Box component="span" sx={{ color: "#146b3a" }}>
                    {confirmed.length}
                  </Box>
                </Box>
                <Box
                  onClick={() => setActiveTab("waitlist")}
                  sx={{
                    p: "11px 16px",
                    borderBottom:
                      activeTab === "waitlist" ? "3px solid #17181a" : "none",
                    mb: activeTab === "waitlist" ? "-1.5px" : 0,
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: activeTab === "waitlist" ? 800 : 700,
                    fontSize: "12px",
                    letterSpacing: ".04em",
                    color: activeTab === "waitlist" ? "#17181a" : "#6b675c",
                    cursor: "pointer",
                  }}
                >
                  FILA DE ESPERA{" "}
                  <Box component="span" sx={{ color: "#a8452a" }}>
                    {waitlist.length}
                  </Box>
                </Box>
                <Box
                  onClick={() => setActiveTab("pending")}
                  sx={{
                    p: "11px 16px",
                    borderBottom:
                      activeTab === "pending" ? "3px solid #17181a" : "none",
                    mb: activeTab === "pending" ? "-1.5px" : 0,
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: activeTab === "pending" ? 800 : 700,
                    fontSize: "12px",
                    letterSpacing: ".04em",
                    color: activeTab === "pending" ? "#17181a" : "#6b675c",
                    cursor: "pointer",
                  }}
                >
                  PENDENTES{" "}
                  <Box component="span" sx={{ color: "#a8452a" }}>
                    {pending.length}
                  </Box>
                </Box>
                <Box
                  onClick={() => setActiveTab("declined")}
                  sx={{
                    p: "11px 16px",
                    borderBottom:
                      activeTab === "declined" ? "3px solid #17181a" : "none",
                    mb: activeTab === "declined" ? "-1.5px" : 0,
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: activeTab === "declined" ? 800 : 700,
                    fontSize: "12px",
                    letterSpacing: ".04em",
                    color: activeTab === "declined" ? "#17181a" : "#6b675c",
                    cursor: "pointer",
                  }}
                >
                  RECUSARAM {declined.length}
                </Box>
              </Box>

              <Box
                component="button"
                onClick={handleCopyList}
                sx={{
                  background: "none",
                  border: "none",
                  p: "6px 12px",
                  mr: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.75,
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "11px",
                  letterSpacing: ".04em",
                  color: "#146b3a",
                  cursor: "pointer",
                  borderRadius: "6px",
                  transition: "background-color 0.15s ease",
                  "&:hover": {
                    bgcolor: "rgba(20, 107, 58, 0.08)",
                    textDecoration: "underline",
                  },
                }}
              >
                <ContentCopyIcon sx={{ fontSize: "14px" }} />
                {copiedList
                  ? t("common.copied", "Copiado!")
                  : t("peladas.attendance.copy_list", "Copiar lista")}
              </Box>
            </Box>

            {/* Table Container */}
            <Box
              sx={{
                bgcolor: "background.paper",
                border: 1,
                borderColor: "divider",
                borderTop: 0,
                borderRadius: "0 0 16px 16px",
                overflow: "hidden",
              }}
            >
              {/* Table Header */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.8,
                  p: "10px 18px",
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.04)"
                      : "#f6f4ee",
                  borderBottom: 1,
                  borderColor: "divider",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "8.5px",
                  letterSpacing: ".14em",
                  color: "text.secondary",
                }}
              >
                <Box sx={{ width: 22, flexShrink: 0 }}>#</Box>
                <Box sx={{ flex: 1 }}>JOGADOR</Box>
                <Box sx={{ width: 104, flexShrink: 0 }}>TIPO</Box>
                <Box sx={{ width: 104, flexShrink: 0 }}>PAGAMENTO</Box>
                <Box sx={{ width: 120, flexShrink: 0, textAlign: "right" }}>
                  MOVER PARA
                </Box>
              </Box>

              {/* Table Rows */}
              {currentList.length === 0 ? (
                <Box
                  sx={{ p: 4, textAlign: "center", color: "text.secondary" }}
                >
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    Nenhum jogador nesta lista.
                  </Typography>
                </Box>
              ) : (
                displayedList.map((player, idx) => {
                  const isCurrent = player.user_id === currentUser?.id;
                  const pName = player.user?.name || "Jogador";
                  const pInitials = getInitials(pName);
                  const pos = getPositionLabel(player.user?.position);
                  const memberTag = formatMemberType(player.member_type);
                  const isMensalista = memberTag === "MENSALISTA";
                  const avatarBg =
                    avatarColors[
                      (idx + (isCurrent ? 0 : 1)) % avatarColors.length
                    ];

                  return (
                    <Box
                      key={player.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.8,
                        p: "11px 18px",
                        bgcolor: (theme) =>
                          isCurrent
                            ? theme.palette.mode === "dark"
                              ? "rgba(20, 107, 58, 0.2)"
                              : "#f4f8f5"
                            : "background.paper",
                        borderBottom: 1,
                        borderColor: "divider",
                        borderLeft: isCurrent ? "4px solid #146b3a" : "none",
                      }}
                    >
                      <Box
                        sx={{
                          width: 22,
                          flexShrink: 0,
                          fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                          fontWeight: 700,
                          fontSize: "13px",
                          color: isCurrent ? "#146b3a" : "text.secondary",
                        }}
                      >
                        {idx + 1}
                      </Box>
                      <Box
                        sx={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 1.4,
                          minWidth: 0,
                        }}
                      >
                        <SecureAvatar
                          userId={player.user_id}
                          filename={
                            player.user?.avatar_filename ||
                            player.user_avatar_filename
                          }
                          fallbackText={pInitials}
                          sx={{
                            width: 30,
                            height: 30,
                            bgcolor: avatarBg,
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 800,
                            fontSize: "10px",
                            color: avatarBg === "#146b3a" ? "#fff" : "#17181a",
                            flexShrink: 0,
                          }}
                        />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontFamily: "Archivo, sans-serif",
                              fontWeight: 800,
                              fontSize: "12.5px",
                              lineHeight: 1.2,
                              color: "text.primary",
                              display: "flex",
                              alignItems: "center",
                              gap: 0.6,
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
                              mt: 0.3,
                            }}
                          >
                            {pos}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Member Type */}
                      <Box sx={{ width: 104, flexShrink: 0 }}>
                        <Box
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 800,
                            fontSize: "9px",
                            letterSpacing: ".08em",
                            color: isMensalista ? "#146b3a" : "#6b675c",
                            border: isMensalista
                              ? "1.5px solid #146b3a"
                              : "1.5px solid #ddd8cc",
                            borderRadius: "6px",
                            p: "4px 6px",
                            display: "inline-block",
                          }}
                        >
                          {memberTag}
                        </Box>
                      </Box>

                      {/* Payment Column */}
                      <Box sx={{ width: 104, flexShrink: 0 }}>
                        {isMensalista ? (
                          <Typography
                            sx={{
                              fontFamily: "Archivo, sans-serif",
                              fontWeight: 600,
                              fontSize: "11.5px",
                              color: "#6b675c",
                            }}
                          >
                            em dia
                          </Typography>
                        ) : paidPlayerIds.has(player.id) ? (
                          <Box
                            component="button"
                            onClick={() => onReversePayment?.(player.id)}
                            title="Desfazer pagamento"
                            sx={{
                              fontFamily: "Archivo, sans-serif",
                              fontWeight: 700,
                              fontSize: "11.5px",
                              color: "#146b3a",
                              bgcolor: "transparent",
                              border: "none",
                              p: 0,
                              cursor: onReversePayment ? "pointer" : "default",
                            }}
                          >
                            pago ✓
                          </Box>
                        ) : (
                          <Box
                            component="button"
                            onClick={() => onMarkPaid?.(player.id)}
                            title="Marcar diária como paga"
                            sx={{
                              fontFamily: "Archivo, sans-serif",
                              fontWeight: 800,
                              fontSize: "9.5px",
                              letterSpacing: ".06em",
                              color: "#ffffff",
                              bgcolor: "#a8452a",
                              borderRadius: "7px",
                              p: "6px 8px",
                              border: "none",
                              cursor: onMarkPaid ? "pointer" : "default",
                              "&:hover": { opacity: 0.9 },
                            }}
                          >
                            R$ {price} · COBRAR
                          </Box>
                        )}
                      </Box>

                      {/* Actions: Mover Para */}
                      <Box
                        sx={{
                          width: 120,
                          flexShrink: 0,
                          display: "flex",
                          gap: 0.8,
                          justifyContent: "flex-end",
                        }}
                      >
                        {activeTab === "confirmed" && (
                          <>
                            <Box
                              component="button"
                              onClick={() => handleMover(player, "waitlist")}
                              sx={{
                                fontFamily: "Archivo, sans-serif",
                                fontWeight: 700,
                                fontSize: "9.5px",
                                letterSpacing: ".06em",
                                color: "#6b675c",
                                border: "1.5px solid #ddd8cc",
                                borderRadius: "7px",
                                p: "6px 8px",
                                bgcolor: "#fff",
                                cursor: "pointer",
                                "&:hover": { borderColor: "#17181a" },
                              }}
                            >
                              FILA
                            </Box>
                            <Box
                              component="button"
                              onClick={() => handleMover(player, "declined")}
                              sx={{
                                fontFamily: "Archivo, sans-serif",
                                fontWeight: 700,
                                fontSize: "9.5px",
                                letterSpacing: ".06em",
                                color: "#6b675c",
                                border: "1.5px solid #ddd8cc",
                                borderRadius: "7px",
                                p: "6px 8px",
                                bgcolor: "#fff",
                                cursor: "pointer",
                                "&:hover": {
                                  borderColor: "#a8452a",
                                  color: "#a8452a",
                                },
                              }}
                            >
                              FORA
                            </Box>
                          </>
                        )}
                        {activeTab === "waitlist" && (
                          <>
                            <Box
                              component="button"
                              onClick={() => handleMover(player, "confirmed")}
                              sx={{
                                fontFamily: "Archivo, sans-serif",
                                fontWeight: 800,
                                fontSize: "9.5px",
                                letterSpacing: ".06em",
                                color: "#146b3a",
                                border: "1.5px solid #146b3a",
                                borderRadius: "7px",
                                p: "6px 8px",
                                bgcolor: "#fff",
                                cursor: "pointer",
                                "&:hover": { bgcolor: "#f4f8f5" },
                              }}
                            >
                              SUBIR
                            </Box>
                            <Box
                              component="button"
                              onClick={() => handleMover(player, "declined")}
                              sx={{
                                fontFamily: "Archivo, sans-serif",
                                fontWeight: 700,
                                fontSize: "9.5px",
                                letterSpacing: ".06em",
                                color: "#6b675c",
                                border: "1.5px solid #ddd8cc",
                                borderRadius: "7px",
                                p: "6px 8px",
                                bgcolor: "#fff",
                                cursor: "pointer",
                                "&:hover": {
                                  borderColor: "#a8452a",
                                  color: "#a8452a",
                                },
                              }}
                            >
                              FORA
                            </Box>
                          </>
                        )}
                        {activeTab === "pending" && (
                          <>
                            <Box
                              component="button"
                              onClick={() => handleMover(player, "confirmed")}
                              sx={{
                                fontFamily: "Archivo, sans-serif",
                                fontWeight: 800,
                                fontSize: "9.5px",
                                letterSpacing: ".06em",
                                color: "#146b3a",
                                border: "1.5px solid #146b3a",
                                borderRadius: "7px",
                                p: "6px 8px",
                                bgcolor: "#fff",
                                cursor: "pointer",
                                "&:hover": { bgcolor: "#f4f8f5" },
                              }}
                            >
                              VOU
                            </Box>
                            <Box
                              component="button"
                              onClick={() => handleMover(player, "declined")}
                              sx={{
                                fontFamily: "Archivo, sans-serif",
                                fontWeight: 700,
                                fontSize: "9.5px",
                                letterSpacing: ".06em",
                                color: "#6b675c",
                                border: "1.5px solid #ddd8cc",
                                borderRadius: "7px",
                                p: "6px 8px",
                                bgcolor: "#fff",
                                cursor: "pointer",
                                "&:hover": {
                                  borderColor: "#a8452a",
                                  color: "#a8452a",
                                },
                              }}
                            >
                              FORA
                            </Box>
                          </>
                        )}
                        {activeTab === "declined" && (
                          <>
                            <Box
                              component="button"
                              onClick={() => handleMover(player, "confirmed")}
                              sx={{
                                fontFamily: "Archivo, sans-serif",
                                fontWeight: 800,
                                fontSize: "9.5px",
                                letterSpacing: ".06em",
                                color: "#146b3a",
                                border: "1.5px solid #146b3a",
                                borderRadius: "7px",
                                p: "6px 8px",
                                bgcolor: "#fff",
                                cursor: "pointer",
                                "&:hover": { bgcolor: "#f4f8f5" },
                              }}
                            >
                              VOU
                            </Box>
                            <Box
                              component="button"
                              onClick={() => handleMover(player, "waitlist")}
                              sx={{
                                fontFamily: "Archivo, sans-serif",
                                fontWeight: 700,
                                fontSize: "9.5px",
                                letterSpacing: ".06em",
                                color: "#6b675c",
                                border: "1.5px solid #ddd8cc",
                                borderRadius: "7px",
                                p: "6px 8px",
                                bgcolor: "#fff",
                                cursor: "pointer",
                                "&:hover": { borderColor: "#17181a" },
                              }}
                            >
                              FILA
                            </Box>
                          </>
                        )}
                      </Box>
                    </Box>
                  );
                })
              )}

              {/* Table Footer */}
              {currentList.length > 7 && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: "13px 18px",
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.04)"
                        : "#f6f4ee",
                    borderTop: 1,
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 600,
                      fontSize: "11.5px",
                      color: "text.secondary",
                    }}
                  >
                    1–{Math.min(displayedList.length, currentList.length)} de{" "}
                    {currentList.length} {activeTab}
                  </Typography>
                  <Box
                    component="button"
                    onClick={() => setShowAll(!showAll)}
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 700,
                      fontSize: "11.5px",
                      color: "#146b3a",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    {showAll ? "Ver menos ↑" : "Ver todos →"}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>

          {/* Right column (298px) */}
          <Box sx={{ width: 298, flexShrink: 0 }}>
            {/* Vagas card */}
            <Box
              sx={{
                bgcolor: "background.paper",
                border: 1,
                borderColor: "divider",
                borderRadius: "16px",
                p: 2,
              }}
            >
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "9.5px",
                  letterSpacing: ".16em",
                  color: "text.secondary",
                }}
              >
                VAGAS
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 1.2,
                  mt: 1.5,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                    fontWeight: 700,
                    fontSize: "44px",
                    lineHeight: 0.85,
                    color: "text.primary",
                  }}
                >
                  {confirmed.length}
                </Typography>
                <Typography
                  sx={{
                    pb: 0.5,
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 700,
                    fontSize: "13px",
                    color: "text.secondary",
                  }}
                >
                  {maxPlayers ? `de ${maxPlayers}` : ""}
                </Typography>
              </Box>
              <Box
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "#eae6db",
                  overflow: "hidden",
                  display: "flex",
                  mt: 1.5,
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
                  }}
                />
              </Box>
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 600,
                  fontSize: "11.5px",
                  lineHeight: 1.45,
                  color: "text.secondary",
                  mt: 1.4,
                }}
              >
                {maxPlayers
                  ? `${Math.max(0, maxPlayers - confirmed.length)} vagas abertas · `
                  : ""}
                {waitlist.length} na fila de espera entram automaticamente se
                alguém sair.
              </Typography>
            </Box>

            {/* Fila de espera card */}
            <Box
              sx={{
                bgcolor: "background.paper",
                border: 1,
                borderColor: "divider",
                borderRadius: "16px",
                overflow: "hidden",
                mt: 1.8,
              }}
            >
              <Box
                sx={{
                  p: "12px 15px",
                  borderBottom: 1,
                  borderColor: "divider",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "9.5px",
                  letterSpacing: ".16em",
                  color: "text.secondary",
                }}
              >
                FILA DE ESPERA · {waitlist.length}
              </Box>
              {waitlist.length === 0 ? (
                <Box
                  sx={{ p: 2, textAlign: "center", color: "text.secondary" }}
                >
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontSize: "11.5px",
                      fontWeight: 600,
                    }}
                  >
                    Fila vazia no momento.
                  </Typography>
                </Box>
              ) : (
                waitlist.slice(0, 3).map((wPlayer, wIdx) => {
                  const wName = wPlayer.user?.name || "Jogador";
                  const wInitials = getInitials(wName);
                  return (
                    <Box
                      key={wPlayer.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.4,
                        p: "12px 15px",
                        borderBottom:
                          wIdx < Math.min(waitlist.length, 3) - 1 ? 1 : "none",
                        borderColor: "divider",
                      }}
                    >
                      <Box
                        sx={{
                          width: 22,
                          fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                          fontWeight: 700,
                          fontSize: "13px",
                          color: "#a8452a",
                          flexShrink: 0,
                        }}
                      >
                        {wIdx + 1}
                      </Box>
                      <SecureAvatar
                        userId={wPlayer.user_id}
                        filename={
                          wPlayer.user?.avatar_filename ||
                          wPlayer.user_avatar_filename
                        }
                        fallbackText={wInitials}
                        sx={{
                          width: 28,
                          height: 28,
                          bgcolor: "#e2cfc7",
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: 800,
                          fontSize: "9.5px",
                          color: "#17181a",
                          flexShrink: 0,
                        }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 700,
                            fontSize: "12px",
                            lineHeight: 1.2,
                            color: "text.primary",
                          }}
                        >
                          {wName}
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 600,
                            fontSize: "10.5px",
                            color: "text.secondary",
                            mt: 0.2,
                          }}
                        >
                          {formatMemberType(wPlayer.member_type).toLowerCase()}
                        </Typography>
                      </Box>
                      <Box
                        component="button"
                        onClick={() => handleMover(wPlayer, "confirmed")}
                        sx={{
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: 800,
                          fontSize: "9.5px",
                          letterSpacing: ".06em",
                          color: "#146b3a",
                          border: "1.5px solid #146b3a",
                          borderRadius: "7px",
                          p: "6px 7px",
                          bgcolor: (theme) =>
                            theme.palette.mode === "dark"
                              ? "background.paper"
                              : "#fff",
                          cursor: "pointer",
                          "&:hover": {
                            bgcolor: (theme) =>
                              theme.palette.mode === "dark"
                                ? "rgba(20, 107, 58, 0.15)"
                                : "#f4f8f5",
                          },
                        }}
                      >
                        SUBIR
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>

            {/* Diárias desta pelada card */}
            <Box
              sx={{
                bgcolor: "background.paper",
                border: 1,
                borderColor: "divider",
                borderRadius: "16px",
                p: 2,
                mt: 1.8,
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
                    letterSpacing: ".16em",
                    color: "text.secondary",
                  }}
                >
                  DIÁRIAS DESTA PELADA
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 700,
                    fontSize: "11px",
                    color: "#a8452a",
                  }}
                >
                  {openDiariasCount} em aberto
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 1.2,
                  mt: 1.5,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                    fontWeight: 700,
                    fontSize: "34px",
                    lineHeight: 0.9,
                    color: "#a8452a",
                  }}
                >
                  R$ {openDiariasAmount}
                </Typography>
                <Typography
                  sx={{
                    pb: 0.5,
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 600,
                    fontSize: "11.5px",
                    lineHeight: 1.3,
                    color: "text.secondary",
                  }}
                >
                  de R$ {totalDiariasAmount}
                  <br />
                  previstos
                </Typography>
              </Box>
              <Box
                component="button"
                onClick={() => {
                  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `Cobrança de diárias da pelada ${pelada.organization_name || ""}: R$ ${openDiariasAmount} em aberto.`,
                  )}`;
                  window.open(url, "_blank");
                }}
                sx={{
                  width: "100%",
                  border: (theme) =>
                    theme.palette.mode === "dark"
                      ? "1.5px solid rgba(255,255,255,0.2)"
                      : "1.5px solid #17181a",
                  borderRadius: "12px",
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "background.paper"
                      : "#ffffff",
                  color: (theme) =>
                    theme.palette.mode === "dark" ? "text.primary" : "#17181a",
                  py: 1.4,
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: "11.5px",
                  letterSpacing: ".06em",
                  cursor: "pointer",
                  mt: 1.8,
                  "&:hover": {
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.06)"
                        : "#f6f4ee",
                  },
                }}
              >
                COBRAR OS {openDiariasCount} NO ZAP
              </Box>
            </Box>

            {/* Pendentes card */}
            <Box
              sx={{
                bgcolor: "#17181a",
                borderRadius: "16px",
                p: 2,
                mt: 1.8,
              }}
            >
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "9.5px",
                  letterSpacing: ".16em",
                  color: "#9a958a",
                }}
              >
                PENDENTES · {pending.length}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 600,
                  fontSize: "12px",
                  lineHeight: 1.5,
                  color: "#f6f4ee",
                  mt: 1.4,
                }}
              >
                {pending.length} mensalistas ainda não responderam. Um lembrete
                no grupo costuma resolver antes de fechar a lista.
              </Typography>
              <Box
                component="button"
                onClick={() => {
                  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `Lembrete: ${pending.length} jogadores ainda não confirmaram presença na pelada de ${weekday} ${dayNumber}. Confirme sua presença pelo app!`,
                  )}`;
                  window.open(url, "_blank");
                }}
                sx={{
                  width: "100%",
                  border: "none",
                  borderRadius: "12px",
                  bgcolor: "#f2a100",
                  color: "#17181a",
                  py: 1.5,
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: "11.5px",
                  letterSpacing: ".06em",
                  cursor: "pointer",
                  mt: 1.8,
                  "&:hover": { opacity: 0.9 },
                }}
              >
                LEMBRAR OS {pending.length}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}
