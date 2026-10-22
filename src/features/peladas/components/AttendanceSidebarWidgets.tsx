import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { PlayerWithUser } from "../hooks/useAttendance";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";
import { getPlayerAvatarProps } from "../utils/playerUtils";

interface AttendanceSpotsCardProps {
  confirmedCount: number;
  waitlistCount: number;
  maxPlayers?: number;
}

export function AttendanceSpotsCard({
  confirmedCount,
  waitlistCount,
  maxPlayers,
}: AttendanceSpotsCardProps) {
  const { t } = useTranslation();

  return (
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
        {t("peladas.attendance.desktop.spots_label", "VAGAS")}
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
          {confirmedCount}
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
          {maxPlayers
            ? t("peladas.attendance.desktop.of_total", {
                total: maxPlayers,
                defaultValue: `de ${maxPlayers}`,
              })
            : ""}
        </Typography>
      </Box>
      <Box
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: "action.hover",
          overflow: "hidden",
          display: "flex",
          mt: 1.5,
        }}
      >
        <Box
          sx={{
            width: `${
              maxPlayers
                ? Math.min(100, Math.round((confirmedCount / maxPlayers) * 100))
                : 0
            }%`,
            bgcolor: "primary.main",
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
          ? t("peladas.attendance.desktop.open_spots", {
              count: Math.max(0, maxPlayers - confirmedCount),
              defaultValue: `${Math.max(0, maxPlayers - confirmedCount)} vagas abertas · `,
            })
          : ""}
        {waitlistCount}{" "}
        {t(
          "peladas.attendance.desktop.waitlist_auto_info",
          "na fila de espera aguardando aprovação do organizador.",
        )}
      </Typography>
    </Box>
  );
}

interface AttendanceWaitlistCardProps {
  waitlist: PlayerWithUser[];
  formatMemberType: (type?: string) => string;
  onMovePlayer: (player: PlayerWithUser, status: "confirmed") => void;
}

export function AttendanceWaitlistCard({
  waitlist,
  formatMemberType,
  onMovePlayer,
}: AttendanceWaitlistCardProps) {
  const { t } = useTranslation();

  return (
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
        {t("peladas.attendance.desktop.waitlist_section", "FILA DE ESPERA")} ·{" "}
        {waitlist.length}
      </Box>
      {waitlist.length === 0 ? (
        <Box sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontSize: "11.5px",
              fontWeight: 600,
            }}
          >
            {t(
              "peladas.attendance.desktop.waitlist_empty",
              "Fila vazia no momento.",
            )}
          </Typography>
        </Box>
      ) : (
        waitlist.slice(0, 3).map((wPlayer, wIdx) => {
          const wName = wPlayer.user?.name || t("common.player", "Jogador");
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
                  color: "secondary.main",
                  flexShrink: 0,
                }}
              >
                {wIdx + 1}
              </Box>
              <SecureAvatar
                {...getPlayerAvatarProps(wPlayer)}
                sx={{
                  width: 28,
                  height: 28,
                  bgcolor: "action.hover",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: "9.5px",
                  color: "text.primary",
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
                onClick={() => onMovePlayer(wPlayer, "confirmed")}
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: "9.5px",
                  letterSpacing: ".06em",
                  color: "primary.main",
                  border: "1.5px solid",
                  borderColor: "primary.main",
                  borderRadius: "7px",
                  p: "6px 7px",
                  bgcolor: "background.paper",
                  cursor: "pointer",
                  "&:hover": {
                    bgcolor: (theme) =>
                      theme.palette.status?.paid?.bg || "action.hover",
                  },
                }}
              >
                {t("peladas.attendance.desktop.up", "SUBIR")}
              </Box>
            </Box>
          );
        })
      )}
    </Box>
  );
}

interface AttendanceDailyFeesCardProps {
  openDiariasCount: number;
  openDiariasAmount: number;
  totalDiariasAmount: number;
  organizationName?: string;
}

