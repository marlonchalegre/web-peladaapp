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

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 4,
        borderRadius: 3,
        bgcolor: "background.default",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            {t("peladas.attendance.user_status.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("peladas.attendance.user_status.subtitle")}
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant={
              player.attendance_status === "confirmed"
                ? "contained"
                : "outlined"
            }
            color="success"
            startIcon={
              isUpdating && player.attendance_status !== "confirmed" ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <CheckCircleIcon />
              )
            }
            onClick={() => onUpdate("confirmed")}
            disabled={isUpdating}
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            {t("peladas.attendance.button.confirm")}
          </Button>
          <Button
            variant={
              player.attendance_status === "declined" ? "contained" : "outlined"
            }
            color="error"
            startIcon={
              isUpdating && player.attendance_status !== "declined" ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <CancelIcon />
              )
            }
            onClick={() => onUpdate("declined")}
            disabled={isUpdating}
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            {t("peladas.attendance.button.decline")}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
