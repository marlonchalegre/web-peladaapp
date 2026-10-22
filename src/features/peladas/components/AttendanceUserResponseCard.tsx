import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { User } from "../../../shared/api/endpoints";
import type { PlayerWithUser } from "../hooks/useAttendance";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";
import { getInitials } from "../../../shared/utils/initials";
import { formatPosition } from "../utils/playerUtils";

interface AttendanceUserResponseCardProps {
  currentUser?: User | null;
  currentPlayerAsPlayer: PlayerWithUser;
  onUpdateAttendance: (status: "confirmed" | "waitlist" | "declined") => void;
  formatMemberType: (type?: string) => string;
}

export function AttendanceUserResponseCard({
  currentUser,
  currentPlayerAsPlayer,
  onUpdateAttendance,
  formatMemberType,
}: AttendanceUserResponseCardProps) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: (theme) =>
          theme.palette.brutalist?.border ||
          `2px solid ${theme.palette.divider}`,
        borderRadius: "18px",
        boxShadow: (theme) =>
          theme.palette.brutalist?.shadow ||
          `5px 5px 0 ${theme.palette.divider}`,
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
          bgcolor: "primary.main",
          fontFamily: "Archivo, sans-serif",
          fontWeight: 800,
          fontSize: "13px",
          color: "primary.contrastText",
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
          {t("peladas.attendance.desktop.your_response", "SUA RESPOSTA")}
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
            ? `${t("peladas.attendance.desktop.you_confirmed", "Você está confirmado")} · ${formatPosition(currentUser?.position)} · ${formatMemberType(currentPlayerAsPlayer.member_type).toLowerCase()}`
            : currentPlayerAsPlayer.attendance_status === "waitlist"
              ? `${t("peladas.attendance.desktop.you_waitlist", "Você está na fila de espera")} · ${formatPosition(currentUser?.position)} · ${formatMemberType(currentPlayerAsPlayer.member_type).toLowerCase()}`
              : currentPlayerAsPlayer.attendance_status === "declined"
                ? t(
                    "peladas.attendance.desktop.you_declined",
                    "Você informou que não vai jogar nesta pelada",
                  )
                : t(
                    "peladas.attendance.desktop.you_unanswered",
                    "Você ainda não respondeu se vai jogar",
                  )}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
        <Box
          component="button"
          data-testid="attendance-confirm-button"
          onClick={() => onUpdateAttendance("confirmed")}
          sx={{
            border: (theme) =>
              currentPlayerAsPlayer.attendance_status === "confirmed"
                ? `2px solid ${theme.palette.primary.main}`
                : `1.5px solid ${theme.palette.divider}`,
            bgcolor: (theme) =>
              currentPlayerAsPlayer.attendance_status === "confirmed"
                ? theme.palette.status?.paid?.bg || "action.hover"
                : "background.paper",
            color:
              currentPlayerAsPlayer.attendance_status === "confirmed"
                ? "primary.main"
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
            "&:hover": { borderColor: "primary.main" },
          }}
        >
          {t("peladas.attendance.desktop.will_play", "VOU JOGAR")}
        </Box>
        <Box
          component="button"
          data-testid="attendance-waitlist-button"
          onClick={() => onUpdateAttendance("waitlist")}
          sx={{
            border: (theme) =>
              currentPlayerAsPlayer.attendance_status === "waitlist"
                ? `2px solid ${theme.palette.secondary.main}`
                : `1.5px solid ${theme.palette.divider}`,
            bgcolor: (theme) =>
              currentPlayerAsPlayer.attendance_status === "waitlist"
                ? theme.palette.status?.unpaid?.bg || "action.hover"
                : "background.paper",
            color:
              currentPlayerAsPlayer.attendance_status === "waitlist"
                ? "secondary.main"
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
            "&:hover": { borderColor: "secondary.main" },
          }}
        >
          {t("peladas.attendance.desktop.waitlist", "FILA DE ESPERA")}
        </Box>
        <Box
          component="button"
          data-testid="attendance-decline-button"
          onClick={() => onUpdateAttendance("declined")}
          sx={{
            border: (theme) =>
              currentPlayerAsPlayer.attendance_status === "declined"
                ? `2px solid ${theme.palette.text.primary}`
                : `1.5px solid ${theme.palette.divider}`,
            bgcolor:
              currentPlayerAsPlayer.attendance_status === "declined"
                ? "action.selected"
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
            "&:hover": { borderColor: "text.primary" },
          }}
        >
          {t("peladas.attendance.desktop.wont_play", "NÃO VOU")}
        </Box>
      </Box>
    </Box>
  );
}
