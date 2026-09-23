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
        bgcolor: "#ffffff",
        border: "2px solid #17181a",
        boxShadow: "5px 5px 0 #17181a",
        color: "#17181a",
      }}
    >
      <Typography
        sx={{
          font: "700 9.5px/1 Archivo,sans-serif",
          letterSpacing: ".18em",
          color: "#6b675c",
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
            color: "#17181a",
          }}
        >
          Bora pro jogo?
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontFamily: "Archivo, sans-serif",
            color: "#6b675c",
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
              <strong style={{ color: "#17181a" }}>terça, 22h</strong>.
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
              player.attendance_status === "confirmed" ? "#146b3a" : "#ffffff",
            color:
              player.attendance_status === "confirmed" ? "#ffffff" : "#146b3a",
            border:
              player.attendance_status === "confirmed"
                ? 0
                : "2px solid #146b3a",
            boxShadow:
              player.attendance_status === "confirmed"
                ? "0 3px 0 #0d4526"
                : "none",
            "&:hover": {
              bgcolor:
                player.attendance_status === "confirmed"
                  ? "#0e5c31"
                  : "#f6f4ee",
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
              player.attendance_status === "declined" ? "#a8452a" : "#ffffff",
            color:
              player.attendance_status === "declined" ? "#ffffff" : "#6b675c",
            border:
              player.attendance_status === "declined" ? 0 : "2px solid #ddd8cc",
            boxShadow:
              player.attendance_status === "declined"
                ? "0 3px 0 #732a17"
                : "none",
            "&:hover": {
              borderColor: "#17181a",
              color:
                player.attendance_status === "declined" ? "#ffffff" : "#17181a",
              bgcolor:
                player.attendance_status === "declined" ? "#8a351e" : "#f6f4ee",
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
            player.attendance_status === "waitlist" ? "#a8452a" : "#ffffff",
          color:
            player.attendance_status === "waitlist" ? "#ffffff" : "#a8452a",
          border:
            player.attendance_status === "waitlist"
              ? "2px solid #a8452a"
              : "2px solid #e2c9bd",
          "&:hover": {
            bgcolor:
              player.attendance_status === "waitlist" ? "#8a351e" : "#fdf6f3",
            borderColor: "#a8452a",
          },
        }}
      >
        {t(
          "peladas.attendance.user_status.waitlist_button",
          "Fila de espera",
        )}
      </Button>
    </Paper>
  );
}
