import { useState } from "react";
import {
  Paper,
  Stack,
  Box,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import type { AttendanceStatus } from "../../../shared/api/endpoints";
import type { PlayerWithUser } from "../hooks/useAttendance";

interface UserAttendanceStatusProps {
  player: PlayerWithUser;
  isUpdating: boolean;
  onUpdate: (status: AttendanceStatus) => void;
}

export default function UserAttendanceStatus({
  player,
  isUpdating,
  onUpdate,
}: UserAttendanceStatusProps) {
  const { t } = useTranslation();
  const firstName = (player.user?.name || "").split(" ")[0];
  const [promptSeed] = useState(() => Math.floor(Math.random() * 1000));

  const getStatusMessage = () => {
    switch (player.attendance_status) {
      case "confirmed":
        return t("peladas.attendance.user_status.confirmed_msg");
      case "waitlist":
        return t(
          "peladas.attendance.user_status.waitlist_msg",
          "Você está na lista de espera.",
        );
      case "declined":
        return t("peladas.attendance.user_status.declined_msg");
      default: {
        const prompts = t("peladas.attendance.user_status.prompts", {
          returnObjects: true,
        });
        if (Array.isArray(prompts) && prompts.length > 0) {
          const randomIndex = promptSeed % prompts.length;
          return prompts[randomIndex];
        }
        return t("peladas.attendance.user_status.prompt");
      }
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 3 },
        mb: 3,
        borderRadius: "18px",
        bgcolor: "background.paper",
        border: (theme) =>
          `2px solid ${theme.palette.mode === "dark" ? theme.palette.divider : theme.palette.grey[900]}`,
        boxShadow: (theme) =>
          `5px 5px 0 ${theme.palette.mode === "dark" ? theme.palette.common.black : theme.palette.grey[900]}`,
        color: "text.primary",
      }}
    >
      <Typography
        sx={{
          font: "700 9.5px/1 Archivo,sans-serif",
          letterSpacing: ".18em",
          color: "text.secondary",
          mb: 1,
          textTransform: "uppercase",
        }}
      >
        SUA PRESENÇA
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography
          variant="h5"
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 800,
            fontSize: { xs: "20px", sm: "22px" },
            lineHeight: 1.15,
            mb: 0.5,
            letterSpacing: -0.5,
            color: "text.primary",
          }}
        >
          Bora pro jogo?
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontFamily: "Archivo, sans-serif",
            color: "text.secondary",
            fontWeight: 600,
            lineHeight: 1.4,
            fontSize: "12px",
          }}
        >
          <span style={{ display: "none" }}>
            {t("common.hello")}, {firstName}!
          </span>
          {player.member_type === "mensalista" ? (
            <>
              Você é mensalista: sua vaga fica garantida até{" "}
              <strong style={{ color: "inherit" }}>terça, 22h</strong>.
            </>
          ) : (
            getStatusMessage()
          )}
        </Typography>
      </Box>

      <Stack direction="row" spacing={1.5} sx={{ width: "100%", mt: 1 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={
            isUpdating && player.attendance_status !== "confirmed" ? (
              <CircularProgress size={20} color="inherit" />
            ) : null
          }
          onClick={() => onUpdate("confirmed")}
          disabled={isUpdating}
          data-testid="attendance-confirm-button"
          sx={{
            borderRadius: "14px",
            py: 1.75,
            textTransform: "uppercase",
            fontFamily: "Archivo, sans-serif",
            fontWeight: 800,
            fontSize: "17px",
            letterSpacing: ".06em",
            bgcolor:
              player.attendance_status === "confirmed"
                ? "primary.main"
                : "background.paper",
            color:
              player.attendance_status === "confirmed"
                ? "primary.contrastText"
                : "primary.main",
            border: (theme) =>
              player.attendance_status === "confirmed"
                ? 0
                : `2px solid ${theme.palette.primary.main}`,
            boxShadow: (theme) =>
              player.attendance_status === "confirmed"
                ? `0 3px 0 ${theme.palette.primary.dark}`
                : "none",
            "&:hover": {
              bgcolor:
                player.attendance_status === "confirmed"
                  ? "primary.dark"
                  : "action.hover",
            },
            transition: "all 0.15s ease",
          }}
        >
          SIM
        </Button>
        <Button
          fullWidth
          variant="contained"
          startIcon={
            isUpdating && player.attendance_status !== "declined" ? (
              <CircularProgress size={20} color="inherit" />
            ) : null
          }
          onClick={() => onUpdate("declined")}
          disabled={isUpdating}
          data-testid="attendance-decline-button"
          sx={{
            borderRadius: "14px",
            py: 1.75,
            textTransform: "uppercase",
            fontFamily: "Archivo, sans-serif",
            fontWeight: 800,
            fontSize: "17px",
            letterSpacing: ".06em",
            bgcolor:
              player.attendance_status === "declined"
                ? "secondary.main"
                : "background.paper",
            color:
              player.attendance_status === "declined"
                ? "secondary.contrastText"
                : "text.secondary",
            border: (theme) =>
              player.attendance_status === "declined"
                ? 0
                : `1.5px solid ${theme.palette.divider}`,
            boxShadow: (theme) =>
              player.attendance_status === "declined"
                ? `0 3px 0 ${theme.palette.secondary.dark}`
                : "none",
            "&:hover": {
              borderColor: "text.primary",
              color:
                player.attendance_status === "declined"
                  ? "secondary.contrastText"
                  : "text.primary",
              bgcolor:
                player.attendance_status === "declined"
                  ? "secondary.dark"
                  : "action.hover",
            },
            transition: "all 0.15s ease",
          }}
        >
          NÃO
        </Button>
      </Stack>

      <Button
        fullWidth
        variant="outlined"
        onClick={() => onUpdate("waitlist")}
        disabled={isUpdating}
        data-testid="attendance-waitlist-button"
        sx={{
          mt: 1.25,
          borderRadius: "14px",
          py: 1.25,
          textTransform: "uppercase",
          fontFamily: "Archivo, sans-serif",
          fontWeight: 800,
          fontSize: "13px",
          letterSpacing: ".06em",
          bgcolor:
            player.attendance_status === "waitlist"
              ? "secondary.main"
              : "background.paper",
          color:
            player.attendance_status === "waitlist"
              ? "secondary.contrastText"
              : "secondary.main",
          border: (theme) =>
            player.attendance_status === "waitlist"
              ? `2px solid ${theme.palette.secondary.main}`
              : `1.5px solid ${theme.palette.divider}`,
          "&:hover": {
            bgcolor:
              player.attendance_status === "waitlist"
                ? "secondary.dark"
                : "secondary.light",
            borderColor: "secondary.dark",
          },
        }}
      >
        {t("peladas.attendance.user_status.waitlist_button", "Fila de espera")}
      </Button>
    </Paper>
  );
}
