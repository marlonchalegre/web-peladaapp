import {
  Box,
  Paper,
  Typography,
  IconButton,
  Stack,
  Avatar,
  Tooltip,
  useTheme,
  alpha,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PaidIcon from "@mui/icons-material/Paid";
import { useTranslation } from "react-i18next";
import type { TeamPlayer, Player } from "../../../shared/api/endpoints";

interface MatchPlayerCardProps {
  player: TeamPlayer & { isEmpty?: boolean; side: "home" | "away" };
  playerName: string;
  playerData?: Player;
  stats: { goals: number; assists: number; ownGoals: number };
  finished: boolean;
  isAdmin: boolean;
  onStatChange: (
    type: "goal" | "assist" | "own_goal",
    diff: number,
    side: "home" | "away",
  ) => void;
  onSubClick: () => void;
  isPaid?: boolean;
  onMarkPaid?: () => void;
}

export default function MatchPlayerCard({
  player,
  playerName,
  playerData,
  stats,
  finished,
  isAdmin,
  onStatChange,
  onSubClick,
  isPaid,
  onMarkPaid,
}: MatchPlayerCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  if (player.isEmpty) {
    return (
      <Paper
        variant="outlined"
        data-testid="player-row-empty"
        sx={{
          p: { xs: 1.5, sm: 1.5, md: 2.5 },
          borderRadius: 2,
          borderStyle: "dashed",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "action.hover",
          minHeight: { xs: 60, sm: 60, md: 80 },
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            sx={{
              bgcolor: "text.disabled",
              width: { xs: 32, sm: 32, md: 40 },
              height: { xs: 32, sm: 32, md: 40 },
            }}
          >
            <PersonAddIcon fontSize="small" />
          </Avatar>
          <Typography variant="body2" color="text.secondary">
            {t("peladas.dashboard.empty_slot")}
          </Typography>
        </Stack>
        {isAdmin && !finished && (
          <IconButton onClick={onSubClick} size="small" color="primary">
            <AddIcon />
          </IconButton>
        )}
      </Paper>
    );
  }

  const teamColor =
    player.side === "home" ? theme.palette.home.main : theme.palette.away.main;

  const positionKey = player.is_goalkeeper
    ? "goalkeeper"
    : playerData?.position_id
      ? ["goalkeeper", "defender", "midfielder", "striker"][
          playerData.position_id - 1
        ]
      : "player";

  const showControls = isAdmin && !finished;

  return (
    <Paper
      elevation={0}
      data-testid="player-row"
      sx={{
        p: { xs: 1.25, sm: 1.5 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        transition: "all 0.2s",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        overflow: "hidden",
        "&:hover": { bgcolor: "action.hover", boxShadow: 1 },
      }}
    >
      <Stack spacing={1.5}>
        {/* Top Row: Sub Icon + Player Info */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          {showControls && (
            <Tooltip title={t("common.sub")}>
              <IconButton
                onClick={onSubClick}
                size="small"
                sx={{
                  color: teamColor,
                  p: { xs: 0.4, sm: 0.6 },
                  bgcolor: alpha(teamColor, 0.08),
                  border: "1px solid",
                  borderColor: alpha(teamColor, 0.12),
                  "&:hover": {
                    bgcolor: alpha(teamColor, 0.16),
                    borderColor: alpha(teamColor, 0.2),
                  },
                }}
                data-testid="sub-button"
              >
                <SwapHorizIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
              </IconButton>
            </Tooltip>
          )}

          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: "bold",
                fontSize: { xs: "0.85rem", sm: "1rem" },
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                lineHeight: 1.2,
              }}
              data-testid="player-name"
            >
              {playerName}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: "block",
                  fontSize: { xs: "0.65rem", sm: "0.75rem" },
                  fontWeight: "medium",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {t(`common.positions.${positionKey}`).toUpperCase()}
              </Typography>
              {playerData &&
                (playerData.member_type === "diarista" ||
                  playerData.member_type === "convidado") &&
                (() => {
                  if (isPaid) {
                    return (
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
                          <PaidIcon
                            sx={{ fontSize: "1rem" }}
                            data-testid="paid-icon"
                          />
                        </Box>
                      </Tooltip>
                    );
                  } else if (isAdmin && onMarkPaid) {
                    return (
                      <Tooltip
                        title={t(
                          "organizations.management.finance.monthly_fees.mark_as_paid",
                          "Marcar como Pago",
                        )}
                      >
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkPaid();
                          }}
                          data-testid="mark-as-paid-button"
                          sx={{
                            color: "warning.main",
                            p: 0.25,
                            "&:hover": {
                              color: "success.main",
                              bgcolor: "success.light",
                            },
                          }}
                        >
                          <AttachMoneyIcon sx={{ fontSize: "1rem" }} />
                        </IconButton>
                      </Tooltip>
                    );
                  } else {
                    return (
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
                          <AttachMoneyIcon sx={{ fontSize: "1rem" }} />
                        </Box>
                      </Tooltip>
                    );
                  }
                })()}
            </Stack>
          </Box>
        </Stack>

        {/* Bottom Row: Actions Container (Left Aligned) */}
        <Stack
          direction="row"
          spacing={{ xs: 1.5, sm: 2 }}
          alignItems="center"
          sx={{
            justifyContent: "flex-start",
            pl: showControls ? 0 : 0, // Simplified, no offset needed in this vertical stack
            flexShrink: 0,
          }}
        >
          {/* Goal Controls/Stats */}
          <Box sx={{ textAlign: "center", flexShrink: 0 }}>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                fontSize: "0.5rem",
                fontWeight: "bold",
                color: "success.main",
                mb: 0.1,
                opacity: 0.8,
              }}
            >
              {t("common.goals_short")}
            </Typography>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              sx={{
                border: "2px solid",
                borderColor: "success.main",
                borderRadius: showControls ? 1.5 : "50%",
                width: showControls ? "auto" : { xs: 26, sm: 28, md: 32 },
                height: showControls ? "auto" : { xs: 26, sm: 28, md: 32 },
                overflow: "hidden",
                bgcolor:
                  stats.goals > 0 && !showControls
                    ? alpha(theme.palette.success.main, 0.05)
                    : "background.paper",
                transition: "all 0.2s",
              }}
            >
              {showControls && (
                <IconButton
                  size="small"
                  onClick={() => onStatChange("goal", -1, player.side)}
                  disabled={stats.goals <= 0}
                  sx={{ p: { xs: 0.4, sm: 0.6, md: 0.8 }, borderRadius: 0 }}
                  data-testid="stat-goals-decrement"
                >
                  <RemoveIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 } }} />
                </IconButton>
              )}
              <Box
                sx={{
                  minWidth: showControls ? { xs: 20, sm: 24, md: 28 } : "auto",
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: { xs: "0.8rem", sm: "0.85rem", md: "1rem" },
                  color: stats.goals > 0 ? "success.main" : "text.secondary",
                }}
                data-testid="stat-goals-value"
              >
                {stats.goals}
              </Box>
              {showControls && (
                <IconButton
                  size="small"
                  onClick={() => onStatChange("goal", 1, player.side)}
                  sx={{
                    p: { xs: 0.4, sm: 0.6, md: 0.8 },
                    borderRadius: 0,
                    color: "success.main",
                  }}
                  data-testid="stat-goals-increment"
                >
                  <AddIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 } }} />
                </IconButton>
              )}
            </Stack>
          </Box>

          {/* Assist Controls/Stats */}
          <Box sx={{ textAlign: "center", flexShrink: 0 }}>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                fontSize: "0.5rem",
                fontWeight: "bold",
                color: "info.main",
                mb: 0.1,
                opacity: 0.8,
              }}
            >
              {t("common.assists_short")}
            </Typography>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              sx={{
                border: "2px solid",
                borderColor: "info.light",
                borderRadius: showControls ? 1.5 : "50%",
                width: showControls ? "auto" : { xs: 26, sm: 28, md: 32 },
                height: showControls ? "auto" : { xs: 26, sm: 28, md: 32 },
                overflow: "hidden",
                bgcolor:
                  stats.assists > 0 && !showControls
                    ? alpha(theme.palette.primary.main, 0.05)
                    : "background.paper",
                transition: "all 0.2s",
              }}
            >
              {showControls && (
                <IconButton
                  size="small"
                  onClick={() => onStatChange("assist", -1, player.side)}
                  disabled={stats.assists <= 0}
                  sx={{ p: { xs: 0.4, sm: 0.6, md: 0.8 }, borderRadius: 0 }}
                  data-testid="stat-assists-decrement"
                >
                  <RemoveIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 } }} />
                </IconButton>
              )}
              <Box
                sx={{
                  minWidth: showControls ? { xs: 20, sm: 24, md: 28 } : "auto",
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: { xs: "0.8rem", sm: "0.85rem", md: "1rem" },
                  color: stats.assists > 0 ? "info.main" : "text.secondary",
                }}
                data-testid="stat-assists-value"
              >
                {stats.assists}
              </Box>
              {showControls && (
                <IconButton
                  size="small"
                  onClick={() => onStatChange("assist", 1, player.side)}
                  sx={{
                    p: { xs: 0.4, sm: 0.6, md: 0.8 },
                    borderRadius: 0,
                    color: "info.main",
                  }}
                  data-testid="stat-assists-increment"
                >
                  <AddIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 } }} />
                </IconButton>
              )}
            </Stack>
          </Box>

          {/* Own Goal Controls/Stats */}
          <Box sx={{ textAlign: "center", flexShrink: 0 }}>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                fontSize: "0.5rem",
                fontWeight: "bold",
                color: stats.ownGoals > 0 ? "error.main" : "text.secondary",
                mb: 0.1,
                opacity: 0.8,
              }}
            >
              {t("common.own_goals_short")}
            </Typography>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              sx={{
                border: "2px solid",
                borderColor: stats.ownGoals > 0 ? "error.light" : "divider",
                borderRadius: showControls ? 1.5 : "50%",
                width: showControls ? "auto" : { xs: 26, sm: 28, md: 32 },
                height: showControls ? "auto" : { xs: 26, sm: 28, md: 32 },
                overflow: "hidden",
                bgcolor:
                  stats.ownGoals > 0 && !showControls
                    ? alpha(theme.palette.error.main, 0.05)
                    : "background.paper",
                transition: "all 0.2s",
              }}
            >
              {showControls && (
                <IconButton
                  size="small"
                  onClick={() => onStatChange("own_goal", -1, player.side)}
                  disabled={stats.ownGoals <= 0}
                  sx={{ p: { xs: 0.4, sm: 0.6, md: 0.8 }, borderRadius: 0 }}
                  data-testid="stat-own-goals-decrement"
                >
                  <RemoveIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 } }} />
                </IconButton>
              )}
              <Box
                sx={{
                  minWidth: showControls ? { xs: 20, sm: 24, md: 28 } : "auto",
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: { xs: "0.8rem", sm: "0.85rem", md: "1rem" },
                  color: stats.ownGoals > 0 ? "error.main" : "text.secondary",
                }}
                data-testid="stat-own-goals-value"
              >
                {stats.ownGoals}
              </Box>
              {showControls && (
                <IconButton
                  size="small"
                  onClick={() => onStatChange("own_goal", 1, player.side)}
                  sx={{
                    p: { xs: 0.4, sm: 0.6, md: 0.8 },
                    borderRadius: 0,
                    color: stats.ownGoals > 0 ? "error.main" : "text.disabled",
                  }}
                  data-testid="stat-own-goals-increment"
                >
                  <AddIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 } }} />
                </IconButton>
              )}
            </Stack>
          </Box>
        </Stack>
      </Stack>
    </Paper>
  );
}
