import {
  Paper,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PaidIcon from "@mui/icons-material/Paid";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import GroupsIcon from "@mui/icons-material/Groups";
import SecurityIcon from "@mui/icons-material/Security";
import { type DragEvent, useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  type Player,
  type User,
  type Team,
} from "../../../shared/api/endpoints";

interface AvailablePlayerItemProps {
  player: Player & { user: User };
  score: number | null;
  locked?: boolean;
  onDragStart: (e: DragEvent<HTMLElement>) => void;
  isPaid?: boolean;
  isAdmin?: boolean;
  onMarkPaid?: () => void;
  onReversePayment?: () => void;
  teams?: Team[];
  onMoveToTeam?: (playerId: number, teamId: number) => void;
  onMoveToFixedGk?: (playerId: number, side: "home" | "away") => void;
  hasFixedGoalkeepers?: boolean;
}

export default function AvailablePlayerItem({
  player,
  score,
  locked,
  onDragStart,
  isPaid,
  isAdmin,
  onMarkPaid,
  onReversePayment,
  teams = [],
  onMoveToTeam,
  onMoveToFixedGk,
  hasFixedGoalkeepers = false,
}: AvailablePlayerItemProps) {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const scoreVal = typeof score === "number" ? score.toFixed(1) : "-";
  const needsPayment =
    player.member_type === "diarista" || player.member_type === "convidado";

  const handleOpenMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleMove = (teamId: number) => {
    onMoveToTeam?.(player.id, teamId);
    handleCloseMenu();
  };

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
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          transform: "translateY(-2px)",
        },
      }}
      draggable={!locked}
      onDragStart={locked ? undefined : onDragStart}
    >
      {!locked && isAdmin && (
        <IconButton
          size="small"
          onClick={handleOpenMenu}
          sx={{
            p: 0.75,
            mr: 1.5,
            bgcolor: "action.hover",
            "&:hover": { bgcolor: "primary.lighter", color: "primary.main" },
          }}
        >
          <SwapHorizIcon sx={{ fontSize: "1.25rem" }} />
        </IconButton>
      )}
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            color: "text.primary",
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontSize: "0.85rem",
          }}
        >
          {player.user.name}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 500, fontSize: "0.7rem" }}
        >
          {player.user.position
            ? t(`common.positions.${player.user.position.toLowerCase()}`)
            : t("common.positions.unknown")}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
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
                    <PaidIcon
                      sx={{ fontSize: "1.1rem" }}
                      data-testid="paid-icon"
                    />
                  </IconButton>
                ) : (
                  <PaidIcon
                    sx={{ fontSize: "1.1rem" }}
                    data-testid="paid-icon"
                  />
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
                <AttachMoneyIcon sx={{ fontSize: "1.1rem" }} />
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
                <AttachMoneyIcon sx={{ fontSize: "1.1rem" }} />
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
            fontSize: "0.7rem",
            border: "1px solid",
            borderColor: "success.light",
          }}
        >
          {scoreVal}
        </Box>
        {!locked && isAdmin && (
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
            transformOrigin={{ horizontal: "left", vertical: "top" }}
            anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
            PaperProps={{
              elevation: 3,
              sx: { borderRadius: 2, minWidth: 180 },
            }}
          >
            {teams.map((team) => (
              <MenuItem key={team.id} onClick={() => handleMove(team.id)}>
                <ListItemIcon>
                  <GroupsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>
                  {t("peladas.teams.menu.move_to", { name: team.name })}
                </ListItemText>
              </MenuItem>
            ))}

            {hasFixedGoalkeepers && [
              <MenuItem
                key="move-to-home-gk"
                onClick={() => {
                  onMoveToFixedGk?.(player.id, "home");
                  handleCloseMenu();
                }}
              >
                <ListItemIcon>
                  <SecurityIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>
                  {t("peladas.teams.menu.move_to_home_gk")}
                </ListItemText>
              </MenuItem>,
              <MenuItem
                key="move-to-away-gk"
                onClick={() => {
                  onMoveToFixedGk?.(player.id, "away");
                  handleCloseMenu();
                }}
              >
                <ListItemIcon>
                  <SecurityIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>
                  {t("peladas.teams.menu.move_to_away_gk")}
                </ListItemText>
              </MenuItem>,
            ]}
          </Menu>
        )}
      </Box>
    </Paper>
  );
}
