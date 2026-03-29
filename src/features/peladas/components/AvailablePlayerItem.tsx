import {
  Paper,
  Box,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
} from "@mui/material";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PaidIcon from "@mui/icons-material/Paid";
import { type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { type Player, type User } from "../../../shared/api/endpoints";

interface AvailablePlayerItemProps {
  player: Player & { user: User };
  score: number | null;
  locked?: boolean;
  onDragStart: (e: DragEvent<HTMLElement>) => void;
  isPaid?: boolean;
  isAdmin?: boolean;
  onMarkPaid?: () => void;
}

export default function AvailablePlayerItem({
  player,
  score,
  locked,
  onDragStart,
  isPaid,
  isAdmin,
  onMarkPaid,
}: AvailablePlayerItemProps) {
  const { t } = useTranslation();
  const scoreVal = typeof score === "number" ? score.toFixed(1) : "-";
  const needsPayment =
    player.member_type === "diarista" || player.member_type === "convidado";

  return (
    <Paper
      elevation={0}
      data-testid="player-row"
      sx={{
        p: 1.25,
        display: "flex",
        alignItems: "center",
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2.5,
        cursor: locked ? "default" : "grab",
        transition: "all 0.2s",
        "&:hover": {
          borderColor: "primary.main",
          bgcolor: "primary.lighter",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          transform: "translateX(4px)",
        },
      }}
      draggable={!locked}
      onDragStart={locked ? undefined : onDragStart}
    >
      <Avatar
        sx={{
          width: 36,
          height: 36,
          fontSize: 14,
          bgcolor: "primary.main",
          color: "white",
          mr: 1.5,
          fontWeight: 800,
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        {getInitials(player.user.name)}
      </Avatar>
      <Box sx={{ flexGrow: 1 }}>
        <Typography
          variant="body2"
          sx={{ fontWeight: 700, color: "text.primary", lineHeight: 1.2 }}
        >
          {player.user.name}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 500 }}
        >
          {player.user.position
            ? t(`common.positions.${player.user.position.toLowerCase()}`)
            : t("common.positions.unknown")}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {needsPayment &&
          (isPaid ? (
            <Tooltip
              title={t(
                "organizations.management.finance.monthly_fees.paid",
                "Pago",
              )}
            >
              <Box
                sx={{
                  color: "success.main",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <PaidIcon fontSize="small" data-testid="paid-icon" />
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
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkPaid();
                }}
                data-testid="mark-as-paid-button"
                sx={{
                  color: "warning.main",
                  p: 0.5,
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
                }}
              >
                <AttachMoneyIcon fontSize="small" />
              </Box>
            </Tooltip>
          ))}
        <Box
          sx={{
            px: 1,
            py: 0.25,
            bgcolor: "success.lighter",
            color: "success.main",
            fontWeight: 800,
            borderRadius: 1.5,
            fontSize: "0.75rem",
            border: "1px solid",
            borderColor: "success.light",
          }}
        >
          {scoreVal}
        </Box>
      </Box>
    </Paper>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
