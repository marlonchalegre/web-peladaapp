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
          p: { xs: 1.5, sm: 2.5 },
          borderRadius: 2,
          borderStyle: "dashed",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "action.hover",
          minHeight: { xs: 60, sm: 80 },
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            sx={{
              bgcolor: "text.disabled",
              width: { xs: 32, sm: 40 },
              height: { xs: 32, sm: 40 },
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
        p: { xs: 1, sm: 1.25 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        transition: "all 0.2s",
        minHeight: { xs: 65, sm: 75 },
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        overflow: "hidden",
        "&:hover": { bgcolor: "action.hover", boxShadow: 1 },
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ width: "100%", gap: 0.5, flexWrap: "wrap" }}
      >
        {/* Player Info */}
        <Stack
          direction="row"
          spacing={{ xs: 1, sm: 1.25 }}
          alignItems="center"
          sx={{
            minWidth: 0,
            flexGrow: 1,
            flexShrink: 1,
            justifyContent: "flex-start",
            mr: 0.5,
          }}
        >
          {/* Sub Button First */}
          {showControls && (
            <Tooltip title={t("common.sub")}>
              <IconButton
                onClick={onSubClick}
                size="small"
                sx={{ color: "text.disabled", p: 0.25 }}
                data-testid="sub-button"
              >
                <SwapHorizIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
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
              width: { xs: 28, sm: 34 },
              height: { xs: 28, sm: 34 },
              fontSize: { xs: "0.7rem", sm: "0.8rem" },
              flexShrink: 0,
            }}
          >
            {playerName.substring(0, 2).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0, flexGrow: 1, flexShrink: 1 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: "bold",
                fontSize: { xs: "0.8rem", sm: "0.9rem" },
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

        {/* Actions Container */}
        <Stack
          direction="row"
          spacing={{ xs: 0.75, sm: 1 }}
          alignItems="center"
          sx={{
            justifyContent: "flex-end",
            flexShrink: 0,
            py: 0.25,
          }}
        >
          {/* Goal Controls/Stats */}
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                fontSize: "0.5rem",
                fontWeight: "bold",
                color: "success.main",
                mb: 0.15,
              }}
            >
              {t("common.goals_short")}
            </Typography>
            <Stack
              direction="row"
              alignItems="center"
              sx={{
                border: "2px solid",
                borderColor: "success.main",
                borderRadius: 1.5,
                overflow: "hidden",
                bgcolor: "background.paper",
              }}
            >
              {showControls && (
                <IconButton
                  size="small"
                  onClick={() => onStatChange("goal", -1, player.side)}
                  disabled={stats.goals <= 0 || loadingGoals}
                  sx={{ p: { xs: 0.25, sm: 0.4 }, borderRadius: 0 }}
                  data-testid="stat-goals-decrement"
                >
                  <RemoveIcon sx={{ fontSize: { xs: 12, sm: 14 } }} />
                </IconButton>
              )}
              <Box
                sx={{
                  minWidth: { xs: 18, sm: 22 },
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: { xs: "0.7rem", sm: "0.8rem" },
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
                    p: { xs: 0.25, sm: 0.4 },
                    borderRadius: 0,
                    color: "success.main",
                  }}
                  data-testid="stat-goals-increment"
                >
                  <AddIcon sx={{ fontSize: { xs: 12, sm: 14 } }} />
                </IconButton>
              )}
            </Stack>
          </Box>

          {/* Assist Controls/Stats */}
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                fontSize: "0.5rem",
                fontWeight: "bold",
                color: "info.main",
                mb: 0.15,
              }}
            >
              {t("common.assists_short")}
            </Typography>
            <Stack
              direction="row"
              alignItems="center"
              sx={{
                border: "2px solid",
                borderColor: "info.light",
                borderRadius: 1.5,
                overflow: "hidden",
                bgcolor: "background.paper",
              }}
            >
              {showControls && (
                <IconButton
                  size="small"
                  onClick={() => onStatChange("assist", -1, player.side)}
                  disabled={stats.assists <= 0 || loadingAssists}
                  sx={{ p: { xs: 0.25, sm: 0.4 }, borderRadius: 0 }}
                  data-testid="stat-assists-decrement"
                >
                  <RemoveIcon sx={{ fontSize: { xs: 12, sm: 14 } }} />
                </IconButton>
              )}
              <Box
                sx={{
                  minWidth: { xs: 18, sm: 22 },
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: { xs: "0.7rem", sm: "0.8rem" },
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
                    p: { xs: 0.25, sm: 0.4 },
                    borderRadius: 0,
                    color: "info.main",
                  }}
                  data-testid="stat-assists-increment"
                >
                  <AddIcon sx={{ fontSize: { xs: 12, sm: 14 } }} />
                </IconButton>
              )}
            </Stack>
          </Box>

          {/* Own Goal Controls/Stats */}
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                fontSize: "0.5rem",
                fontWeight: "bold",
                color: stats.ownGoals > 0 ? "error.main" : "text.secondary",
                mb: 0.15,
              }}
            >
              {t("common.own_goals_short")}
            </Typography>
            <Stack
              direction="row"
              alignItems="center"
              sx={{
                border: "2px solid",
                borderColor: stats.ownGoals > 0 ? "error.light" : "divider",
                borderRadius: 1.5,
                overflow: "hidden",
                bgcolor:
                  stats.ownGoals > 0 ? "error.lighter" : "background.paper",
              }}
            >
              {showControls && (
                <IconButton
                  size="small"
                  onClick={() => onStatChange("own_goal", -1, player.side)}
                  disabled={stats.ownGoals <= 0 || loadingOwnGoals}
                  sx={{ p: { xs: 0.25, sm: 0.4 }, borderRadius: 0 }}
                  data-testid="stat-own-goals-decrement"
                >
                  <RemoveIcon sx={{ fontSize: { xs: 12, sm: 14 } }} />
                </IconButton>
              )}
              <Box
                sx={{
                  minWidth: { xs: 18, sm: 22 },
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: { xs: "0.7rem", sm: "0.8rem" },
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
                    p: { xs: 0.25, sm: 0.4 },
                    borderRadius: 0,
                    color: stats.ownGoals > 0 ? "error.main" : "text.disabled",
                  }}
                  data-testid="stat-own-goals-increment"
                >
                  <AddIcon sx={{ fontSize: { xs: 12, sm: 14 } }} />
                </IconButton>
              )}
            </Stack>
          </Box>
        </Stack>
      </Stack>
    </Paper>
  );
}
