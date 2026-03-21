import {
  Box,
  Paper,
  Typography,
  IconButton,
  Stack,
  Avatar,
  CircularProgress,
  Tooltip,
  useTheme,
  alpha,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { useTranslation } from "react-i18next";
import type { TeamPlayer, Player } from "../../../shared/api/endpoints";

interface MatchPlayerCardProps {
  player: TeamPlayer & { isEmpty?: boolean; side: "home" | "away" };
  playerName: string;
  playerData?: Player;
  stats: { goals: number; assists: number; ownGoals: number };
  finished: boolean;
  isAdmin: boolean;
  loadingGoals: boolean;
  loadingAssists: boolean;
  loadingOwnGoals: boolean;
  onStatChange: (
    type: "goal" | "assist" | "own_goal",
    diff: number,
    side: "home" | "away",
  ) => void;
  onSubClick: () => void;
}

export default function MatchPlayerCard({
  player,
  playerName,
  playerData,
  stats,
  finished,
  isAdmin,
  loadingGoals,
  loadingAssists,
  loadingOwnGoals,
  onStatChange,
  onSubClick,
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
        p: { xs: 1, sm: 1, md: 1.25 },
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
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        sx={{ width: "100%", gap: { xs: 1, md: 1 } }}
      >
        {/* Top Section: Player Info */}
        <Stack
          direction="row"
          spacing={{ xs: 1, sm: 1, md: 1.25 }}
          alignItems="center"
          sx={{ minWidth: 0, flexGrow: 1 }}
        >
          {showControls && (
            <Tooltip title={t("common.sub")}>
              <IconButton
                onClick={onSubClick}
                size="small"
                sx={{ color: "text.disabled", p: 0.15 }}
                data-testid="sub-button"
              >
                <SwapHorizIcon sx={{ fontSize: { xs: 18, sm: 18, md: 20 } }} />
              </IconButton>
            </Tooltip>
          )}

          <Avatar
            sx={{
              bgcolor: "transparent",
              color: teamColor,
              border: "2px solid",
              borderColor: teamColor,
              fontWeight: "bold",
              width: { xs: 28, sm: 30, md: 34 },
              height: { xs: 28, sm: 30, md: 34 },
              fontSize: { xs: "0.65rem", sm: "0.75rem", md: "0.8rem" },
              flexShrink: 0,
            }}
          >
            {playerName.substring(0, 2).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: "bold",
                fontSize: { xs: "0.8rem", sm: "0.85rem", md: "0.9rem" },
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              data-testid="player-name"
            >
              {playerName}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "block",
                mt: -0.25,
                fontSize: "0.55rem",
                fontWeight: "medium",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {t(`common.positions.${positionKey}`).toUpperCase()}
            </Typography>
          </Box>
        </Stack>

        {/* Bottom/Right Section: Actions Container */}
        <Stack
          direction="row"
          spacing={{ xs: 1, sm: 1.5, md: 1 }}
          alignItems="center"
          sx={{
            justifyContent: { xs: "flex-start", md: "flex-end" },
            pl: { xs: showControls ? 9.5 : 5, md: 0 }, // Align with name on mobile/tablet
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
                width: showControls ? "auto" : { xs: 24, sm: 26, md: 30 },
                height: showControls ? "auto" : { xs: 24, sm: 26, md: 30 },
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
                  disabled={stats.goals <= 0 || loadingGoals}
                  sx={{ p: { xs: 0.25, sm: 0.3, md: 0.4 }, borderRadius: 0 }}
                  data-testid="stat-goals-decrement"
                >
                  <RemoveIcon sx={{ fontSize: { xs: 12, sm: 12, md: 14 } }} />
                </IconButton>
              )}
              <Box
                sx={{
                  minWidth: showControls ? { xs: 18, sm: 20, md: 22 } : "auto",
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: { xs: "0.7rem", sm: "0.75rem", md: "0.8rem" },
                  color: stats.goals > 0 ? "success.main" : "text.secondary",
                }}
                data-testid="stat-goals-value"
              >
                {loadingGoals ? <CircularProgress size={10} /> : stats.goals}
              </Box>
              {showControls && (
                <IconButton
                  size="small"
                  onClick={() => onStatChange("goal", 1, player.side)}
                  disabled={loadingGoals}
                  sx={{
                    p: { xs: 0.25, sm: 0.3, md: 0.4 },
                    borderRadius: 0,
                    color: "success.main",
                  }}
                  data-testid="stat-goals-increment"
                >
                  <AddIcon sx={{ fontSize: { xs: 12, sm: 12, md: 14 } }} />
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
                width: showControls ? "auto" : { xs: 24, sm: 26, md: 30 },
                height: showControls ? "auto" : { xs: 24, sm: 26, md: 30 },
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
                  disabled={stats.assists <= 0 || loadingAssists}
                  sx={{ p: { xs: 0.25, sm: 0.3, md: 0.4 }, borderRadius: 0 }}
                  data-testid="stat-assists-decrement"
                >
                  <RemoveIcon sx={{ fontSize: { xs: 12, sm: 12, md: 14 } }} />
                </IconButton>
              )}
              <Box
                sx={{
                  minWidth: showControls ? { xs: 18, sm: 20, md: 22 } : "auto",
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: { xs: "0.7rem", sm: "0.75rem", md: "0.8rem" },
                  color: stats.assists > 0 ? "info.main" : "text.secondary",
                }}
                data-testid="stat-assists-value"
              >
                {loadingAssists ? (
                  <CircularProgress size={10} />
                ) : (
                  stats.assists
                )}
              </Box>
              {showControls && (
                <IconButton
                  size="small"
                  onClick={() => onStatChange("assist", 1, player.side)}
                  disabled={loadingAssists}
                  sx={{
                    p: { xs: 0.25, sm: 0.3, md: 0.4 },
                    borderRadius: 0,
                    color: "info.main",
                  }}
                  data-testid="stat-assists-increment"
                >
                  <AddIcon sx={{ fontSize: { xs: 12, sm: 12, md: 14 } }} />
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
                width: showControls ? "auto" : { xs: 24, sm: 26, md: 30 },
                height: showControls ? "auto" : { xs: 24, sm: 26, md: 30 },
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
                  disabled={stats.ownGoals <= 0 || loadingOwnGoals}
                  sx={{ p: { xs: 0.25, sm: 0.3, md: 0.4 }, borderRadius: 0 }}
                  data-testid="stat-own-goals-decrement"
                >
                  <RemoveIcon sx={{ fontSize: { xs: 12, sm: 12, md: 14 } }} />
                </IconButton>
              )}
              <Box
                sx={{
                  minWidth: showControls ? { xs: 18, sm: 20, md: 22 } : "auto",
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: { xs: "0.7rem", sm: "0.75rem", md: "0.8rem" },
                  color: stats.ownGoals > 0 ? "error.main" : "text.secondary",
                }}
                data-testid="stat-own-goals-value"
              >
                {loadingOwnGoals ? (
                  <CircularProgress size={10} />
                ) : (
                  stats.ownGoals
                )}
              </Box>
              {showControls && (
                <IconButton
                  size="small"
                  onClick={() => onStatChange("own_goal", 1, player.side)}
                  disabled={loadingOwnGoals}
                  sx={{
                    p: { xs: 0.25, sm: 0.3, md: 0.4 },
                    borderRadius: 0,
                    color: stats.ownGoals > 0 ? "error.main" : "text.disabled",
                  }}
                  data-testid="stat-own-goals-increment"
                >
                  <AddIcon sx={{ fontSize: { xs: 12, sm: 12, md: 14 } }} />
                </IconButton>
              )}
            </Stack>
          </Box>
        </Stack>
      </Stack>
    </Paper>
  );
}
