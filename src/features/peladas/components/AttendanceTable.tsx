import { useState, useMemo } from "react";
import { Box, Typography } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useTranslation } from "react-i18next";
import type { Player, User } from "../../../shared/api/endpoints";
import type { PlayerWithUser } from "../hooks/useAttendance";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";
import {
  isMensalista,
  formatPosition,
  getPlayerAvatarProps,
} from "../utils/playerUtils";
import { copyToClipboard } from "../utils/exportUtils";
import { useCopyFeedback } from "../../../shared/hooks/useCopyFeedback";

interface AttendanceTableProps {
  confirmed: PlayerWithUser[];
  waitlist: PlayerWithUser[];
  declined: PlayerWithUser[];
  pending: PlayerWithUser[];
  currentUser?: User | null;
  isAdmin: boolean;
  paidPlayerIds: Set<string>;
  price: number;
  formatMemberType: (type?: string) => string;
  onMarkPaid?: (playerId: string) => void;
  onReversePayment?: (playerId: string) => void;
  handleMover: (
    player: Player,
    targetStatus: "confirmed" | "waitlist" | "declined",
  ) => void;
}

export function AttendanceTable({
  confirmed,
  waitlist,
  declined,
  pending,
  currentUser,
  isAdmin,
  paidPlayerIds,
  price,
  formatMemberType,
  onMarkPaid,
  onReversePayment,
  handleMover,
}: AttendanceTableProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<
    "confirmed" | "waitlist" | "pending" | "declined"
  >("confirmed");
  const [showAll, setShowAll] = useState(false);

  const { copied: copiedList, triggerCopy: handleCopyList } = useCopyFeedback(
    () => {
      const targetList = activeTab === "waitlist" ? waitlist : confirmed;
      const text = targetList
        .map(
          (p, idx) =>
            `${idx + 1}. ${p.user?.name || "Jogador"} (${t(`common.member_types.${p.member_type || "diarista"}`)})`,
        )
        .join("\n");
      return copyToClipboard(text);
    },
    2000,
  );

  const currentList = useMemo(() => {
    switch (activeTab) {
      case "confirmed":
        return confirmed;
      case "waitlist":
        return waitlist;
      case "pending":
        return pending;
      case "declined":
        return declined;
      default:
        return confirmed;
    }
  }, [activeTab, confirmed, waitlist, pending, declined]);

  const displayedList = useMemo(
    () => (showAll ? currentList : currentList.slice(0, 7)),
    [showAll, currentList],
  );

  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      {/* Tabs */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1.5px solid",
          borderColor: "divider",
          mb: 0,
        }}
      >
        <Box sx={{ display: "flex" }} role="tablist">
          <Box
            role="tab"
            aria-selected={activeTab === "confirmed"}
            data-testid="attendance-tab-confirmed"
            onClick={() => setActiveTab("confirmed")}
            sx={{
              p: "11px 16px",
              borderBottom: activeTab === "confirmed" ? "3px solid" : "none",
              borderBottomColor:
                activeTab === "confirmed" ? "text.primary" : "transparent",
              mb: activeTab === "confirmed" ? "-1.5px" : 0,
              fontFamily: "Archivo, sans-serif",
              fontWeight: activeTab === "confirmed" ? 800 : 700,
              fontSize: "12px",
              letterSpacing: ".04em",
              color:
                activeTab === "confirmed" ? "text.primary" : "text.secondary",
              cursor: "pointer",
              "&:hover": { color: "text.primary" },
            }}
          >
            {t("peladas.attendance.desktop.confirmed", "CONFIRMADOS")}{" "}
            <Box component="span" sx={{ color: "primary.main" }}>
              {confirmed.length}
            </Box>
          </Box>
          <Box
            role="tab"
            aria-selected={activeTab === "waitlist"}
            data-testid="attendance-tab-waitlist"
            onClick={() => setActiveTab("waitlist")}
            sx={{
              p: "11px 16px",
              borderBottom: activeTab === "waitlist" ? "3px solid" : "none",
              borderBottomColor:
                activeTab === "waitlist" ? "text.primary" : "transparent",
              mb: activeTab === "waitlist" ? "-1.5px" : 0,
              fontFamily: "Archivo, sans-serif",
              fontWeight: activeTab === "waitlist" ? 800 : 700,
              fontSize: "12px",
              letterSpacing: ".04em",
              color:
                activeTab === "waitlist" ? "text.primary" : "text.secondary",
              cursor: "pointer",
              "&:hover": { color: "text.primary" },
            }}
          >
            {t("peladas.attendance.desktop.waitlist", "FILA DE ESPERA")}{" "}
            <Box component="span" sx={{ color: "secondary.main" }}>
              {waitlist.length}
            </Box>
          </Box>
          <Box
            role="tab"
            aria-selected={activeTab === "pending"}
            data-testid="attendance-tab-pending"
            onClick={() => setActiveTab("pending")}
            sx={{
              p: "11px 16px",
              borderBottom: activeTab === "pending" ? "3px solid" : "none",
              borderBottomColor:
                activeTab === "pending" ? "text.primary" : "transparent",
              mb: activeTab === "pending" ? "-1.5px" : 0,
              fontFamily: "Archivo, sans-serif",
              fontWeight: activeTab === "pending" ? 800 : 700,
              fontSize: "12px",
              letterSpacing: ".04em",
              color:
                activeTab === "pending" ? "text.primary" : "text.secondary",
              cursor: "pointer",
              "&:hover": { color: "text.primary" },
            }}
          >
            {t("peladas.attendance.desktop.pending", "PENDENTES")}{" "}
            <Box component="span" sx={{ color: "secondary.main" }}>
              {pending.length}
            </Box>
          </Box>
          <Box
            role="tab"
            aria-selected={activeTab === "declined"}
            data-testid="attendance-tab-declined"
            onClick={() => setActiveTab("declined")}
            sx={{
              p: "11px 16px",
              borderBottom: activeTab === "declined" ? "3px solid" : "none",
              borderBottomColor:
                activeTab === "declined" ? "text.primary" : "transparent",
              mb: activeTab === "declined" ? "-1.5px" : 0,
              fontFamily: "Archivo, sans-serif",
              fontWeight: activeTab === "declined" ? 800 : 700,
              fontSize: "12px",
              letterSpacing: ".04em",
              color:
                activeTab === "declined" ? "text.primary" : "text.secondary",
              cursor: "pointer",
              "&:hover": { color: "text.primary" },
            }}
          >
            {t("peladas.attendance.desktop.declined", "RECUSARAM")}{" "}
            {declined.length}
          </Box>
        </Box>

        <Box
          component="button"
          onClick={handleCopyList}
          data-testid="copy-players-button"
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
            color: "primary.main",
            cursor: "pointer",
            borderRadius: "6px",
            transition: "background-color 0.15s ease",
            "&:hover": {
              bgcolor: "action.hover",
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
            bgcolor: "action.hover",
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
          <Box sx={{ flex: 1 }}>
            {t("peladas.attendance.desktop.player_col", "JOGADOR")}
          </Box>
          <Box sx={{ width: 104, flexShrink: 0 }}>
            {t("peladas.attendance.desktop.type_col", "TIPO")}
          </Box>
          <Box sx={{ width: 104, flexShrink: 0 }}>
            {t("peladas.attendance.desktop.payment_col", "PAGAMENTO")}
          </Box>
          {isAdmin && (
            <Box sx={{ width: 120, flexShrink: 0, textAlign: "right" }}>
              {t("peladas.attendance.desktop.move_to_col", "MOVER PARA")}
            </Box>
          )}
        </Box>

        {/* Table Rows */}
        {currentList.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              {t(
                "peladas.attendance.desktop.empty_list",
                "Nenhum jogador nesta lista.",
              )}
            </Typography>
          </Box>
        ) : (
          displayedList.map((player, idx) => {
            const isCurrent = player.user_id === currentUser?.id;
            const pName = player.user?.name || t("common.player", "Jogador");
            const pos = formatPosition(player.user?.position);
            const memberTag = formatMemberType(player.member_type);
            const isMensalistaPlayer = isMensalista(player.member_type);

            return (
              <Box
                key={player.id}
                data-testid={`attendance-card-${player.user?.username || player.user_id}`}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.8,
                  p: "11px 18px",
                  bgcolor: (theme) =>
                    isCurrent
                      ? theme.palette.status?.paid?.bg || "action.hover"
                      : "background.paper",
                  borderBottom: 1,
                  borderColor: "divider",
                  borderLeft: (theme) =>
                    isCurrent
                      ? `4px solid ${theme.palette.primary.main}`
                      : "none",
                }}
              >
                <Box
                  sx={{
                    width: 22,
                    flexShrink: 0,
                    fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                    fontWeight: 700,
                    fontSize: "13px",
                    color: isCurrent ? "primary.main" : "text.secondary",
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
                    {...getPlayerAvatarProps(player)}
                    sx={{
                      width: 30,
                      height: 30,
                      bgcolor: isCurrent ? "primary.main" : "action.hover",
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: "10px",
                      color: isCurrent
                        ? "primary.contrastText"
                        : "text.primary",
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
                      <Box component="span" data-testid="attendance-card-name">
                        {pName}
                      </Box>
                      {isCurrent && (
                        <Box
                          component="span"
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 700,
                            fontSize: "9px",
                            letterSpacing: ".08em",
                            color: "primary.main",
                          }}
                        >
                          {t("peladas.attendance.desktop.you_badge", "· VOCÊ")}
                        </Box>
                      )}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 600,
                        fontSize: "10.5px",
                        lineHeight: 1.3,
                        color: "text.secondary",
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
                      color: isMensalistaPlayer
                        ? "primary.main"
                        : "text.secondary",
                      border: "1.5px solid",
                      borderColor: isMensalistaPlayer
                        ? "primary.main"
                        : "divider",
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
                  {isMensalistaPlayer ? (
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 600,
                        fontSize: "11.5px",
                        color: "text.secondary",
                      }}
                    >
                      {t("peladas.attendance.desktop.paid_status", "em dia")}
                    </Typography>
                  ) : paidPlayerIds.has(player.id) ? (
                    <Box
                      component="button"
                      data-testid="reverse-payment-button"
                      onClick={() => onReversePayment?.(player.id)}
                      title={t(
                        "peladas.attendance.desktop.undo_payment",
                        "Desfazer pagamento",
                      )}
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "11.5px",
                        color: "primary.main",
                        bgcolor: "transparent",
                        border: "none",
                        p: 0,
                        cursor: onReversePayment ? "pointer" : "default",
                      }}
                    >
                      <Box component="span" data-testid="paid-icon">
                        {t("peladas.attendance.desktop.paid_check", "pago ✓")}
                      </Box>
                    </Box>
                  ) : (
                    <Box
                      component="button"
                      data-testid="mark-as-paid-button"
                      onClick={() => onMarkPaid?.(player.id)}
                      title={t(
                        "peladas.attendance.desktop.mark_daily_paid",
                        "Marcar diária como paga",
                      )}
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 800,
                        fontSize: "9.5px",
                        letterSpacing: ".06em",
                        color: "secondary.contrastText",
                        bgcolor: "secondary.main",
                        borderRadius: "7px",
                        p: "6px 8px",
                        border: "none",
                        cursor: onMarkPaid ? "pointer" : "default",
                        "&:hover": { opacity: 0.9 },
                      }}
                    >
                      R$ {price} ·{" "}
                      {t("peladas.attendance.desktop.charge", "PAGO ?")}
                    </Box>
                  )}
                </Box>

                {/* Actions: Mover Para */}
                {isAdmin && (
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
                          data-testid="attendance-card-waitlist"
                          onClick={() => handleMover(player, "waitlist")}
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 700,
                            fontSize: "9.5px",
                            letterSpacing: ".06em",
                            color: "text.secondary",
                            border: "1.5px solid",
                            borderColor: "divider",
                            borderRadius: "7px",
                            p: "6px 8px",
                            bgcolor: "background.paper",
                            cursor: "pointer",
                            "&:hover": { borderColor: "text.primary" },
                          }}
                        >
                          {t("peladas.attendance.desktop.queue", "FILA")}
                        </Box>
                        <Box
                          component="button"
                          data-testid="attendance-card-decline"
                          onClick={() => handleMover(player, "declined")}
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 700,
                            fontSize: "9.5px",
                            letterSpacing: ".06em",
                            color: "text.secondary",
                            border: "1.5px solid",
                            borderColor: "divider",
                            borderRadius: "7px",
                            p: "6px 8px",
                            bgcolor: "background.paper",
                            cursor: "pointer",
                            "&:hover": {
                              borderColor: "secondary.main",
                              color: "secondary.main",
                            },
                          }}
                        >
                          {t("peladas.attendance.desktop.out", "FORA")}
                        </Box>
                      </>
                    )}
                    {activeTab === "waitlist" && (
                      <>
                        <Box
                          component="button"
                          data-testid="attendance-card-confirm"
                          onClick={() => handleMover(player, "confirmed")}
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 800,
                            fontSize: "9.5px",
                            letterSpacing: ".06em",
                            color: "primary.main",
                            border: "1.5px solid",
                            borderColor: "primary.main",
                            borderRadius: "7px",
                            p: "6px 8px",
                            bgcolor: "background.paper",
                            cursor: "pointer",
                            "&:hover": {
                              bgcolor: (theme) =>
                                theme.palette.status?.paid?.bg ||
                                "action.hover",
                            },
                          }}
                        >
                          {t("peladas.attendance.desktop.up", "SUBIR")}
                        </Box>
                        <Box
                          component="button"
                          data-testid="attendance-card-decline"
                          onClick={() => handleMover(player, "declined")}
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 700,
                            fontSize: "9.5px",
                            letterSpacing: ".06em",
                            color: "text.secondary",
                            border: "1.5px solid",
                            borderColor: "divider",
                            borderRadius: "7px",
                            p: "6px 8px",
                            bgcolor: "background.paper",
                            cursor: "pointer",
                            "&:hover": {
                              borderColor: "secondary.main",
                              color: "secondary.main",
                            },
                          }}
                        >
                          {t("peladas.attendance.desktop.out", "FORA")}
                        </Box>
                      </>
                    )}
                    {activeTab === "pending" && (
                      <>
                        <Box
                          component="button"
                          data-testid="attendance-card-confirm"
                          onClick={() => handleMover(player, "confirmed")}
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 800,
                            fontSize: "9.5px",
                            letterSpacing: ".06em",
                            color: "primary.main",
                            border: "1.5px solid",
                            borderColor: "primary.main",
                            borderRadius: "7px",
                            p: "6px 8px",
                            bgcolor: "background.paper",
                            cursor: "pointer",
                            "&:hover": {
                              bgcolor: (theme) =>
                                theme.palette.status?.paid?.bg ||
                                "action.hover",
                            },
                          }}
                        >
                          {t("peladas.attendance.desktop.in", "VOU")}
                        </Box>
                        <Box
                          component="button"
                          data-testid="attendance-card-decline"
                          onClick={() => handleMover(player, "declined")}
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 700,
                            fontSize: "9.5px",
                            letterSpacing: ".06em",
                            color: "text.secondary",
                            border: "1.5px solid",
                            borderColor: "divider",
                            borderRadius: "7px",
                            p: "6px 8px",
                            bgcolor: "background.paper",
                            cursor: "pointer",
                            "&:hover": {
                              borderColor: "secondary.main",
                              color: "secondary.main",
                            },
                          }}
                        >
                          {t("peladas.attendance.desktop.out", "FORA")}
                        </Box>
                      </>
                    )}
                    {activeTab === "declined" && (
                      <>
                        <Box
                          component="button"
                          data-testid="attendance-card-confirm"
                          onClick={() => handleMover(player, "confirmed")}
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 800,
                            fontSize: "9.5px",
                            letterSpacing: ".06em",
                            color: "primary.main",
                            border: "1.5px solid",
                            borderColor: "primary.main",
                            borderRadius: "7px",
                            p: "6px 8px",
                            bgcolor: "background.paper",
                            cursor: "pointer",
                            "&:hover": {
                              bgcolor: (theme) =>
                                theme.palette.status?.paid?.bg ||
                                "action.hover",
                            },
                          }}
                        >
                          {t("peladas.attendance.desktop.in", "VOU")}
                        </Box>
                        <Box
                          component="button"
                          data-testid="attendance-card-waitlist"
                          onClick={() => handleMover(player, "waitlist")}
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 700,
                            fontSize: "9.5px",
                            letterSpacing: ".06em",
                            color: "text.secondary",
                            border: "1.5px solid",
                            borderColor: "divider",
                            borderRadius: "7px",
                            p: "6px 8px",
                            bgcolor: "background.paper",
                            cursor: "pointer",
                            "&:hover": { borderColor: "text.primary" },
                          }}
                        >
                          {t("peladas.attendance.desktop.queue", "FILA")}
                        </Box>
                      </>
                    )}
                  </Box>
                )}
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
              bgcolor: "action.hover",
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
              {t("peladas.attendance.desktop.pagination", {
                displayed: Math.min(displayedList.length, currentList.length),
                total: currentList.length,
                tab: t(`peladas.attendance.desktop.${activeTab}`, activeTab),
                defaultValue: `1–${Math.min(displayedList.length, currentList.length)} de ${currentList.length} ${activeTab}`,
              })}
            </Typography>
            <Box
              component="button"
              onClick={() => setShowAll(!showAll)}
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "11.5px",
                color: "primary.main",
                border: "none",
                background: "none",
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              {showAll
                ? t("peladas.attendance.desktop.see_less", "Ver menos ↑")
                : t("peladas.attendance.desktop.see_all", "Ver todos →")}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
