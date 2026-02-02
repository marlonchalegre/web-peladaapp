import {
  Card,
  CardContent,
  Box,
  Avatar,
  Typography,
  Stack,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { useTranslation } from "react-i18next";
import { type AttendanceStatus } from "../../../shared/api/endpoints";
import { type PlayerWithUser } from "../hooks/useAttendance";

interface PlayerAttendanceCardProps {
  player: PlayerWithUser;
  isAdmin: boolean;
  isCurrentUser: boolean;
  onUpdate: (status: AttendanceStatus) => void;
  isUpdating: boolean;
}

export default function PlayerAttendanceCard({
  player,
  isAdmin,
  isCurrentUser,
  onUpdate,
  isUpdating,
}: PlayerAttendanceCardProps) {
  const { t } = useTranslation();
  const initials = player.user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        "&:hover": { borderColor: "primary.main", bgcolor: "grey.50" },
        transition: "all 0.2s",
      }}
    >
      <CardContent
        sx={{
          p: "16px !important",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Avatar
            sx={{
              width: 44,
              height: 44,
              mr: 2,
              bgcolor: isCurrentUser ? "primary.main" : "grey.100",
              color: isCurrentUser ? "white" : "text.primary",
              fontSize: "0.875rem",
              fontWeight: "bold",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            {initials}
          </Avatar>
          <Box>
            <Typography
              variant="subtitle1"
              component="div"
              sx={{ fontWeight: "bold", lineHeight: 1.2 }}
            >
              {player.user.name}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              {isCurrentUser && (
                <Typography
                  variant="caption"
                  color="primary.main"
                  sx={{ fontWeight: "bold" }}
                >
                  {t("common.you")}
                </Typography>
              )}
              {player.position_id === 1 && (
                <Typography variant="caption" color="text.secondary">
                  {t("common.positions.goalkeeper")}
                </Typography>
              )}
            </Stack>
          </Box>
        </Box>

        {(isAdmin || isCurrentUser) && (
          <Stack direction="row" spacing={1}>
            {isUpdating ? (
              <Box sx={{ p: 0.5 }}>
                <CircularProgress size={20} />
              </Box>
            ) : (
              <>
                {player.attendance_status !== "confirmed" && (
                  <IconButton
                    size="small"
                    onClick={() => onUpdate("confirmed")}
                    sx={{
                      color: "grey.400",
                      "&:hover": {
                        color: "success.main",
                        bgcolor: "success.light",
                        alpha: 0.1,
                      },
                    }}
                  >
                    <CheckCircleIcon fontSize="small" />
                  </IconButton>
                )}
                {player.attendance_status !== "declined" && (
                  <IconButton
                    size="small"
                    onClick={() => onUpdate("declined")}
                    sx={{
                      color: "grey.400",
                      "&:hover": {
                        color: "error.main",
                        bgcolor: "error.light",
                        alpha: 0.1,
                      },
                    }}
                  >
                    <CancelIcon fontSize="small" />
                  </IconButton>
                )}
              </>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