export function AttendanceDailyFeesCard({
  openDiariasCount,
  openDiariasAmount,
  totalDiariasAmount,
  organizationName,
}: AttendanceDailyFeesCardProps) {
  const { t } = useTranslation();

  return (
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
          {t(
            "peladas.attendance.desktop.daily_fees_title",
            "DIÁRIAS DESTA PELADA",
          )}
        </Typography>
        <Typography
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 700,
            fontSize: "11px",
            color: "secondary.main",
          }}
        >
          {openDiariasCount}{" "}
          {t("peladas.attendance.desktop.open_amount", "em aberto")}
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
            color: "secondary.main",
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
          {t("peladas.attendance.desktop.of_total", {
            total: `R$ ${totalDiariasAmount}`,
            defaultValue: `de R$ ${totalDiariasAmount}`,
          })}
          <br />
          {t("peladas.attendance.desktop.expected", "previstos")}
        </Typography>
      </Box>
      <Box
        component="button"
        onClick={() => {
          const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(
            t("peladas.attendance.desktop.whatsapp_daily_msg", {
              org: organizationName || "",
              amount: openDiariasAmount,
              defaultValue: `Cobrança de diárias da pelada ${organizationName || ""}: R$ ${openDiariasAmount} em aberto.`,
            }),
          )}`;
          window.open(url, "_blank");
        }}
        sx={{
          width: "100%",
          border: "1.5px solid",
          borderColor: "divider",
          borderRadius: "12px",
          bgcolor: "background.paper",
          color: "text.primary",
          py: 1.4,
          fontFamily: "Archivo, sans-serif",
          fontWeight: 800,
          fontSize: "11.5px",
          letterSpacing: ".06em",
          cursor: "pointer",
          mt: 1.8,
          "&:hover": {
            bgcolor: "action.hover",
          },
        }}
      >
        {t("peladas.attendance.desktop.charge_whatsapp_count", {
          count: openDiariasCount,
          defaultValue: `COBRAR OS ${openDiariasCount} NO ZAP`,
        })}
      </Box>
    </Box>
  );
}

interface AttendancePendingRemindersCardProps {
  pendingCount: number;
  weekday: string;
  dayNumber: number;
}

export function AttendancePendingRemindersCard({
  pendingCount,
  weekday,
  dayNumber,
}: AttendancePendingRemindersCardProps) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        bgcolor: (theme) =>
          theme.palette.brutalist?.cardHeaderBg || "background.paper",
        border: 1,
        borderColor: "divider",
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
          color: "primary.light",
        }}
      >
        {t("peladas.attendance.desktop.pending_section", "PENDENTES")} ·{" "}
        {pendingCount}
      </Typography>
      <Typography
        sx={{
          fontFamily: "Archivo, sans-serif",
          fontWeight: 600,
          fontSize: "12px",
          lineHeight: 1.5,
          color: (theme) =>
            theme.palette.brutalist?.cardHeaderText || "text.primary",
          mt: 1.4,
        }}
      >
        {t("peladas.attendance.desktop.pending_reminder_hint_interpolated", {
          count: pendingCount,
          defaultValue: `${pendingCount} mensalistas ainda não responderam. Um lembrete no grupo costuma resolver antes de fechar a lista.`,
        })}
      </Typography>
      <Box
        component="button"
        onClick={() => {
          const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(
            t("peladas.attendance.desktop.whatsapp_pending_msg", {
              count: pendingCount,
              weekday,
              day: dayNumber,
              defaultValue: `Lembrete: ${pendingCount} jogadores ainda não confirmaram presença na pelada de ${weekday} ${dayNumber}. Confirme sua presença pelo app!`,
            }),
          )}`;
          window.open(url, "_blank");
        }}
        sx={{
          width: "100%",
          border: "none",
          borderRadius: "12px",
          bgcolor: (theme) =>
            theme.palette.gold?.main || theme.palette.primary.main,
          color: (theme) =>
            theme.palette.gold?.contrastText ||
            theme.palette.primary.contrastText,
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
        {t("peladas.attendance.desktop.remind_button_count", {
          count: pendingCount,
          defaultValue: `LEMBRAR OS ${pendingCount}`,
        })}
      </Box>
    </Box>
  );
}
