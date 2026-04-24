import {
  Paper,
  Typography,
  Box,
  IconButton,
  Chip,
  Stack,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import SportsScoreIcon from "@mui/icons-material/SportsScore";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PaidIcon from "@mui/icons-material/Paid";
import GroupsIcon from "@mui/icons-material/Groups";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import SecurityIcon from "@mui/icons-material/Security";
import { useState } from "react";
import type { DragEvent, MouseEvent } from "react";
import type {
  Player,
  Team,
  User,
  Transaction,
} from "../../../shared/api/endpoints";
import { useTranslation } from "react-i18next";
import { sortPlayersByPosition } from "../utils/playerUtils";

type PlayerWithUser = Player & {
  user: User;
  displayScore?: string;
  is_goalkeeper?: boolean;
};

type TeamCardProps = {
  team: Team;
  players: PlayerWithUser[];
  averageScore: number | null;
  maxPlayers?: number;
  onDelete: () => void;
  onDrop: (e: DragEvent<HTMLElement>) => void;
  onDragStartPlayer: (e: DragEvent<HTMLElement>, playerId: number) => void;
  onMoveToTeam?: (playerId: number, teamId: number) => void;
  onSendToBench?: (playerId: number) => void;
  onMoveToFixedGk?: (playerId: number, side: "home" | "away") => void;
  teams?: Team[];
  locked?: boolean;
  isAdminOverride?: boolean;
  hasFixedGoalkeepers?: boolean;
  peladaTransactions?: Transaction[];
  teamOrganizationId?: number; // Add teamOrganizationId since we removed organizationFinance from prop
  onMarkPaid?: (playerId: number, amount: number) => void;
  onReversePayment?: (playerId: number) => void;
};

import { useOrganizationFinance } from "../../../shared/hooks/useOrganizationFinance";

export default function TeamCard({
  team,
  players,
  averageScore,
  maxPlayers = 5,
  onDelete,
  onDrop,
  onDragStartPlayer,
  onMoveToTeam,
  onSendToBench,
  onMoveToFixedGk,
  teams = [],
  locked,
  isAdminOverride = false,
  hasFixedGoalkeepers = false,
  peladaTransactions = [],
  teamOrganizationId,
  onMarkPaid,
  onReversePayment,
}: TeamCardProps) {
  const { t } = useTranslation();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<null | number>(null);

  const { organizationFinance } = useOrganizationFinance(teamOrganizationId);

  const handleOpenMenu = (event: MouseEvent<HTMLElement>, playerId: number) => {
    setMenuAnchor(event.currentTarget);
    setSelectedPlayerId(playerId);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setSelectedPlayerId(null);
  };

  const emptySlots = Math.max(0, maxPlayers - players.length);

  const sortedPlayers = sortPlayersByPosition(players);

  return (
    <Paper
      elevation={0}
      variant="outlined"
      data-testid="team-card"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 4,
        overflow: "hidden",
        borderWidth: 2,
        transition: "all 0.2s",
        "&:hover": {
          borderColor: "primary.main",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        },
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDrop={onDrop}
    >
      {/* Team Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, lineHeight: 1.2 }}
            data-testid="team-card-name"
          >
            {team.name}
          </Typography>
          {averageScore !== null && (
            <Chip
              icon={<SportsScoreIcon sx={{ fontSize: "0.9rem !important" }} />}
              label={t("peladas.team_card.average", {
                score: averageScore.toFixed(1),
              })}
              size="small"
              sx={{
                mt: 0.5,
                height: 20,
                fontSize: "0.65rem",
                fontWeight: 700,
                bgcolor: "primary.main",
                color: "white",
                borderRadius: 1,
                letterSpacing: 0.5,
              }}
            />
          )}
        </Box>
        {!locked && isAdminOverride && (
          <IconButton
            size="small"
            onClick={onDelete}
            aria-label={t("peladas.team_card.delete")}
            sx={{
              color: "text.disabled",
              "&:hover": { color: "error.main", bgcolor: "error.lighter" },
            }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Player List */}
      <Stack spacing={1} sx={{ p: 2, flexGrow: 1 }}>
        {sortedPlayers.map((p) => {
          return (
            <Paper
              key={p.id}
              elevation={0}
              data-testid="player-row"
              sx={{
                p: 1.25,
                display: "flex",
                alignItems: "center",
                bgcolor: "background.default",
                borderRadius: 2.5,
                cursor: locked ? "default" : "grab",
                border: "1px solid",
                borderColor: "divider",
                transition: "all 0.2s",
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: "action.hover",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                },
                position: "relative",
              }}
              draggable={!locked}
              onDragStart={
                locked ? undefined : (e) => onDragStartPlayer(e, p.id)
              }
            >
              {!locked && isAdminOverride && (
                <IconButton
                  size="small"
                  onClick={(e) => handleOpenMenu(e, p.id)}
                  sx={{
                    p: 0.75,
                    mr: 1.5,
                    bgcolor: "action.hover",
                    "&:hover": {
                      bgcolor: "primary.lighter",
                      color: "primary.main",
                    },
                  }}
                >
                  <SwapHorizIcon sx={{ fontSize: "1.25rem" }} />
                </IconButton>
              )}
              <Box sx={{ flexGrow: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, color: "text.primary" }}
                  >
                    {p.user?.name || "Unknown"}
                  </Typography>
                </Stack>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.7rem", display: "block", fontWeight: 500 }}
                >
                  {p.user?.position
                    ? t(`common.positions.${p.user.position.toLowerCase()}`)
                    : t("common.positions.unknown")}
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.5} alignItems="center">
                {(p.member_type === "diarista" ||
                  p.member_type === "convidado") &&
                  (() => {
                    const isPaid = peladaTransactions.some(
                      (t: Transaction) =>
                        t.player_id === p.id &&
                        t.type === "income" &&
                        t.category === "diarista_fee" &&
                        t.status === "paid",
                    );
                    if (isPaid) {
                      return (
                        <Tooltip
                          title={
                            isAdminOverride && onReversePayment
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
                            {isAdminOverride && onReversePayment ? (
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onReversePayment(p.id);
                                }}
                                data-testid="reverse-payment-button"
                                sx={{
                                  color: "success.main",
                                  p: 0.5,
                                  "&:hover": {
                                    color: "error.main",
                                    bgcolor: "error.light",
                                  },
                                }}
                              >
                                <PaidIcon fontSize="small" />
                              </IconButton>
                            ) : (
                              <PaidIcon fontSize="small" />
                            )}
                          </Box>
                        </Tooltip>
                      );
                    } else if (isAdminOverride && onMarkPaid) {
                      return (
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
                              onMarkPaid(
                                p.id,
                                organizationFinance?.diarista_price || 0,
                              );
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
                      );
                    }
                    return null;
                  })()}
                <Typography
                  variant="caption"
                  sx={{
                    minWidth: 24,
                    textAlign: "right",
                    fontWeight: 800,
                    color: "primary.main",
                  }}
                >
                  {p.displayScore}
                </Typography>
              </Stack>
            </Paper>
          );
        })}

        {emptySlots > 0 &&
          Array.from({ length: emptySlots }).map((_, i) => (
            <Box
              key={`empty-${i}`}
              sx={{
                height: 44,
                borderRadius: 2.5,
                border: "1px dashed",
                borderColor: "divider",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "text.disabled",
                bgcolor: "action.hover",
                opacity: 0.5,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {t("peladas.team_card.empty_slot")}
              </Typography>
            </Box>
          ))}
      </Stack>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
        onClick={handleCloseMenu}
        transformOrigin={{ horizontal: "left", vertical: "top" }}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        PaperProps={{
          elevation: 3,
          sx: { borderRadius: 2, minWidth: 180 },
        }}
      >
        {teams
          .filter((t) => t.id !== team.id)
          .map((otherTeam) => (
            <MenuItem
              key={otherTeam.id}
              onClick={() => {
                if (selectedPlayerId)
                  onMoveToTeam?.(selectedPlayerId, otherTeam.id);
                handleCloseMenu();
              }}
            >
              <ListItemIcon>
                <GroupsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>
                {t("peladas.teams.menu.move_to", { name: otherTeam.name })}
              </ListItemText>
            </MenuItem>
          ))}

        <MenuItem
          onClick={() => {
            if (selectedPlayerId) onSendToBench?.(selectedPlayerId);
            handleCloseMenu();
          }}
        >
          <ListItemIcon>
            <ArrowDownwardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t("peladas.teams.menu.send_to_bench")}</ListItemText>
        </MenuItem>

        {hasFixedGoalkeepers && [
          <MenuItem
            key="move-to-home-gk"
            onClick={() => {
              if (selectedPlayerId) onMoveToFixedGk?.(selectedPlayerId, "home");
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
              if (selectedPlayerId) onMoveToFixedGk?.(selectedPlayerId, "away");
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
    </Paper>
  );
}
