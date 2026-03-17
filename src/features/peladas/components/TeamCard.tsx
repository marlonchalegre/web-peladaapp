import {
  Paper,
  Typography,
  Box,
  IconButton,
  Chip,
  Avatar,
  Stack,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SportsScoreIcon from "@mui/icons-material/SportsScore";
import { useState } from "react";
import type { DragEvent, MouseEvent } from "react";
import type { Player, Team, User } from "../../../shared/api/endpoints";
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
  onSetGoalkeeper?: (playerId: number) => Promise<void>;
  onRemovePlayer?: (playerId: number) => Promise<void>;
  locked?: boolean;
  fixedGoalkeepersEnabled?: boolean;
  isAdminOverride?: boolean;
};

export default function TeamCard({
  team,
  players,
  averageScore,
  maxPlayers = 5,
  onDelete,
  onDrop,
  onDragStartPlayer,
  onSetGoalkeeper,
  onRemovePlayer,
  locked,
  fixedGoalkeepersEnabled,
  isAdminOverride = false,
}: TeamCardProps) {
  const { t } = useTranslation();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<null | number>(null);

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

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);

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
        borderColor: "divider",
        bgcolor: "background.paper",
        boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
        overflow: "hidden",
        transition: "all 0.2s ease-in-out",
        "&.droppable--over": {
          borderColor: "primary.main",
          bgcolor: "primary.lighter",
          transform: "translateY(-4px)",
          boxShadow: "0 8px 24px rgba(25, 118, 210, 0.12)",
        },
      }}
      className={locked ? undefined : "droppable"}
      onDragOver={locked ? undefined : (e) => e.preventDefault()}
      onDragEnter={
        locked
          ? undefined
          : (e) => e.currentTarget.classList.add("droppable--over")
      }
      onDragLeave={
        locked
          ? undefined
          : (e) => e.currentTarget.classList.remove("droppable--over")
      }
      onDrop={
        locked
          ? undefined
          : async (e) => {
              e.preventDefault();
              e.stopPropagation();
              const target = e.currentTarget;
              try {
                await onDrop(e);
              } finally {
                target.classList.remove("droppable--over");
              }
            }
      }
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          pb: 1.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          bgcolor: "rgba(0,0,0,0.02)",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              fontSize: "1.15rem",
              color: "text.primary",
              letterSpacing: -0.5,
            }}
            data-testid="team-card-name"
          >
            {team.name}
          </Typography>
          {averageScore !== null && (
            <Chip
              label={t("peladas.team_card.average", {
                score: averageScore.toFixed(1),
              })}
              size="small"
              sx={{
                mt: 0.5,
                height: 20,
                fontSize: "0.65rem",
                fontWeight: 900,
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
                bgcolor: p.is_goalkeeper
                  ? "primary.lighter"
                  : "background.default",
                borderRadius: 2.5,
                cursor: locked ? "default" : "grab",
                border: "1px solid",
                borderColor: p.is_goalkeeper ? "primary.light" : "divider",
                transition: "all 0.2s",
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: p.is_goalkeeper ? "primary.lighter" : "action.hover",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                },
                position: "relative",
              }}
              draggable={!locked}
              onDragStart={
                locked ? undefined : (e) => onDragStartPlayer(e, p.id)
              }
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  fontSize: 14,
                  bgcolor: stringToColor(p.user?.name || ""),
                  mr: 1.5,
                  fontWeight: 800,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                {getInitials(p.user?.name || "")}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, color: "text.primary" }}
                  >
                    {p.user?.name || "Unknown"}
                  </Typography>
                  {p.is_goalkeeper && (
                    <Chip
                      label="GK"
                      size="small"
                      color="primary"
                      sx={{
                        height: 16,
                        fontSize: "0.6rem",
                        fontWeight: 900,
                      }}
                    />
                  )}
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
                  {p.displayScore ?? "-"}
                </Box>
                {!locked && isAdminOverride && (
                  <IconButton
                    size="small"
                    onClick={(e) => handleOpenMenu(e, p.id)}
                    sx={{ p: 0.5, color: "text.disabled" }}
                    aria-label={`more-${p.user?.name}`}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>
            </Paper>
          );
        })}

        {/* Placeholder for "Arraste um jogador" */}
        {!locked &&
          Array.from({ length: emptySlots }).map((_, i) => (
            <Box
              key={`placeholder-${i}`}
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: "background.default",
                color: "text.disabled",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 56,
                fontSize: "0.8rem",
                fontWeight: 600,
                border: "1.5px dashed",
                borderColor: "divider",
                transition: "all 0.2s",
                "&:hover": {
                  borderColor: "text.disabled",
                  bgcolor: "action.hover",
                },
              }}
            >
              {t("peladas.team_card.drag_placeholder")}
            </Box>
          ))}
      </Stack>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
      >
        {fixedGoalkeepersEnabled &&
          selectedPlayer &&
          !selectedPlayer.is_goalkeeper && (
            <MenuItem
              onClick={async () => {
                if (selectedPlayerId && onSetGoalkeeper) {
                  await onSetGoalkeeper(selectedPlayerId);
                }
                handleCloseMenu();
              }}
            >
              <ListItemIcon>
                <SportsScoreIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText>
                {t("peladas.teams.menu.set_goalkeeper")}
              </ListItemText>
            </MenuItem>
          )}
        <MenuItem
          onClick={async () => {
            if (selectedPlayerId && onRemovePlayer) {
              await onRemovePlayer(selectedPlayerId);
            }
            handleCloseMenu();
          }}
        >
          <ListItemIcon>
            <DeleteOutlineIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: "error.main" }}>
            {t("peladas.teams.menu.remove_player")}
          </ListItemText>
        </MenuItem>
      </Menu>
    </Paper>
  );
}

// Helpers
function stringToColor(string: string) {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
