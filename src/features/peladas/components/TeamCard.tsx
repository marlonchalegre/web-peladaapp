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

  const sortedPlayers = [...players].sort((a, b) => {
    if (a.is_goalkeeper && !b.is_goalkeeper) return -1;
    if (!a.is_goalkeeper && b.is_goalkeeper) return 1;

    const order: Record<string, number> = {
      Defender: 1,
      Midfielder: 2,
      Striker: 3,
    };
    const posA = order[a.user?.position || ""] ?? 4;
    const posB = order[b.user?.position || ""] ?? 4;
    return posA - posB;
  });

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);

  return (
    <Paper
      elevation={0}
      variant="outlined"
      data-testid="team-card"
      sx={{
        p: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 4,
        borderColor: "divider",
        bgcolor: "background.paper",
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: "bold", fontSize: "1.1rem" }}
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
                height: 22,
                fontSize: "0.65rem",
                fontWeight: "bold",
                bgcolor: "primary.light",
                color: "primary.main",
                borderRadius: 1,
              }}
            />
          )}
        </Box>
        {!locked && (
          <IconButton
            size="small"
            onClick={onDelete}
            aria-label={t("peladas.team_card.delete")}
            sx={{ color: "text.secondary" }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Stack spacing={1.5} sx={{ flexGrow: 1 }}>
        {sortedPlayers.map((p) => {
          return (
            <Paper
              key={p.id}
              elevation={0}
              sx={{
                p: 1.5,
                display: "flex",
                alignItems: "center",
                bgcolor: p.is_goalkeeper
                  ? "primary.light"
                  : "background.default",
                borderRadius: 3,
                cursor: locked ? "default" : "grab",
                border: "1px solid transparent",
                borderColor: p.is_goalkeeper ? "primary.main" : "transparent",
                "&:hover": {
                  borderColor: p.is_goalkeeper ? "primary.main" : "divider",
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
                  width: 32,
                  height: 32,
                  fontSize: 12,
                  bgcolor: stringToColor(p.user?.name || ""),
                  mr: 1.5,
                  fontWeight: "bold",
                }}
              >
                {getInitials(p.user?.name || "")}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
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
                        fontWeight: "bold",
                      }}
                    />
                  )}
                </Stack>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.7rem", display: "block" }}
                >
                  {p.user?.position
                    ? t(`common.positions.${p.user.position.toLowerCase()}`)
                    : t("common.positions.unknown")}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={p.displayScore ?? "-"}
                  size="small"
                  sx={{
                    height: 24,
                    bgcolor: "success.light",
                    color: "success.main",
                    fontWeight: "bold",
                    borderRadius: 1,
                  }}
                />
                {!locked && (
                  <IconButton
                    size="small"
                    onClick={(e) => handleOpenMenu(e, p.id)}
                    sx={{ p: 0.5 }}
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
                borderRadius: 3,
                bgcolor: "grey.100",
                color: "text.secondary",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 52,
                fontSize: "0.85rem",
                fontWeight: 500,
                border: "1px dashed",
                borderColor: "divider",
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
