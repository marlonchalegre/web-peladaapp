import {
  Card,
  CardContent,
  Box,
  Typography,
  Stack,
  IconButton,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PaidIcon from "@mui/icons-material/Paid";
import { useTranslation } from "react-i18next";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";
import {
  type AttendanceStatus,
  type OrganizationFinance,
} from "../../../shared/api/endpoints";
import { type PlayerWithUser } from "../hooks/useAttendance";

interface PlayerAttendanceCardProps {
  player: PlayerWithUser;
  isAdmin: boolean;
  isCurrentUser: boolean;
  onUpdate: (status: AttendanceStatus) => void;
  isUpdating: boolean;
  isPaid?: boolean;
  onMarkPaid?: (amount: number) => void;
  onReversePayment?: () => void;
  organizationFinance?: OrganizationFinance | null;
  "data-testid"?: string;
}

export default function PlayerAttendanceCard({
  player,
  isAdmin,
  isCurrentUser,
  onUpdate,
  isUpdating,
  isPaid,
  onMarkPaid,
  onReversePayment,
  organizationFinance,
  "data-testid": testId,
}: PlayerAttendanceCardProps) {
  const { t } = useTranslation();
  const name = player.user?.name || "";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const needsPayment =
    player.member_type === "diarista" || player.member_type === "convidado";

  return (
    <Card
      elevation={0}
      data-testid={testId}
      sx={{
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
        transition: "all 0.1s ease-in-out",
      }}
    >
      <CardContent
        sx={{
          p: "12px !important",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", minWidth: 0 }}>
          <SecureAvatar
            userId={player.user?.id}
            filename={
              player.user?.avatar_filename || player.user_avatar_filename
            }
            sx={{
              width: 36,
              height: 36,
              mr: 1.5,
              bgcolor: isCurrentUser ? "primary.main" : "grey.200",
              color: isCurrentUser ? "white" : "text.primary",
              fontSize: "0.75rem",
              fontWeight: 800,
              border: isCurrentUser ? "none" : "1px solid",
              borderColor: "divider",
            }}
            fallbackText={initials}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body1"
              component="div"
              noWrap
              data-testid="attendance-card-name"
              sx={{
                fontWeight: 600,
                lineHeight: 1.2,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {name}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ flexWrap: "wrap" }}
            >
              {isCurrentUser && (
                <Typography
                  variant="caption"
                  color="primary.main"
                  sx={{ fontWeight: "bold" }}
                >
                  {t("common.you")}
                </Typography>
              )}
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "flex", alignItems: "center" }}
              >
                {isCurrentUser && " • "}
                {t(
                  player.user?.position
                    ? `common.positions.${player.user.position.toLowerCase()}`
                    : "common.positions.unknown",
                )}
              </Typography>
              {player.member_type && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  • {t(`common.member_types.${player.member_type}`)}
                </Typography>
              )}
            </Stack>
          </Box>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          {needsPayment &&
            (isPaid ? (
              <Tooltip
                title={
                  isAdmin && onReversePayment
                    ? t(
                        "organizations.management.finance.monthly_fees.reverse",
                        "Estornar",
                      )
                    : t(
                        "organizations.management.finance.monthly_fees.paid",
                        "Pago",
                      )
                }
              >
                <Box
                  sx={{
                    color: "success.main",
                    display: "flex",
                    alignItems: "center",
                    px: 1,
                  }}
                >
                  {isAdmin && onReversePayment ? (
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        onReversePayment();
                      }}
                      data-testid="reverse-payment-button"
                      size="small"
                      sx={{
                        color: "success.main",
                        p: 0.5,
                        "&:hover": {
                          color: "error.main",
                          bgcolor: "error.light",
                        },
                      }}
                    >
                      <PaidIcon fontSize="small" data-testid="paid-icon" />
                    </IconButton>
                  ) : (
                    <PaidIcon fontSize="small" data-testid="paid-icon" />
                  )}
                </Box>
              </Tooltip>
            ) : isAdmin && onMarkPaid ? (
              <Tooltip
                title={t(
                  "organizations.management.finance.monthly_fees.mark_as_paid",
                  "Marcar como Pago",
                )}
              >
                <IconButton
                  size="small"
                  onClick={() =>
                    onMarkPaid?.(organizationFinance?.diarista_price || 0)
                  }
                  disabled={isUpdating || !organizationFinance?.diarista_price}
                  data-testid="mark-as-paid-button"
                  sx={{
                    color: "warning.main",
                    "&:hover": {
                      color: "success.main",
                      bgcolor: "success.light",
                    },
                  }}
                >
                  <AttachMoneyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip
                title={t(
                  "organizations.management.finance.monthly_fees.pending",
                  "Pendente",
                )}
              >
                <Box
                  sx={{
                    color: "warning.main",
                    display: "flex",
                    alignItems: "center",
                    px: 1,
                  }}
                >
                  <AttachMoneyIcon fontSize="small" />
                </Box>
              </Tooltip>
            ))}

          {isAdmin && (
            <>
              {isUpdating ? (
                <Box sx={{ p: 0.5 }}>
                  <CircularProgress size={20} />
                </Box>
              ) : (
                <>
                  {player.attendance_status !== "confirmed" && (
                    <IconButton
                      size="small"
                      title={t("peladas.attendance.status.confirmed")}
                      onClick={() => onUpdate("confirmed")}
                      data-testid="attendance-card-confirm"
                      sx={{
                        color: "grey.400",
                        "&:hover": {
                          color: "success.main",
                          bgcolor: "success.light",
                        },
                      }}
                    >
                      <CheckCircleIcon fontSize="small" />
                    </IconButton>
                  )}
                  {player.attendance_status !== "waitlist" && (
                    <IconButton
                      size="small"
                      title={t("peladas.attendance.status.waitlist")}
                      onClick={() => onUpdate("waitlist")}
                      data-testid="attendance-card-waitlist"
                      sx={{
                        color: "grey.400",
                        "&:hover": {
                          color: "warning.main",
                          bgcolor: "warning.light",
                        },
                      }}
                    >
                      <AccessTimeIcon fontSize="small" />
                    </IconButton>
                  )}
                  {player.attendance_status !== "declined" && (
                    <IconButton
                      size="small"
                      title={t("peladas.attendance.status.declined")}
                      onClick={() => onUpdate("declined")}
                      data-testid="attendance-card-decline"
                      sx={{
                        color: "grey.400",
                        "&:hover": {
                          color: "error.main",
                          bgcolor: "error.light",
                        },
                      }}
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  )}
                </>
              )}
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
