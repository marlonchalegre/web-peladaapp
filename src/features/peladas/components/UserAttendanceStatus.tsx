import {
  Paper,
  Stack,
  Box,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { useTranslation } from "react-i18next";
import { type AttendanceStatus } from "../../../shared/api/endpoints";
import { type PlayerWithUser } from "../hooks/useAttendance";

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
  const firstName = player.user.name.split(" ")[0];

  const getStatusMessage = () => {
    switch (player.attendance_status) {
      case "confirmed":
        return t("peladas.attendance.user_status.confirmed_msg");
      case "declined":
        return t("peladas.attendance.user_status.declined_msg");
      default:
        return t("peladas.attendance.user_status.prompt");
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 4 },
        mb: 4,
        borderRadius: 4,
        bgcolor:
          player.attendance_status === "declined" ? "grey.800" : "primary.main",
        color: "white",
        backgroundImage:
          "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
        transition: "all 0.3s ease",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        gap={3}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              mb: 0.5,
              letterSpacing: -0.5,
            }}
          >
            {t("common.hello")}, {firstName}! 👋
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 500 }}>
            {getStatusMessage()}
          </Typography>
        </Box>
        <Stack
          direction="row"
          spacing={2}
          sx={{ width: { xs: "100%", md: "auto" } }}
        >
          <Button
            fullWidth
            variant="contained"
            color="inherit"
            startIcon={
              isUpdating && player.attendance_status !== "confirmed" ? (
                <CircularProgress size={20} color="primary" />
              ) : (
                <CheckCircleIcon />
              )
            }
            onClick={() => onUpdate("confirmed")}
            disabled={isUpdating}
            data-testid="attendance-confirm-button"
            sx={{
              borderRadius: 3,
              py: 1.5,
              px: 3,
              textTransform: "none",
              fontWeight: 800,
              bgcolor:
                player.attendance_status === "confirmed"
                  ? "white"
                  : "rgba(255,255,255,0.1)",
              color:
                player.attendance_status === "confirmed"
                  ? "primary.main"
                  : "white",
              boxShadow:
                player.attendance_status === "confirmed"
                  ? "0 4px 12px rgba(0,0,0,0.2)"
                  : "none",
              "&:hover": {
                bgcolor:
                  player.attendance_status === "confirmed"
                    ? "white"
                    : "rgba(255,255,255,0.25)",
              },
              transition: "all 0.2s ease",
            }}
          >
            {t("peladas.attendance.button.confirm")}
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="inherit"
            startIcon={
              isUpdating && player.attendance_status !== "declined" ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <CancelIcon />
              )
            }
            onClick={() => onUpdate("declined")}
            disabled={isUpdating}
            data-testid="attendance-decline-button"
            sx={{
              borderRadius: 3,
              py: 1.5,
              px: 3,
              textTransform: "none",
              fontWeight: 800,
              bgcolor:
                player.attendance_status === "declined"
                  ? "white"
                  : "rgba(255,255,255,0.1)",
              color:
                player.attendance_status === "declined"
                  ? "error.main"
                  : "white",
              boxShadow:
                player.attendance_status === "declined"
                  ? "0 4px 12px rgba(0,0,0,0.2)"
                  : "none",
              "&:hover": {
                bgcolor:
                  player.attendance_status === "declined"
                    ? "white"
                    : "rgba(255,255,255,0.25)",
              },
              transition: "all 0.2s ease",
            }}
          >
            {t("peladas.attendance.button.decline")}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
