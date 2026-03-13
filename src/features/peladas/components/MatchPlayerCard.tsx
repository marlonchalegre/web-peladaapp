import {
  Box,
  Paper,
  Typography,
  IconButton,
  Stack,
  Button,
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
          <Button
            startIcon={<AddIcon />}
            onClick={onSubClick}
            size="small"
            sx={{ textTransform: "none" }}
            data-testid="add-player-button"
          >
            {t("common.add")}
          </Button>
        )}
      </Paper>
    );
  }

  const teamColor =
    player.side === "home" ? theme.palette.home.main : theme.palette.away.main;
  const positionKey = playerData?.position_id
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
        p: { xs: 1.5, sm: 2 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        transition: "all 0.2s",
        minHeight: { xs: 70, sm: 85 },
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        "&:hover": { bgcolor: "action.hover", boxShadow: 1 },
      }}
    >
      <Stack
        direction="row"
        justifyContent={{ xs: "center", sm: "space-between" }}
        alignItems="center"
        flexWrap="wrap"
        sx={{ width: "100%", gap: { xs: 1.5, sm: 1 } }}
      >
        {/* Player Info - Always Left Aligned */}
        <Stack
          direction="row"
          spacing={{ xs: 1.5, sm: 2 }}
          alignItems="center"
          sx={{
            minWidth: { xs: "100%", sm: "180px", md: "200px" },
            flexGrow: 1,
            justifyContent: "flex-start",
          }}
        >
          {/* Sub Button First */}
          {showControls && (
            <Tooltip title={t("common.sub")}>
              <IconButton
                onClick={onSubClick}
                size="small"
                sx={{ color: "text.disabled", p: 0.5 }}
                data-testid="sub-button"
              >
                <SwapHorizIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
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
              width: { xs: 36, sm: 44 },
              height: { xs: 36, sm: 44 },
              fontSize: { xs: "0.85rem", sm: "1rem" },
            }}
          >
            {playerName.substring(0, 2).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: "bold",
                fontSize: { xs: "0.9rem", sm: "1rem" },
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
                mt: -0.5,
                fontSize: "0.65rem",
                fontWeight: "medium",
              }}
            >
              {t(`common.positions.${positionKey}`).toUpperCase()}
            </Typography>
          </Box>
        </Stack>

        {/* Actions Container - Centered on Mobile */}
        <Stack
          direction="row"
          spacing={{ xs: 2, sm: 3 }}
          alignItems="center"
          sx={{
            justifyContent: { xs: "center", sm: "flex-end" },
            width: { xs: "100%", sm: "auto" },
            pt: { xs: 0.5, sm: 0 },
          }}
        >
          {/* Goal Controls/Stats */}
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                fontSize: "0.6rem",
                fontWeight: "bold",
                color: "primary.main",
                mb: 0.5,
              }}
            >
              GOL
            </Typography>
            <Stack
              direction="row"
              alignItems="center"
              sx={{
                border: "1px solid",
                borderColor: "primary.light",
                borderRadius: 1.5,
                overflow: "hidden",
              }}
            >
              {showControls && (
                <IconButton
                  size="small"
                  onClick={() => onStatChange("goal", -1, player.side)}
                  disabled={stats.goals <= 0 || loadingGoals}
                  sx={{ p: { xs: 0.5, sm: 0.75 }, borderRadius: 0 }}
                  data-testid="stat-goals-decrement"
                >
                  <RemoveIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
                </IconButton>
              )}
              <Box
                sx={{
                  minWidth: { xs: 24, sm: 32 },
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: { xs: "0.8rem", sm: "0.9rem" },
                }}
                data-testid="stat-goals-value"
              >
                {loadingGoals ? <CircularProgress size={12} /> : stats.goals}
              </Box>
              {showControls && (
                <IconButton
                  size="small"
                  onClick={() => onStatChange("goal", 1, player.side)}
                  disabled={loadingGoals}
                  sx={{
                    p: { xs: 0.5, sm: 0.75 },
                    borderRadius: 0,
                    color: "primary.main",
                  }}
                  data-testid="stat-goals-increment"
                >
                  <AddIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
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
                fontSize: "0.6rem",
                fontWeight: "bold",
                color: "info.main",
                mb: 0.5,
              }}
            >
              AST
            </Typography>
            <Stack
              direction="row"
              alignItems="center"
              sx={{
                border: "1px solid",
                borderColor: "info.light",
                borderRadius: 1.5,
                overflow: "hidden",
              }}
            >
              {showControls && (
                <IconButton
                  size="small"
                  onClick={() => onStatChange("assist", -1, player.side)}
                  disabled={stats.assists <= 0 || loadingAssists}
                  sx={{ p: { xs: 0.5, sm: 0.75 }, borderRadius: 0 }}
                  data-testid="stat-assists-decrement"
                >
                  <RemoveIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
                </IconButton>
              )}
              <Box
                sx={{
                  minWidth: { xs: 24, sm: 32 },
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: { xs: "0.8rem", sm: "0.9rem" },
                }}
                data-testid="stat-assists-value"
              >
                {loadingAssists ? (
                  <CircularProgress size={12} />
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
                    p: { xs: 0.5, sm: 0.75 },
                    borderRadius: 0,
                    color: "info.main",
                  }}
                  data-testid="stat-assists-increment"
                >
                  <AddIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
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
                fontSize: "0.6rem",
                fontWeight: "bold",
                color: "error.main",
                mb: 0.5,
              }}
            >
              GC
            </Typography>
            <Stack
              direction="row"
              alignItems="center"
              sx={{
                border: "1px solid",
                borderColor: "error.light",
                borderRadius: 1.5,
                overflow: "hidden",
              }}
            >
              {showControls && (
                <IconButton
                  size="small"
                  onClick={() => onStatChange("own_goal", -1, player.side)}
                  disabled={stats.ownGoals <= 0 || loadingOwnGoals}
                  sx={{ p: { xs: 0.5, sm: 0.75 }, borderRadius: 0 }}
                  data-testid="stat-own-goals-decrement"
                >
                  <RemoveIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
                </IconButton>
              )}
              <Box
                sx={{
                  minWidth: { xs: 24, sm: 32 },
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: { xs: "0.8rem", sm: "0.9rem" },
                  color: stats.ownGoals > 0 ? "error.main" : "inherit",
                }}
                data-testid="stat-own-goals-value"
              >
                {loadingOwnGoals ? (
                  <CircularProgress size={14} />
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
                    p: { xs: 0.5, sm: 0.75 },
                    borderRadius: 0,
                    color: "error.main",
                  }}
                  data-testid="stat-own-goals-increment"
                >
                  <AddIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
                </IconButton>
              )}
            </Stack>
          </Box>
        </Stack>
      </Stack>
    </Paper>
  );
}
